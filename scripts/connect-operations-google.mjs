import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { readFile, writeFile, unlink } from 'node:fs/promises';
const pendingFile = '.env.operations.pending.local';
const resume = process.argv[2] === '--resume';
const file = resume ? undefined : process.argv[2];
if (!file) process.loadEnvFile('.env.operations.local');
const client = file ? JSON.parse(await readFile(file, 'utf8')).installed : { client_id: process.env.OPS_GOOGLE_CLIENT_ID, client_secret: process.env.OPS_GOOGLE_CLIENT_SECRET };
if (!client?.client_id || !client.client_secret) throw new Error('데스크톱 클라이언트 설정이 아닙니다.');
async function finishConnection(token) {
  const document = await fetch('https://docs.googleapis.com/v1/documents/1oYHtiYVAsJxnB-B_7hBwCpM4WRLPZDKSc5fERCsEGLY', { headers: { Authorization: `Bearer ${token.access_token}` } });
  if (!document.ok) {
    const result = await document.json();
    const reasons = (result.error?.details || []).map(x => x.reason);
    if (reasons.includes('SERVICE_DISABLED')) throw new Error('Google Docs API가 꺼져 있습니다. 운영 프로젝트에서 API 사용 설정 후 재시도해 주세요.');
    if (reasons.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT')) throw new Error('Google 문서 읽기 권한이 승인되지 않았습니다.');
    throw new Error(`문서 조회 실패(HTTP ${document.status}). 운영 계정의 문서 접근 권한을 확인해 주세요.`);
  }
  const values = { OPS_GOOGLE_CLIENT_ID: client.client_id, OPS_GOOGLE_CLIENT_SECRET: client.client_secret, OPS_GOOGLE_REFRESH_TOKEN: token.refresh_token };
  const existing = await readFile('.env.operations.local', 'utf8');
  const kept = existing.split(/\r?\n/).filter(line => !Object.keys(values).some(key => line.startsWith(`${key}=`))).join('\n').trimEnd();
  await writeFile('.env.operations.local', kept+'\n'+Object.entries(values).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\n')+'\n');
  await unlink(pendingFile).catch(() => {});
}
if (resume) {
  const pending = JSON.parse(await readFile(pendingFile, 'utf8'));
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, refresh_token: pending.refresh_token, grant_type: 'refresh_token' }) });
  const token = await response.json();
  if (!response.ok || !token.access_token) throw new Error('보관한 승인 결과의 갱신 실패');
  await finishConnection({ ...token, refresh_token: pending.refresh_token });
  console.log('보관한 승인 결과로 문서 연결 완료');
  process.exit(0);
}
const state = randomBytes(32).toString('hex');
const verifier = randomBytes(32).toString('base64url');
const redirect = 'http://127.0.0.1:8787/callback';
const server = createServer(async (req, res) => {
  const url = new URL(req.url, redirect);
  if (url.pathname !== '/callback' || url.searchParams.get('state') !== state) { res.writeHead(400); res.end('요청을 확인할 수 없습니다.'); return; }
  try {
    if (!url.searchParams.get('code')) throw new Error('승인되지 않음');
    const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: client.client_id, client_secret: client.client_secret, code: url.searchParams.get('code'), code_verifier: verifier, redirect_uri: redirect, grant_type: 'authorization_code' }) });
    const token = await response.json();
    if (!response.ok || !token.refresh_token) throw new Error('인증 교환 실패');
    const calendar = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary', { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!calendar.ok || (await calendar.json()).id !== 'readmebook.kr@gmail.com') throw new Error('계정 확인 실패');
    // 계정 확인을 통과한 승인 결과는 API 설정 오류가 나도 잃지 않습니다.
    await writeFile(pendingFile, JSON.stringify({ refresh_token: token.refresh_token }), { mode: 0o600 });
    await finishConnection(token);
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('READ ME 캘린더·안내 문서 연결이 완료되었습니다. 이 창을 닫으셔도 됩니다.');
    console.log('Google 계정·문서 읽기 확인 및 로컬 인증 정보 저장 완료');
    server.close(); clearTimeout(timeout);
  } catch (error) {
    const reason = /^(Google|문서 조회 실패|계정 확인 실패|인증 교환 실패|승인되지 않음)/.test(error.message) ? error.message : '연결 저장 또는 네트워크 확인 필요';
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end(reason);
    console.log('Google 연결 실패: ' + reason);
  }
});
const timeout = setTimeout(() => { server.close(); console.log('Google 연결 대기 시간 종료'); }, 60*60*1000);
server.listen(8787, '127.0.0.1', () => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: client.client_id, redirect_uri: redirect, response_type: 'code', scope: 'https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.calendars.readonly https://www.googleapis.com/auth/documents.readonly', access_type: 'offline', prompt: 'consent', login_hint: 'readmebook.kr@gmail.com', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
  console.log(url.href);
});
