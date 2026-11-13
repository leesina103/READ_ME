import assert from 'node:assert/strict';
import { createWorker } from '../supabase/functions/operations-worker/worker.mjs';
import { TASKS } from '../supabase/functions/operations-worker/domain.mjs';

// 외부 쓰기 없이 HTTP 경계에서 반복 실행과 예약 변경을 검증합니다.
const states = new Map(), pages = new Map(), emails = [];
let locked = false, failNotion = false;
const booking = { id: '00000000-0000-4000-8000-000000000001', name: '테스트', status: 'booked', management_token: 'test', updated_at: '2026-11-12T20:00:00Z', interview_slots: { starts_at: '2026-11-12T23:00:00Z' } };
const now = Date.parse('2026-11-12T22:00:00Z');
const env = { SUPABASE_URL: 'https://db.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test', OPS_NOTION_TOKEN: 'test', OPS_RESEND_API_KEY: 'test', OPS_MAIL_FROM: 'test@example.com', OPS_MAIL_TO: 'test@example.com', OPS_START_AT: '2026-11-12T00:00:00Z' };
async function mock(url, options = {}) {
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
const run = () => createWorker(env, mock)({ now, dryRun: false });
assert.equal((await run()).status, 'passed');
assert.equal(emails.length, 2);
assert.equal(pages.size, 1);
await run();
assert.equal(emails.length, 2, '재실행은 같은 단계의 메일을 보내지 않음');
assert.equal(pages.size, 1, '한 사람의 체크표를 복제하지 않음');
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
