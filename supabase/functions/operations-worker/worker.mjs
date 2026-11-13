import { TASKS, LEDGER, MEMBERS, SITE, koreanDay, when, text, title, readText, done, stepDone, plan, payment, emailBody } from './domain.mjs';
import { checkServiceHealth } from './health.mjs';

export function createWorker(env, fetcher = fetch) {
  let deadline;
  const checkTime = () => { if (Date.now() > deadline) throw new Error('실행 시간 한도'); };
  async function request(url, options = {}) {
    checkTime();
    const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`${new URL(url).hostname} HTTP ${response.status}`);
    return response.status === 204 ? null : response.json();
  }
  const db = (path, method = 'GET', body) => request(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    method, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }, ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  const state = async key => (await db(`operations_state?key=eq.${encodeURIComponent(key)}&select=value`))[0]?.value;
  const save = (key, value) => db('operations_state', 'POST', { key, value, updated_at: new Date().toISOString() });
  const notion = (path, method = 'GET', body) => request(`https://api.notion.com/v1/${path}`, {
    method, headers: { Authorization: `Bearer ${env.OPS_NOTION_TOKEN}`, 'Notion-Version': '2025-09-03', 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  async function query(source, filter) {
    const rows = []; let cursor;
    do {
      const page = await notion(`data_sources/${source}/query`, 'POST', { page_size: 100, ...(filter ? { filter } : {}), ...(cursor ? { start_cursor: cursor } : {}) });
      rows.push(...page.results); cursor = page.has_more ? page.next_cursor : null;
    } while (cursor);
    return rows;
  }
  async function ensurePage(source, keyProperty, key, properties) {
    const found = await query(source, { property: keyProperty, rich_text: { equals: key } });
    if (found.length > 1) throw new Error('노션 중복 항목 확인 필요');
    if (found.length) return found[0];
    // 생성 응답을 잃은 경우 재생성하지 않습니다. 다음 실행에서 조회로 복구합니다.
    if (await state(`notion-create:${key}`)) throw new Error('노션 생성 결과 확인 필요');
    await save(`notion-create:${key}`, { status: 'pending' });
    const page = await notion('pages', 'POST', { parent: { type: 'data_source_id', data_source_id: source }, properties: { ...properties, [keyProperty]: text(key) } });
    await save(`notion-create:${key}`, { status: 'created', pageId: page.id });
    return page;
  }
  async function send(key, subject, body) {
    const prior = await state(`mail:${key}`);
    if (prior?.status === 'accepted') return;
    // Resend의 24시간 중복 방지 기간이 지난 불확실한 발송은 자동 재시도하지 않습니다.
    if (prior && Date.now() - Date.parse(prior.startedAt) > 23 * 3600000) throw new Error('메일 접수 이력 확인 필요');
    const payload = prior?.payload || { from: env.OPS_MAIL_FROM, to: [env.OPS_MAIL_TO], subject, text: body };
    if (!prior) await save(`mail:${key}`, { status: 'pending', startedAt: new Date().toISOString(), payload });
    const idempotency = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key))), x => x.toString(16).padStart(2, '0')).join('');
    const result = await request('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.OPS_RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `readme-ops-${idempotency}` }, body: JSON.stringify(payload) });
    await save(`mail:${key}`, { status: 'accepted', id: result.id, acceptedAt: new Date().toISOString() });
  }
  let googleToken;
  async function calendar(path, method = 'GET', body) {
    if (!googleToken) {
      const token = await request('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: env.OPS_GOOGLE_CLIENT_ID, client_secret: env.OPS_GOOGLE_CLIENT_SECRET, refresh_token: env.OPS_GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' }).toString() });
      googleToken = token.access_token;
      const primary = await request('https://www.googleapis.com/calendar/v3/calendars/primary', { headers: { Authorization: `Bearer ${googleToken}` } });
      if (primary.id !== 'readmebook.kr@gmail.com') throw new Error('Google 계정 불일치');
    }
    return request(`https://www.googleapis.com/calendar/v3/calendars/primary/${path}`, { method, headers: { Authorization: `Bearer ${googleToken}`, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  }
  async function meet(booking) {
    if (!env.OPS_GOOGLE_REFRESH_TOKEN) return '';
    const key = `calendar:${booking.id}`;
    const previous = await state(key);
    const eventId = `readme${booking.id.replaceAll('-', '')}`;
    if (booking.status === 'cancelled') {
      if (previous?.status !== 'cancelled') {
        try { await calendar(`events/${eventId}?sendUpdates=none`, 'PATCH', { status: 'cancelled' }); }
        catch (e) { if (!/HTTP (404|410)$/.test(e.message)) throw e; }
        await save(key, { eventId, status: 'cancelled' });
      }
      return '';
    }
    const fields = { summary: `READ ME 인터뷰 · ${booking.name}`, start: { dateTime: booking.interview_slots.starts_at, timeZone: 'Asia/Seoul' }, end: { dateTime: new Date(Date.parse(booking.interview_slots.starts_at) + 1800000).toISOString(), timeZone: 'Asia/Seoul' } };
    let event;
    if (previous?.version === booking.updated_at && previous.url) return previous.url;
    if (!previous) {
      // 결정적인 이벤트 ID로 응답 유실 후에도 같은 일정만 조회합니다.
      const existing = await calendar(`events?iCalUID=${encodeURIComponent(`${eventId}@google.com`)}`);
      event = existing.items?.find(x => x.id === eventId);
      if (!event) {
        try { event = await calendar('events?conferenceDataVersion=1&sendUpdates=none', 'POST', { id: eventId, ...fields, conferenceData: { createRequest: { requestId: eventId, conferenceSolutionKey: { type: 'hangoutsMeet' } } } }); }
        catch (error) {
          if (!error.message.endsWith('409')) throw error;
          event = await calendar(`events/${eventId}`);
        }
      }
      // 이전 응답을 복구했더라도 현재 예약 시각으로 맞춥니다.
      if (event.start?.dateTime && Date.parse(event.start.dateTime) !== Date.parse(fields.start.dateTime)) event = await calendar(`events/${eventId}?conferenceDataVersion=1&sendUpdates=none`, 'PATCH', fields);
    } else if (previous.version !== booking.updated_at) {
      event = await calendar(`events/${eventId}?conferenceDataVersion=1&sendUpdates=none`, 'PATCH', fields);
    } else event = await calendar(`events/${eventId}`);
    const url = event.hangoutLink || event.conferenceData?.entryPoints?.find(x => x.entryPointType === 'video')?.uri || '';
    await save(key, { eventId, version: booking.updated_at, url, status: 'active' });
    return url;
  }
  async function syncBooking(booking, now) {
    const existing = await query(TASKS, { property: '예약 ID', rich_text: { equals: booking.id } });
    if (existing.length > 1) throw new Error('예약별 노션 행 중복 확인 필요');
    let meetUrl = '';
    try { meetUrl = await meet(booking); } catch {
      await save('calendar-error:'+booking.id, { status: '확인 필요', at: new Date().toISOString() });
      await send('calendar-error:'+booking.id+':'+koreanDay(now), '[READ ME] 인터뷰 일정 동기화 확인 필요', emailBody('Google 일정·Meet와 예약 상태를 대조하세요.', '해당 없음(운영 점검)', '연결 상태를 확인하고 일정을 수동 대조하세요.', '필요 시 참여자에게 확정 일정을 다시 안내하세요.', SITE+'/admin/interviews'));
    }
    if (booking.status === 'cancelled') {
      if (existing[0] && !done(existing[0])) await notion('pages/'+existing[0].id, 'PATCH', { properties: { '상태': { status: { name: '취소' } } } });
      return;
    }
    const steps = plan(booking, now, meetUrl);
    if (!steps.length) return;
    const rowKey = 'booking:'+booking.id;
    const page = existing[0] || await ensurePage(TASKS, '중복 방지 키', rowKey, {
      '참여자 이름': title(booking.name), '대상자': text(booking.name), '구분': { select: { name: '참여자' } },
      '상태': { status: { name: '할 일' } }, '예약 ID': text(booking.id), 'Meet 링크': { url: meetUrl || null }
    });
    const version = await state('notion-version:'+booking.id);
    if (version && version.updatedAt !== booking.updated_at) {
      const reset = { '예약 안내': { checkbox: false }, '전날 확인': { checkbox: false }, '30분 전 안내': { checkbox: false }, '상태': { status: { name: '할 일' } } };
      await notion('pages/'+page.id, 'PATCH', { properties: reset }); Object.assign(page.properties, reset);
    }
    if (version?.updatedAt !== booking.updated_at) await save('notion-version:'+booking.id, { updatedAt: booking.updated_at });
    const current = steps.find(step => !stepDone(page, step.stage));
    if (current) {
      const properties = { '단계': { select: { name: current.stage } }, '기한': { date: { start: new Date(current.stage === '30분 전 안내' ? current.due + 1800000 : current.due).toISOString() } }, '메시지 초안': text(current.draft), '다음 행동': text(current.next), '다음 메시지 초안': text(current.nextDraft), 'Meet 링크': { url: meetUrl || null } };
      if (page.properties['단계']?.select?.name !== current.stage || readText(page.properties['메시지 초안']) !== current.draft || readText(page.properties['다음 메시지 초안']) !== current.nextDraft || page.properties['Meet 링크']?.url !== (meetUrl || null)) await notion('pages/'+page.id, 'PATCH', { properties });
    }
    for (const step of steps) {
      if (!step.actionable) continue;
      const latestBooking = (await db('interview_applications?id=eq.'+booking.id+'&select=status,updated_at'))[0];
      const latestPage = await notion('pages/'+page.id);
      if (!latestBooking || latestBooking.status !== 'booked' || latestBooking.updated_at !== booking.updated_at || stepDone(latestPage, step.stage)) continue;
      await send(step.key, '[READ ME] '+booking.name+' · '+step.stage, emailBody(step.action+'\n인터뷰: '+when(booking.interview_slots.starts_at)+'\nMeet: '+(meetUrl || '연결·생성 확인 필요'), step.draft, step.next, step.nextDraft, page.url));
      if (!await state('alert-mark:'+step.key)) {
        await notion('pages/'+page.id, 'PATCH', { properties: { '마지막 알림': { date: { start: new Date().toISOString() } } } });
        await save('alert-mark:'+step.key, { completed: true });
      }
    }
  }
  async function ledger() {
    const notes = [];
    for (const member of await query(MEMBERS, { property: '회비 납부', select: { equals: '납부' } })) {
      const value = payment(member);
      if (value.missing) { notes.push(`${readText(member.properties['이름'])}: 입금자명·실제 금액·입금일 확인 필요`); continue; }
      const row = await ensurePage(LEDGER, '입금 기록 키', value.key, { '내역': title(`1기 회비 · ${value.name}`), '거래일': { date: { start: value.date } }, '구분': { select: { name: '수입' } }, '금액': { number: value.amount }, '입금자명': text(value.payer), '기수': { number: 1 }, '회원': { relation: [{ id: member.id }] }, '확인 상태': { select: { name: '확인 완료' } }, '근거 링크': { url: member.url } });
      if (row.properties['금액']?.number !== value.amount || readText(row.properties['입금자명']) !== value.payer || row.properties['거래일']?.date?.start !== value.date) notes.push(`${value.name}: 원본 입금 정보와 기존 장부가 다릅니다. 대조 후 수정하세요.`);
    }
    return notes;
  }
  return async function run({ now = Date.now(), dryRun = true } = {}) {
    deadline = Date.now() + 100000;
    googleToken = undefined;
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPS_NOTION_TOKEN', 'OPS_RESEND_API_KEY', 'OPS_MAIL_FROM', 'OPS_MAIL_TO', 'OPS_START_AT'];
    const missing = required.filter(key => !env[key]);
    if (missing.length) return { status: 'configuration_required', missing };
    if (!Number.isFinite(Date.parse(env.OPS_START_AT))) throw new Error('시작일 설정 오류');
    const bookings = [];
    for (let offset = 0; ; offset += 100) {
      const rows = await db(`interview_applications?select=id,name,status,updated_at,management_token,interview_slots!inner(starts_at)&updated_at=gte.${encodeURIComponent(env.OPS_START_AT)}&order=id&limit=100&offset=${offset}`);
      bookings.push(...rows); if (rows.length < 100) break;
    }
    if (dryRun) {
      await query(TASKS, { property: '상태', status: { does_not_equal: '완료' } });
      return { status: 'dry_run', bookings: bookings.length, due: bookings.flatMap(b => plan(b, now)).filter(s => s.actionable).length, googleConfigured: Boolean(env.OPS_GOOGLE_REFRESH_TOKEN), writes: 0 };
    }
    const workerId = crypto.randomUUID();
    if (!await db('rpc/claim_operations_worker', 'POST', { worker: workerId })) return { status: 'busy' };
    const errors = [];
    try {
      for (const booking of bookings) {
        if (Date.parse(booking.interview_slots.starts_at) + 86400000 < now && booking.status !== 'cancelled') continue;
        try { await syncBooking(booking, now); } catch (e) { errors.push(e.message); }
        checkTime();
      }
      const day = koreanDay(now);
      if (now >= Date.parse(`${day}T09:00:00+09:00`) && !await state(`daily:${day}`)) {
        const health = await checkServiceHealth({ site: SITE, api: env.SUPABASE_URL, key: env.SUPABASE_ANON_KEY });
        await save(`health:${day}`, health);
        const paymentNotes = await ledger();
        const pages = await query(TASKS, { and: [{ property: '상태', status: { does_not_equal: '완료' } }, { property: '상태', status: { does_not_equal: '취소' } }] });
        const due = pages.filter(p => !stepDone(p, p.properties['단계']?.select?.name) && p.properties['기한']?.date?.start && Date.parse(p.properties['기한'].date.start) <= now);
        const chunks = due.map(p => emailBody(readText(p.properties['참여자 이름'])+' · '+(p.properties['단계']?.select?.name || readText(p.properties['기존 할 일'])), readText(p.properties['메시지 초안']) || '해당 없음(운영 점검)', readText(p.properties['다음 행동']) || '완료 여부 확인', readText(p.properties['다음 메시지 초안']) || '해당 없음(운영 점검)', p.url));
        const browser = await state('monitor:latest');
        chunks.unshift(emailBody(`서비스 점검: ${health.status}\n${health.checks.map(c => `${c.name}: ${c.status}`).join('\n')}\n브라우저 점검 최근 기록: ${browser ? `${browser.status} (${browser.checkedAt})` : '실행 기록 없음'}\n브라우저 점검은 매일 09:10 서버에서 실행 판단 후 별도 결과 메일을 보냅니다.`, '해당 없음(운영 점검)', '실패 항목과 브라우저 점검 결과를 확인하세요.', '해당 없음(운영 점검)', `${SITE}/admin/interviews`));
        chunks.push(emailBody(`입금 확인\n${paymentNotes.join('\n') || '입금 정보 누락·불일치 없음'}`, '해당 없음(운영 점검)', '필요한 내용을 확인하고 노션에 반영', '해당 없음(운영 점검)', `https://www.notion.so/${LEDGER.replaceAll('-', '')}`));
        if (errors.length) chunks.push(`자동화 확인 필요: ${errors.join(', ')}`);
        await send(`daily:${day}`, `[READ ME] ${day} 운영 할 일`, chunks.join('\n\n────────\n\n'));
        await save(`daily:${day}`, { status: 'accepted', tasks: due.length });
      }
      await save('worker:last', { at: new Date().toISOString(), status: errors.length ? 'partial' : 'passed', errors });
      return { status: errors.length ? 'partial' : 'passed', errors };
    } finally {
      await db(`operations_worker_lock?owner=eq.${workerId}`, 'DELETE');
    }
  };
}
