// 점검 기록만 메일로 요약합니다. 자격증명과 회원 정보는 본문·로그에 넣지 않습니다.
import { readFile, writeFile, mkdir, open, unlink, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const directory = resolve('.codex-tmp/service-monitor');
export const koreanDay = value => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date(value));
const validPast = (value, now) => Number.isFinite(Date.parse(value)) && Date.parse(value) <= now.getTime();
const today = (value, now) => validPast(value, now) && koreanDay(value) === koreanDay(now);
const time = value => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const labels = { passed: '정상', failed: '실패', waiting: '대기', blocked: '대기', pending: '대기' };
const knownChecks = ['/login 공개 화면', '/signup 공개 화면', '/interview/apply 공개 화면', '/my 비로그인 접근 제한', '실제 DB 인터뷰 일정 조회', '/interview/apply 예약 시간 선택 가능'];

export function buildSummary({ health, login, schedule }, now = new Date()) {
  const freshHealth = today(health?.checkedAt, now);
  const healthPassed = freshHealth && health.status === 'passed' && knownChecks.every(name => health.checks?.some(c => c.name === name && c.status === 'passed'));
  const lines = [`READ ME 서비스 점검 — ${koreanDay(now)} (한국 시간)`, '', `일일 연결 점검: ${healthPassed ? '정상' : freshHealth ? '실패 또는 미확인' : '오늘 실행 결과 없음 · 미확인'}`];
  if (freshHealth) {
    lines.push(`점검 시각: ${time(health.checkedAt)}`);
    for (const name of knownChecks) lines.push(`- ${name}: ${labels[health.checks?.find(c => c.name === name)?.status] || '미확인'}`);
  }
  const recentLogin = login?.status === 'passed' && validPast(login.checkedAt, now) && now.getTime() - Date.parse(login.checkedAt) < 168 * 3600000;
  const skipped = today(schedule?.evaluatedAt, now) && schedule.status === 'skipped_recent_success' && schedule.lastSuccessfulCheckAt === login?.checkedAt && recentLogin;
  const freshLogin = today(login?.checkedAt, now);
  let loginLabel = '오늘 실행 판단 기록 없음 · 미확인';
  if (skipped) loginLabel = '오늘 생략 · 최근 7일 이내 전체 흐름 성공';
  else if (freshLogin) loginLabel = labels[login.status] || '미확인';
  lines.push('', `로그인 점검: ${loginLabel}`);
  if (validPast(login?.checkedAt, now)) lines.push(`${login.status === 'passed' ? '마지막 성공' : '마지막 점검'}: ${time(login.checkedAt)}`);
  lines.push('확인 범위: /login 로그인 → /my 회원 화면 → 로그아웃 → /my 재접근 제한', '', '신규 가입·인증 메일·실제 인터뷰 예약 저장: 제외 · 미점검', 'PC 또는 Codex 앱이 꺼져 있으면 실행·메일 발송도 쉬고 다음 예약 시각에 다시 판단합니다.', '자세한 점검 기록은 Codex의 기존 서비스 점검 대화와 로컬 기록에서 확인할 수 있습니다.');
  return { subject: `[READ ME] ${koreanDay(now)} 점검 결과 — ${healthPassed && (skipped || (freshLogin && login.status === 'passed')) ? '정상' : '확인 필요'}`, text: lines.join('\n') };
}

async function readJson(path) {
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
async function save(path, data) {
  await writeFile(`${path}.tmp`, JSON.stringify(data, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
}

export async function sendReport({ env = process.env, now = new Date(), fetcher = fetch, dir = directory, dryRun = false } = {}) {
  await mkdir(dir, { recursive: true });
  const lockPath = resolve(dir, 'email.lock');
  let lock;
  try { lock = await open(lockPath, 'wx'); } catch (error) {
    if (error.code === 'EEXIST') return { status: 'waiting', reason: '다른 메일 실행 또는 중단된 실행의 잠금 확인 필요' };
    throw error;
  }
  const day = koreanDay(now);
  const dailyPath = resolve(dir, `email-${day}.json`);
  const latestPath = resolve(dir, 'email-latest.json');
  const record = async data => {
    const result = { checkedAt: now.toISOString(), day, ...data };
    await save(latestPath, result);
    return result;
  };
  try {
    const prior = await readJson(dailyPath);
    if (prior?.status === 'accepted') return record({ status: 'skipped_already_sent', reason: '오늘 메일은 이미 발송 서비스에 접수됨' });
    const reports = {};
    for (const [name, file] of [['health', 'health-latest.json'], ['login', 'login-latest.json'], ['schedule', 'login-schedule-latest.json']]) {
      try { reports[name] = await readJson(resolve(dir, file)); } catch { reports[name] = null; }
    }
    const summary = prior?.summary || buildSummary(reports, now);
    if (dryRun) return { status: 'preview', ...summary };
    const key = env.MONITOR_RESEND_API_KEY?.trim();
    const recipient = env.MONITOR_MAIL_TO?.trim();
    const sender = env.MONITOR_MAIL_FROM?.trim() || 'READ ME <onboarding@resend.dev>';
    if (!key || !recipient) return record({ status: 'waiting', reason: '메일 발송 키 또는 수신 주소 설정 필요' });
    if (!/^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(recipient) || /[\r\n]/.test(sender)) return record({ status: 'waiting', reason: '메일 주소 형식 확인 필요' });
    // 동일 날짜 재시도는 본문과 수신자가 같아야 합니다. 주소 대신 해시만 보관합니다.
    const configHash = createHash('sha256').update(JSON.stringify([recipient, sender])).digest('hex');
    if (prior?.configHash && prior.configHash !== configHash && prior.status !== 'rejected') return record({ status: 'waiting', reason: '오늘 발송 시도 이후 메일 설정이 변경되어 수동 확인 필요' });
    const pending = { day, status: 'pending', configHash, summary };
    await save(dailyPath, pending);
    try {
      const response = await fetcher('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'Idempotency-Key': `readme-service-monitor-${day}` },
        body: JSON.stringify({ from: sender, to: [recipient], ...summary }),
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        // 명시적으로 거절된 요청만 주소를 고쳐 다시 시도할 수 있습니다.
        if ([400, 401, 403, 422].includes(response.status)) await save(dailyPath, { ...pending, status: 'rejected' });
        const message = typeof error.message === 'string' ? error.message : '';
        const reason = /only send testing emails|own email address/i.test(message) ? '테스트 발신 주소는 Resend 계정의 허용 수신 주소로만 보낼 수 있음'
          : /domain.*not verified|domain is not verified/i.test(message) ? 'Resend 발신 도메인 인증 필요'
            : /API key is invalid|invalid api key|restricted_api_key/i.test(message + error.name) ? 'Resend 발송 키 또는 권한 확인 필요'
              : `메일 발송 서비스 HTTP ${response.status}`;
        return record({ status: 'failed', reason });
      }
      const result = await response.json();
      if (typeof result.id !== 'string' || !result.id) return record({ status: 'failed', reason: '메일 접수 확인 응답 없음' });
      await save(dailyPath, { ...pending, status: 'accepted', acceptedAt: now.toISOString() });
      return record({ status: 'accepted', reason: '발송 서비스 접수 완료 · 실제 수신은 별도 확인 필요' });
    } catch { return record({ status: 'failed', reason: '메일 통신 또는 접수 기록 실패 · 같은 날짜 재시도 시 중복 방지' }); }
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (existsSync('.env.monitor-mail.local')) process.loadEnvFile('.env.monitor-mail.local');
    const result = await sendReport({ dryRun: process.argv.includes('--dry-run') });
    console.log(JSON.stringify(result, null, 2));
    if (['failed', 'waiting'].includes(result.status)) process.exitCode = 1;
  } catch {
    console.error('메일 실행 또는 로컬 기록 확인 필요. 비밀값은 출력하지 않았습니다.');
    process.exitCode = 1;
  }
}
