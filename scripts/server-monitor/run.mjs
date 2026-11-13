const env = process.env;
async function report(body) {
  const r = await fetch(env.MONITOR_ENDPOINT, { method: 'POST', headers: { Authorization: `Bearer ${env.MONITOR_JWT}`, 'x-readme-token': env.MONITOR_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error('점검 서버 응답 실패');
  return r.json();
}
let browser, stage = '실행 준비', status = 'waiting';
try {
  const { latest } = await report({ action: 'monitor_read' });
  const age = Date.now() - Date.parse(latest?.checkedAt);
  if (latest?.status === 'passed' && age >= 0 && age < 168 * 3600000) status = 'skipped_recent_success';
  else {
    if (!env.MONITOR_TEST_EMAIL || !env.MONITOR_TEST_PASSWORD) throw new Error('설정 누락');
    const { chromium } = await import('playwright');
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultTimeout(25000);
    const site = 'https://read-me-two-black.vercel.app';
    stage = '로그인';
    await page.goto(`${site}/login?next=%2Fmy`);
    await page.locator('input[name="email"]').fill(env.MONITOR_TEST_EMAIL);
    await page.locator('input[name="password"]').fill(env.MONITOR_TEST_PASSWORD);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await page.waitForURL(url => url.pathname === '/my');
    stage = '회원 화면';
    await page.getByRole('heading', { name: /님의 서재/ }).waitFor();
    await page.getByRole('button', { name: '로그아웃', exact: true }).waitFor();
    stage = '로그아웃';
    await page.getByRole('button', { name: '로그아웃', exact: true }).click();
    await page.waitForURL(url => url.pathname !== '/my');
    stage = '재접근 제한';
    await page.goto(`${site}/my`);
    await page.waitForURL(url => url.pathname === '/login' && url.searchParams.get('next') === '/my');
    await page.getByRole('button', { name: '로그인', exact: true }).waitFor();
    status = 'passed';
  }
} catch {
  status = stage === '실행 준비' ? 'waiting' : 'failed';
} finally {
  await browser?.close();
}
// 오류 원문·화면·쿠키에는 계정 정보가 들어갈 수 있어 저장하거나 출력하지 않습니다.
try {
  const result = await report({ action: 'monitor_write', status, stage });
  console.log(JSON.stringify({ status, stage, mail: result.status }));
} catch { console.log('점검 결과 저장 또는 알림 접수 실패'); process.exitCode = 1; }
if (status === 'failed' || status === 'waiting') process.exitCode = 1;
