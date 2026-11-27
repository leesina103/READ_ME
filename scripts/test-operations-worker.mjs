import assert from 'node:assert/strict';
import { createWorker } from '../supabase/functions/operations-worker/worker.mjs';
import { TASKS, MEMBERS, LEDGER, text, title } from '../supabase/functions/operations-worker/domain.mjs';
import { manualMessageDocument } from './fixtures/manual-message-document.mjs';

// 외부 쓰기 없이 HTTP 경계에서 반복 실행과 예약 변경을 검증합니다.
const states = new Map(), pages = new Map(), emails = [];
const paidMembers = [], ledgerRows = [];
let locked = false, failNotion = false;
const booking = { id: '00000000-0000-4000-8000-000000000001', name: '테스트', status: 'booked', management_token: 'test', updated_at: '2026-11-12T20:00:00Z', interview_slots: { starts_at: '2026-11-12T23:00:00Z' } };
const now = Date.parse('2026-11-12T22:00:00Z');
const env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test', OPS_NOTION_TOKEN: 'test', OPS_RESEND_API_KEY: 'test', OPS_MAIL_FROM: 'test@example.com', OPS_MAIL_TO: 'test@example.com', OPS_START_AT: '2026-11-12T00:00:00Z' };
Object.assign(env, { OPS_GOOGLE_CLIENT_ID: 'test', OPS_GOOGLE_CLIENT_SECRET: 'test', OPS_GOOGLE_REFRESH_TOKEN: 'test' });
let documentSuffix = '', documentReads = 0, documentFails = false;
async function mock(url, options = {}) {
  if (url.includes('oauth2.googleapis.com')) return Response.json({ access_token: 'test' });
  if (url.includes('docs.googleapis.com')) { documentReads++; return documentFails ? new Response('{}', { status: 403 }) : Response.json(manualMessageDocument(documentSuffix)); }
  if (url.includes('www.googleapis.com/calendar')) {
    if (url.endsWith('/primary')) return Response.json({ id: 'readmebook.kr@gmail.com' });
    if (url.includes('events?iCalUID=')) return Response.json({ items: [] });
    return Response.json({ id: 'event', hangoutLink: 'https://meet.google.com/test' });
  }
  const u = new URL(url), body = options.body ? JSON.parse(options.body) : null;
  const ok = data => new Response(JSON.stringify(data), { status: 200 });
  if (u.hostname === 'db.invalid') {
    if (u.pathname.endsWith('interview_applications')) return ok([structuredClone(booking)]);
    if (u.pathname.endsWith('claim_operations_worker')) { if (locked) return ok(false); locked = true; return ok(true); }
    if (u.pathname.endsWith('operations_worker_lock')) { locked = false; return ok([]); }
    if (options.method === 'POST') { states.set(body.key, body.value); return ok([body]); }
    const key = u.searchParams.get('key').slice(3);
    return ok(states.has(key) ? [{ value: states.get(key) }] : []);
  }
  if (u.hostname === 'api.resend.com') { emails.push({ key: options.headers['Idempotency-Key'], body }); return ok({ id: String(emails.length) }); }
  assert.equal(u.hostname, 'api.notion.com');
  if (failNotion) return new Response('{}', { status: 503 });
  if (u.pathname.includes('/query')) {
    if (u.pathname.includes(MEMBERS) && body.filter?.property === '회비 납부') return ok({ results: paidMembers, has_more: false });
    if (u.pathname.includes(LEDGER)) return ok({ results: ledgerRows, has_more: false });
    if (!u.pathname.includes(TASKS)) return ok({ results: [], has_more: false });
    const f = body.filter;
    const rows = [...pages.values()].filter(p => {
      if (f?.rich_text) return p.properties[f.property]?.rich_text?.[0]?.text?.content === f.rich_text.equals;
      return true;
    });
    return ok({ results: rows, has_more: false });
  }
  if (u.pathname.endsWith('/pages')) {
    assert.equal(body.parent.data_source_id, TASKS);
    const id = String(pages.size + 1), page = { id, url: `https://notion.invalid/${id}`, properties: body.properties };
    pages.set(id, page); return ok(page);
  }
  const page = pages.get(u.pathname.split('/').at(-1));
  assert.ok(page);
  if (options.method === 'PATCH') Object.assign(page.properties, body.properties);
  return ok(page);
}
const run = (at = now) => createWorker(env, mock)({ now: at, dryRun: false });
assert.equal((await run()).status, 'passed');
assert.equal(emails.length, 2);
assert.equal(pages.size, 1);
await run();
assert.equal(emails.length, 2, '재실행은 같은 단계의 메일을 보내지 않음');
assert.equal(pages.size, 1, '한 사람의 체크표를 복제하지 않음');
documentSuffix = '새 원문';
await run();
assert.match(pages.get('1').properties['메시지 초안'].rich_text[0].text.content, /새 원문/);
assert.ok(documentReads >= 3, '실행마다 원문을 다시 읽음');
assert.equal(emails.length, 2, '문서 수정만으로 이미 접수된 메일을 다시 보내지 않음');
pages.get('1').properties['30분 전 안내'] = { checkbox: true };
states.delete('mail:booking:'+booking.id+':'+booking.updated_at+':30분 전 안내');
await run();
assert.equal(emails.length, 2, '완료 체크한 단계는 발송 이력이 없어도 알리지 않음');
booking.updated_at = '2026-11-12T21:00:00Z';
booking.interview_slots.starts_at = '2026-11-13T00:00:00Z';
await run();
assert.equal(pages.size, 1, '예약 변경도 같은 사람의 행을 갱신함');
assert.equal(pages.get('1').properties['30분 전 안내'].checkbox, false, '시간 변경 후 안내 체크를 초기화함');
assert.equal(emails.length, 3, '변경된 예약 안내만 새로 보냄');
booking.status = 'cancelled';
await run();
assert.ok([...pages.values()].every(p => p.properties['상태'].status.name === '취소'));
assert.equal(emails.length, 3);
failNotion = true;
assert.equal((await run()).status, 'partial');
assert.equal(emails.length, 3, '노션 조회 실패를 미완료로 간주하지 않음');
console.log('외부 요청 모의 검증: 중복 방지·변경 취소·노션 장애 시 발송 차단 통과');
failNotion = false; documentFails = true; booking.status = 'booked';
booking.updated_at = '2026-11-12T21:30:00Z';
const failureResult = await run();
assert.equal(failureResult.status, 'partial');
assert.match(emails.at(-1).body.text, /기준 문서의 최신 수동 문자 메시지를 읽지 못했습니다/);
assert.doesNotMatch(emails.at(-1).body.text, /새 원문|고맙습니다/);
console.log('최신 문서 재조회·문서 장애 시 과거 초안 재사용 차단 통과');

// 오전 9시 집계에서도 외부 통신 없이 실제 메일 본문을 확인합니다.
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response('', { status: 503 });
try {
  states.clear(); pages.clear(); emails.length = 0; documentFails = false;
  booking.updated_at = '2026-11-12T23:55:00Z';
  booking.interview_slots.starts_at = '2026-11-13T00:10:00Z';
  const dailyNow = Date.parse('2026-11-13T00:00:00Z');
  assert.equal((await run(dailyNow)).status, 'passed');
  const daily = emails.find(email => email.body.subject.includes('운영 할 일'));
  assert.ok(daily, '오전 9시 집계 메일을 생성함');
  assert.match(daily.body.text, /대상: 테스트[\s\S]*1기 납부 자료[\s\S]*가계부와 회원 명단이 일치합니다[\s\S]*서비스 점검:/);
  assert.match(daily.body.text, /오늘 오전 9:10/);
  assert.match(daily.body.text, /https:\/\/meet\.google\.com\/test/);
  assert.doesNotMatch(daily.body.text, /30분 후|시작 30분 전에 문자로/);
  const reservation = emails.find(email => email.body.subject.endsWith('예약 안내'));
  const draft = (mail, stage) => {
    const section = mail.body.text.split('\n\n────────\n\n').find(part => !stage || part.includes('대상: 테스트 · '+stage));
    assert.ok(section, '대상 단계의 메일 구역을 찾음');
    return section.split('③ 보낼 메시지 초안\n')[1].split('\n\n④ 다음 행동')[0];
  };
  assert.equal(draft(daily, '예약 안내'), draft(reservation), '예약 안내 초안은 개별 알림과 일일 요약이 같음');

  pages.get('1').properties['예약 안내'] = { checkbox: true };
  const paid = { '이름': title('가계부테스트'), '회비 납부': { select: { name: '납부' } }, '입금자명': text('입금자'), '실제 입금액': { number: 60000 }, '입금일': { date: { start: '2026-11-12' } } };
  paidMembers.push({ id: 'paid', properties: paid }, { id: 'missing', properties: { ...paid, '이름': title('누락테스트'), '입금자명': text('') } });
  ledgerRows.push({ properties: { '금액': { number: 50000 }, '입금자명': paid['입금자명'], '거래일': paid['입금일'] } });
  states.delete('daily:2026-11-13'); states.delete('mail:daily:2026-11-13');
  emails.length = 0;
  assert.equal((await run(dailyNow)).status, 'passed');
  const reminderDaily = emails.find(email => email.body.subject.includes('운영 할 일'));
  assert.match(reminderDaily.body.text, /가계부테스트 · 회원 명단과 기존 가계부의 금액 대조 필요/);
  assert.match(reminderDaily.body.text, /누락테스트 · 회원 명단에서 입금자명 입력 필요/);
  assert.doesNotMatch(reminderDaily.body.text, /가계부와 회원 명단이 일치합니다/);
  assert.match(draft(reminderDaily, '30분 전 안내'), /오늘 오전 9:10/);
  assert.doesNotMatch(reminderDaily.body.text, /30분 후|시작 30분 전에 문자로/);
  assert.match(reminderDaily.body.text, /⑤ 다음 메시지 초안\n테스트님, 고맙습니다/);
} finally {
  globalThis.fetch = originalFetch;
}
console.log('임박한 예약의 일일 요약·개별 알림 시간 안내 일치 검증 통과');
