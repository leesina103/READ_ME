import { koreanDay, emailBody, SITE } from './domain.mjs';

// 브라우저 점검 전용 키는 이 두 작업에만 쓰며 예약·회원 데이터 접근을 허용하지 않습니다.
export async function monitor(env, input, fetcher = fetch) {
  const now = Date.now(), day = koreanDay(now);
  async function request(url, options) {
    const r = await fetcher(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new Error(`${new URL(url).hostname} HTTP ${r.status}`);
    return r.json();
  }
  const db = (path, method = 'GET', body) => request(`${env.SUPABASE_URL}/rest/v1/${path}`, { method, headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const read = async key => (await db(`operations_state?key=eq.${encodeURIComponent(key)}&select=value`))[0]?.value;
  const save = (key, value) => db('operations_state', 'POST', { key, value, updated_at: new Date(now).toISOString() });
  const latest = await read('monitor:latest');
  if (input.action === 'monitor_read') return { latest: latest || null };
  if (input.action !== 'monitor_write' || !['passed', 'failed', 'waiting', 'skipped_recent_success'].includes(input.status)) throw new Error('점검 결과 형식 오류');
  const stages = ['로그인', '회원 화면', '로그아웃', '재접근 제한', '실행 준비'];
  const stage = stages.includes(input.stage) ? input.stage : '실행 준비';
  const recent = latest?.status === 'passed' && now >= Date.parse(latest.checkedAt) && now - Date.parse(latest.checkedAt) < 168 * 3600000;
  if (input.status === 'skipped_recent_success' && !recent) throw new Error('최근 성공 기록 없음');
  const result = { status: input.status, checkedAt: new Date(now).toISOString(), stage };
  if (input.status !== 'skipped_recent_success') await save('monitor:latest', result);
  await save(`monitor:day:${day}`, result);
  const mailKey = `monitor:mail:${day}`;
  const prior = await read(mailKey);
  if (prior?.status === 'accepted') return { status: 'already_sent', result };
  const labels = { passed: '정상', failed: '실패', waiting: '실행 대기', skipped_recent_success: '최근 7일 이내 성공으로 오늘 생략' };
  const needsAction = input.status === 'failed' || input.status === 'waiting';
  const payload = prior?.payload || { from: env.OPS_MAIL_FROM, to: [env.OPS_MAIL_TO], subject: `[READ ME] ${day} 서버 로그인 점검 · ${labels[input.status]}`, text: emailBody(needsAction ? '서버 점검 실행 기록과 사이트 로그인 상태를 확인하세요.' : '지금 별도로 처리할 일은 없습니다.', '해당 없음(운영 점검)', '다음 날 서버가 실행 여부를 판단합니다. 실패·대기는 다시 시도하고, 정상인 경우 최근 전체 성공 후 7일이 지나면 다시 로그인합니다.', '해당 없음(운영 점검)', `${SITE}/operations`, `브라우저 점검: ${labels[input.status]}\n${input.status === 'skipped_recent_success' ? '오늘은 실제 로그인을 실행하지 않았습니다.' : `확인 단계: ${stage}`}\n점검 범위: 로그인 → 회원 화면 → 로그아웃 → 재접근 제한\n신규 가입·인증 메일·예약 제출은 이 점검에서 제외합니다.`) };
  if (!prior) await save(mailKey, { status: 'pending', payload });
  const mail = await request('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.OPS_RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `readme-server-monitor-${day}` }, body: JSON.stringify(payload) });
  await save(mailKey, { status: 'accepted', id: mail.id });
  return { status: 'accepted', result };
}
