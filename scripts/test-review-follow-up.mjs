import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../lib/membership/reviews.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
const { reviewFollowUp } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const now = Date.parse("2026-11-17T12:00:00+09:00");
const item = (week_number, meeting_at) => ({ week_number, meeting_at, group_name: "금요일 모임", opens_at: null, due_at: null, answered: false });
const schedule = [
  item(7, "2026-12-18T15:00:00+09:00"),
  item(2, "2026-11-20T15:00:00+09:00"),
  item(1, "2026-11-20T15:00:00+09:00"),
  item(3, "2026-12-04T15:00:00+09:00"),
  item(5, "2026-12-18T15:00:00+09:00")
];
const followUp = (overrides = {}) => reviewFollowUp({ event: "session", session: 1, sessionCount: 4, schedule, ended: false, now, ...overrides });

assert.equal(followUp().nextMeeting.week_number, 3, "배열 순서나 짝수 주 일정과 무관하게 다음 모임을 고릅니다.");
assert.equal(followUp().recordWeek, 2, "회차와 같은 실천·기록 주차로 연결합니다.");
assert.equal(followUp().record.week_number, 2);
assert.equal(followUp({ now: Date.parse("2026-12-05T12:00:00+09:00") }).nextMeeting.week_number, 7, "이미 지난 모임은 다음 일정으로 표시하지 않습니다.");
assert.equal(followUp({ ended: true }).nextMeeting, null, "종료한 기수에는 다음 모임을 안내하지 않습니다.");
assert.equal(followUp({ session: 4 }).nextMeeting, null, "마지막 회차에는 다음 모임이 없습니다.");
assert.equal(followUp({ session: 4 }).recordWeek, 8, "마지막 회차 뒤에도 마지막 기록 주차는 남습니다.");
assert.equal(followUp({ schedule: [] }).nextMeeting, null, "일정이 없어도 날짜를 만들어내지 않습니다.");
for (const event of ["cohort", "party"]) {
  assert.deepEqual(followUp({ event }), { nextMeeting: null, record: null, recordWeek: null }, "전체·파티 후기는 특정 회차 일정으로 연결하지 않습니다.");
}
for (const session of [undefined, 0, -1, 1.5, 5]) {
  assert.equal(followUp({ session }).recordWeek, null, "잘못된 회차로 기록 링크를 만들지 않습니다.");
}
console.log("후기 뒤 일정·기록 안내 검증을 통과했습니다.");
