import assert from 'node:assert/strict';
import { COHORT_TASKS, runCohortOperations, sessionSchedule } from '../supabase/functions/operations-worker/cohort-operations.mjs';
import { MEMBERS, readText, text, title } from '../supabase/functions/operations-worker/domain.mjs';

const date = start => ({ date: { start } });
const option = name => ({ select: { name } });
const template = {
  '8': '[이름]님 [날짜·요일·시간] [장소] [책 제목] [이번 회차 사전 질문 링크]',
  '8-1': '[이름]님 [이번 회차 사전 질문 링크]\n[첫 모임이며 자기소개도 미작성인 경우: 안내]',
  '8-2': '[이름]님 [장소·주소] [책 제목·준비물]',
  '9': '[이름]님 [날짜·일요일] [해당 주차 링크]',
  '9-1': '[이름]님 [해당 주차 링크]',
  '10': '[이름]님 [중간 후기 링크]',
  '11': '[이름]님 [날짜·요일·시간] [파티 초대장 링크] [신청 기한]',
  '12': '[이름]님 [전체 기수 후기 링크]',
  '13': '[이름]님 [파티 후기 링크]'
};
const schedule = (name, days) => ({ properties: {
  '날짜': title(name), '시간': text('15:00–18:00'), '장소': text('모임 장소'), '준비물': text('없음'),
  ...Object.fromEntries(days.map((day, i) => [`${i + 1}회차`, date(day)]))
} });
const schedules = [
  schedule('매주 금요일', ['2026-12-18', '2027-01-08', '2027-01-22', '2027-02-05']),
  schedule('매주 토요일', ['2026-12-19', '2027-01-09', '2027-01-23', '2027-02-06'])
];
const person = (id, name, group) => ({ id, properties: { '이름': title(name), '모임': option(group) } });
const members = [person('a', '가 회원', '금요일 15:00–18:00'), person('b', '나 회원', '금요일 15:00–18:00'), person('c', '다 회원', '미정')];
const rows = [], notices = [], states = new Map();
const cutoff = '2027-01-06T19:00:00+09:00';
let answered = true, failMail = false;
const match = () => schedules.flatMap((s, group) => [1, 2, 3, 4].map(round => ({ group, round, at: new Date(sessionSchedule(s, round).start).toISOString() })));
const run = (at, dryRun = false) => runCohortOperations({ now: Date.parse(at), dryRun, templates: { templates: template }, checkTime() {},
  query: async source => source === MEMBERS ? members : source === COHORT_TASKS ? rows : schedules,
  db: async path => {
    if (path.startsWith('cohorts?')) return [{ starts_at: '2026-12-14T00:00:00+09:00' }];
    if (path.startsWith('talk_groups?')) return ['금요일', '토요일'].map((name, i) => ({ id: i + 1, name, talk_meetings: match().filter(m => m.group === i).map(m => ({ week_number: 2 * m.round - 1, starts_at: m.at })) }));
    if (path.startsWith('talk_group_members?')) return [{ user_id: 'a', group_id: 1 }];
    if (path.startsWith('profiles?')) return [{ id: 'a', full_name: '가 회원', introduction_word: '리미', bio: '소개' }];
    if (path.startsWith('completed_talk_weeks?')) return answered ? [{ user_id: 'a', week_number: 3 }] : [];
    throw new Error('예상하지 않은 웹 조회');
  },
  ensurePage: async (_, keyProperty, key, properties) => {
    const page = { id: key, url: 'https://notion.invalid/' + key, properties: { ...properties, [keyProperty]: text(key) } };
    rows.push(page);
    return page;
  },
  notion: async (path, method, { properties }) => {
    assert.equal(method, 'PATCH');
    const page = rows.find(r => 'pages/' + r.id === path);
    Object.assign(page.properties, properties);
    return page;
  },
  state: async key => states.get(key), save: async (key, value) => states.set(key, value),
  send: async (key, subject, body) => {
    if (failMail) throw new Error('메일 일시 실패');
    assert.ok(!notices.some(m => m.key === key));
    notices.push({ key, subject, body });
  }
});
const row = (person, round) => rows.find(r => r.id === `cohort:1:${person}:${round}`);
const round2 = sessionSchedule(schedules[0], 2);
assert.equal(round2.stages[0][1], Date.parse('2027-01-01T19:00:00+09:00'));
assert.equal(round2.stages[1][1], Date.parse(cutoff));
assert.equal(round2.stages[4][1], Date.parse('2027-01-11T19:00:00+09:00'));
assert.equal(round2.recordDue, Date.parse('2027-01-17T23:59:00+09:00'));
assert.ok(Number.isNaN(sessionSchedule(schedules[0], 1).stages[0][1]), '첫 회차의 7일 전 안내는 생략');
const before = '2026-11-18T19:00:00+09:00';
assert.equal((await run(before, true)).confirmed, 3);
assert.equal(rows.length, 0, '미리보기는 노션을 변경하지 않음');
for (let i = 0; i < 3; i++) await run(before);
assert.equal(rows.length, 16);
assert.equal(row('c', 2).properties['모임 날짜'].date, null, '미정 그룹에는 회차 날짜를 넣지 않음');
assert.equal(Date.parse(row('a', 2).properties['사전 질문 안내 예정'].date.start), Date.parse('2027-01-01T19:00:00+09:00'));
row('a', 1).properties['회차 후기 요청'] = { checkbox: true };
row('b', 1).properties['회차 후기 요청'] = { checkbox: true };
await run(cutoff);
assert.equal(notices.length, 1);
assert.doesNotMatch(notices[0].body, /가 회원|다 회원/);
assert.match(notices[0].body, /나 회원[\s\S]*작성 여부를 확인/);
assert.match(notices[0].body, /\/membership\/talk\/1\/3/);
await run(cutoff);
assert.equal(notices.length, 1, '같은 확인 요청은 반복하지 않음');
row('b', 2).properties['사전 질문 마감 알림'] = { checkbox: true };
answered = false;
failMail = true;
await assert.rejects(run(cutoff), /메일 일시 실패/);
failMail = false;
await run(cutoff);
assert.equal(notices.length, 2);
assert.match(notices[1].body, /가 회원[\s\S]*직접 보내고/);
assert.doesNotMatch(notices[1].body, /나 회원/);
row('a', 2).properties['사전 질문 마감 알림'] = { checkbox: true };
await run(cutoff);
assert.equal(notices.length, 2, '완료 체크 이후에는 재알림하지 않음');
schedules[0].properties['2회차'] = date('2027-01-15');
await run(before);
assert.equal(Date.parse(row('a', 2).properties['사전 질문 안내 예정'].date.start), Date.parse('2027-01-08T19:00:00+09:00'));
assert.equal(row('a', 2).properties['사전 질문 마감 알림'].checkbox, true, '일정 정정은 직접 한 체크를 보존');
assert.match(readText(row('c', 2).properties['운영 메모']), /확인 필요/);

const reviewNotices = () => notices.filter(mail => /후기 요청/.test(mail.subject));
const midpointDue = '2027-01-25T19:00:00+09:00';
for (const round of [1, 3, 4]) {
  assert.equal(row('a', round).properties['회차 후기 요청 예정'].date, null);
}
assert.equal(Date.parse(row('a', 2).properties['회차 후기 요청 예정'].date.start), Date.parse(midpointDue));
row('a', 2).properties['실천·기록 작성 확인'] = option('작성');
members[1].properties['2회 출석'] = option('결석');
await run('2027-01-15T18:00:00+09:00');
await run('2027-01-25T18:59:00+09:00');
assert.equal(reviewNotices().length, 0, '모임 직후나 기록 마감 다음 날 19시 전에는 후기를 요청하지 않음');
await run(midpointDue);
assert.equal(reviewNotices().length, 1);
assert.match(reviewNotices()[0].subject, /4주차 중간 후기 요청/);
assert.match(reviewNotices()[0].body, /\/membership\/review\?event=session&session=2&period=midpoint/);
assert.match(reviewNotices()[0].body, /나 회원/, '오프라인 결석자도 중간 후기 대상');
await run(midpointDue);
assert.equal(reviewNotices().length, 1, '중간 후기 알림을 중복 발송하지 않음');
await run('2027-02-15T18:59:00+09:00');
assert.equal(reviewNotices().length, 1);
await run('2027-02-15T19:00:00+09:00');
assert.equal(reviewNotices().length, 2);
assert.match(reviewNotices()[1].subject, /전체 후기 요청/);
assert.match(reviewNotices()[1].body, /\/membership\/review\?event=cohort/);
console.log('기수 운영 검증 통과 · 실제 회차 기준 계산, 미작성자 구분, 발송 재시도와 중복 방지, 일정 정정');
