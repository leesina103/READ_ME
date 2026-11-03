// 실제 조회 로직을 실행해 1,000행 이후 일정, 한국 날짜 경계, 부분 조회 실패를 검증합니다.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile('lib/interview/calendar.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { readInterviewCalendar, interviewCalendarStart } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const now = new Date('2026-11-02T15:30:00Z');
assert.equal(interviewCalendarStart(now), '2026-11-03T00:00:00+09:00');
const rows = Array.from({ length: 1250 }, (_, i) => ({ slot_id: i + 1, starts_at: new Date(now.getTime() + (i + 1) * 1800000).toISOString(), is_available: true }));
const offsets = [];
const slots = await readInterviewCalendar(async (start, offset, size) => {
  assert.equal(start, '2026-11-03T00:00:00+09:00'); offsets.push(offset);
  return { data: rows.slice(offset, offset + size), error: null };
}, now);
assert.deepEqual(offsets, [0, 500, 1000]);
assert.equal(slots.length, 1250);
assert.equal(slots.at(-1).id, 1250);
await assert.rejects(() => readInterviewCalendar(async (_, offset) => offset === 0 ? { data: rows.slice(0, 500), error: null } : { data: null, error: 'network' }, now));
const filtered = await readInterviewCalendar(async () => ({ error: null, data: [
  { slot_id: 1, starts_at: '2026-11-02T14:59:00Z', is_available: true },
  { slot_id: 2, starts_at: '2026-11-02T15:00:00Z', is_available: true },
  { slot_id: 3, starts_at: '2026-11-02T16:00:00Z', is_available: true }
] }), now);
assert.deepEqual(filtered.map(s => [s.id, s.available]), [[2, false], [3, true]]);
console.log('한국 날짜 경계·지난 시간·1,250개 일정·부분 조회 실패 검증 통과');
