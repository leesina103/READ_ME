// PC와 서버가 같은 공개 화면·예약 조회 기준으로 점검합니다.
export async function checkServiceHealth({ site, api, key }) {
const base = new URL(site);
const checks = [];
let interviewHtml = '';
let availableSlotIds = null;
async function check(name, operation) {
  try {
    await operation();
    checks.push({ name, status: 'passed' });
  } catch (error) {
    // 응답 본문이나 인증 정보 대신 점검용 메시지만 기록합니다.
    checks.push({ name, status: 'failed', reason: error.safeMessage || '통신 또는 응답 읽기 실패' });
  }
}
function ensure(condition, safeMessage) {
  if (!condition) throw Object.assign(new Error(safeMessage), { safeMessage });
}
async function request(url, options = {}) {
  return fetch(url, { ...options, signal: AbortSignal.timeout(20000), cache: 'no-store' });
}
for (const [path, marker] of [['/login', '나의 서재 열기'], ['/signup', '회원가입'], ['/interview/apply', '인터뷰 예약']]) {
  await check(`${path} 공개 화면`, async () => {
    const response = await request(new URL(path, base));
    ensure(response.status === 200, `HTTP ${response.status}`);
    ensure(new URL(response.url).pathname === path, '예상하지 않은 페이지로 이동');
    const html = await response.text();
    if (path === '/interview/apply') interviewHtml = html;
    ensure(html.includes(marker), '예상한 화면 내용 없음');
    ensure(!html.includes('예약 일정을 불러오지 못했어요.'), '인터뷰 일정 조회 실패 안내가 표시됨');
    ensure(!html.includes('Supabase 프로젝트 연결 후 로그인할 수 있습니다.'), '인증 연결 설정 누락');
  });
}
await check('/my 비로그인 접근 제한', async () => {
  const response = await request(new URL('/my', base), { redirect: 'manual' });
  const location = new URL(response.headers.get('location') || '/', base);
  ensure([302, 303, 307, 308].includes(response.status) && location.origin === base.origin && location.pathname === '/login' && location.searchParams.get('next') === '/my', '로그인 화면으로 정상 이동하지 않음');
});
await check('실제 DB 인터뷰 일정 조회', async () => {
  ensure(api && key, 'Supabase 연결 설정 누락');
  const start = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date()) + 'T00:00:00+09:00';
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const url = new URL('/rest/v1/rpc/list_interview_calendar_slots', api);
    url.search = new URLSearchParams({ starts_at: `gte.${start}`, order: 'starts_at.asc,slot_id.asc', offset: String(offset), limit: '500' });
    const response = await request(url, { method: 'POST', headers: { apikey: key, 'Content-Type': 'application/json' }, body: '{}' });
    ensure(response.ok, `DB HTTP ${response.status}`);
    const page = await response.json();
    ensure(Array.isArray(page), '일정 목록 응답 형식 오류');
    ensure(page.every(row => row.slot_id != null && Number.isFinite(Date.parse(row.starts_at)) && typeof row.is_available === 'boolean'), '일정 항목 형식 오류');
    rows.push(...page);
    if (page.length < 500) break;
  }
  availableSlotIds = new Set(rows.filter(row => row.is_available && Date.parse(row.starts_at) > Date.now()).map(row => String(row.slot_id)));
});
await check('/interview/apply 예약 시간 선택 가능', async () => {
  ensure(availableSlotIds !== null && interviewHtml, 'DB 또는 예약 화면을 확인하지 못함');
  if (availableSlotIds.size === 0) return;
  const selectedInput = interviewHtml.match(/<input\b[^>]*name="slotId"[^>]*>/)?.[0] || '';
  const selectedId = selectedInput.match(/\bvalue="(\d+)"/)?.[1];
  ensure(selectedId && availableSlotIds.has(selectedId), '예약 가능한 일정이 있지만 /interview/apply에서 시간을 선택할 수 없음');
  ensure(!interviewHtml.includes('예약이 아직 열리지 않았어요'), '/interview/apply에서 열린 일정이 예약 준비 중으로 표시됨');
  const submit = interviewHtml.match(/<button\b[^>]*class="[^"]*interview-apply-submit[^"]*"[^>]*>/)?.[0];
  ensure(submit && !/\bdisabled(?:[\s=>])/.test(submit), '/interview/apply의 예약 제출 버튼이 비활성화됨');
});
return {
  checkedAt: new Date().toISOString(), site: base.origin,
  status: checks.every(item => item.status === 'passed') ? 'passed' : 'failed', checks,
  scope: '공개 화면·실제 DB 조회·예약 시간 선택 및 제출 버튼. 실제 예약 저장·로그인·가입·메일 수신은 별도 점검 필요.'
};

}
