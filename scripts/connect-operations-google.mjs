import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
const file = process.argv[2];
if (!file) throw new Error('다운로드한 Google 클라이언트 JSON 경로가 필요합니다.');
const client = JSON.parse(await readFile(file, 'utf8')).installed;
if (!client?.client_id || !client.client_secret) throw new Error('데스크톱 클라이언트 설정이 아닙니다.');
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
    const values = { OPS_GOOGLE_CLIENT_ID: client.client_id, OPS_GOOGLE_CLIENT_SECRET: client.client_secret, OPS_GOOGLE_REFRESH_TOKEN: token.refresh_token };
    const existing = await readFile('.env.operations.local', 'utf8');
    const kept = existing.split(/\r?\n/).filter(line => !Object.keys(values).some(key => line.startsWith(`${key}=`))).join('\n').trimEnd();
    await writeFile('.env.operations.local', kept+'\n'+Object.entries(values).map(([k,v]) => `${k}=${JSON.stringify(v)}`).join('\n')+'\n');
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('READ ME Google Calendar 연결이 완료되었습니다. 이 창을 닫으셔도 됩니다.');
    console.log('Google Calendar 계정 확인 및 로컬 인증 정보 저장 완료');
    server.close(); clearTimeout(timeout);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('연결을 완료하지 못했습니다. 계정과 API 활성화를 확인해 주세요.');
    console.log('Google 연결 실패: 계정·API·승인 상태 확인 필요');
  }
});
const timeout = setTimeout(() => { server.close(); console.log('Google 연결 대기 시간 종료'); }, 15*60*1000);
server.listen(8787, '127.0.0.1', () => {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: client.client_id, redirect_uri: redirect, response_type: 'code', scope: 'https://www.googleapis.com/auth/calendar.events.owned https://www.googleapis.com/auth/calendar.calendars.readonly', access_type: 'offline', prompt: 'consent', login_hint: 'readmebook.kr@gmail.com', state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
  console.log(url.href);
});
