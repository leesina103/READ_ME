// 과거 성공의 오인, 발송 실패, 재시도와 중복 발송 방지를 확인합니다.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSummary, sendReport, koreanDay } from './send-service-monitor-email.mjs';

const now = new Date('2026-11-03T00:10:00Z');
assert.equal(koreanDay('2026-11-02T23:59:00Z'), '2026-11-03');
const stale = buildSummary({ health: { checkedAt: '2026-11-01T00:00:00Z', status: 'passed' } }, now);
assert.match(stale.subject, /확인 필요/);
assert.match(stale.text, /오늘 실행 결과 없음/);
const login = { checkedAt: '2026-10-30T06:10:51.016Z', status: 'passed' };
const schedule = { evaluatedAt: now.toISOString(), status: 'skipped_recent_success', lastSuccessfulCheckAt: login.checkedAt };
assert.match(buildSummary({ login, schedule }, now).text, /오늘 생략/);
assert.doesNotMatch(buildSummary({ login: { ...login, checkedAt: '2026-11-04T00:00:00Z' }, schedule }, now).text, /오늘 생략/);

const dir = await mkdtemp(join(tmpdir(), 'readme-mail-test-'));
const requests = [];
const env = { MONITOR_RESEND_API_KEY: 'test-only-key', MONITOR_MAIL_TO: 'test@example.invalid' };
try {
  assert.equal((await sendReport({ dir, now, env: {} })).status, 'waiting');
  assert.equal((await sendReport({ dir, now, env, fetcher: async () => ({ ok: false, status: 403, json: async () => ({ message: 'You can only send testing emails to your own email address.' }) }) })).status, 'failed');
  const failed = JSON.parse(await readFile(join(dir, 'email-latest.json'), 'utf8'));
  assert.equal(failed.status, 'failed');
  assert.match(failed.reason, /허용 수신 주소/);
  env.MONITOR_MAIL_TO = 'corrected@example.invalid';
  const fetcher = async (url, options) => { requests.push({ url, options }); return { ok: true, json: async () => ({ id: 'test-message' }) }; };
  assert.equal((await sendReport({ dir, now, env, fetcher })).status, 'accepted');
  assert.equal((await sendReport({ dir, now, env, fetcher })).status, 'skipped_already_sent');
  assert.equal(requests.length, 1);
  assert.match(requests[0].options.headers['Idempotency-Key'], /2026-11-03$/);
  const record = await readFile(join(dir, 'email-2026-11-03.json'), 'utf8');
  assert.ok(!record.includes(env.MONITOR_RESEND_API_KEY) && !record.includes(env.MONITOR_MAIL_TO));
  console.log('메일 요약·미설정·실패·재시도·중복 방지 검증 통과');
} finally {
  await rm(dir, { recursive: true });
}
