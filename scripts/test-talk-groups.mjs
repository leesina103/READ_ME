// 외부 회원 정보 없이 격리된 PostgreSQL에서 접근 권한과 날짜 경계를 검증한다.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import ts from "typescript";

const { PGlite } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const db = new PGlite();
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const groupA = "10000000-0000-0000-0000-000000000001";
const groupB = "10000000-0000-0000-0000-000000000002";
let checks = 0;
async function scalar(sql) { return Object.values((await db.query(sql)).rows[0])[0]; }
async function login(n, role = "authenticated") {
  await db.exec(`reset role; set role ${role}; select set_config('request.jwt.claims','${JSON.stringify(n ? { sub: id(n) } : {})}',false);`);
}
async function fails(sql, pattern) {
  await assert.rejects(() => db.exec(sql), pattern);
  checks++;
}
function equal(actual, expected) { assert.equal(actual, expected); checks++; }

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    grant usage on schema auth to anon, authenticated;
    create table auth.users(id uuid primary key, raw_app_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $fn$
      select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
    $fn$;
    create table public.cohorts(name text primary key, starts_at timestamptz not null, ends_at timestamptz);
    create table public.profiles(id uuid primary key references auth.users, display_name text, cohort text, onboarding_completed_at timestamptz);
    alter table public.profiles enable row level security;
    grant select on public.profiles to authenticated;
    create policy self_only on public.profiles to authenticated using (id=auth.uid());
    create table public.member_cohorts(user_id uuid references auth.users,cohort text references public.cohorts,primary key(user_id,cohort));
    create table public.memberships(user_id uuid primary key references auth.users,status text);
    create function public.has_active_membership() returns boolean language sql stable security definer set search_path='' as $fn$
      select exists(select 1 from public.memberships where user_id=auth.uid() and status='active');
    $fn$;
    create function public.is_cohort_member(target_cohort text) returns boolean language sql stable security definer set search_path='' as $fn$
      select exists(select 1 from public.member_cohorts where user_id=auth.uid() and cohort=target_cohort);
    $fn$;
    create function public.is_cohort_ended(target_cohort text) returns boolean language sql stable security definer set search_path='' as $fn$
      select coalesce((select ends_at<=now() from public.cohorts where name=target_cohort),false);
    $fn$;
    insert into public.cohorts values('1기','2026-09-07T00:00:00+09:00',null),('2기','2027-01-01T00:00:00+09:00',null);
    insert into auth.users select ('00000000-0000-0000-0000-'||lpad(i::text,12,'0'))::uuid,
      case when i=1 then '{"role":"admin"}'::jsonb else '{}'::jsonb end from generate_series(1,12) i;
    insert into public.profiles select id,'검증 회원','1기',now() from auth.users;
    insert into public.member_cohorts select id,'1기' from auth.users;
    insert into public.memberships select id,'active' from auth.users where id<>'${id(12)}';
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20260827000000_create_session_answers.sql", import.meta.url), "utf8"));
  await db.exec(`
    drop policy "자신의 답변은 항상 조회 가능" on public.session_answers;
    drop policy "답변을 남긴 기수원만 같은 주차 답변 조회 가능" on public.session_answers;
    create policy "활성 회원은 자신의 답변을 조회할 수 있음" on public.session_answers for select to authenticated
      using (user_id=auth.uid() and public.has_active_membership());
    revoke insert,update on public.session_answers from authenticated;
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20260914050000_talk_week_schedule.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260920062638_talk_group_schedule.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260920065112_guard_talk_group_deletion.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260920071950_meeting_based_talk_deadlines.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260920072301_first_talk_opens_on_cohort_start.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260920073001_cohort_wide_talk_answers.sql", import.meta.url), "utf8"));
  await login(1);
  await db.exec(`insert into public.talk_groups(id,cohort,name) values('${groupA}','1기','토요일'),('${groupB}','1기','월요일');`);
  await db.exec(`insert into public.talk_group_members values('${id(2)}','1기','${groupA}'),('${id(3)}','1기','${groupA}'),('${id(4)}','1기','${groupB}');`);
  await db.exec(`insert into public.talk_meetings values('${groupA}',1,'2026-09-12T14:00:00+09:00'),('${groupB}',1,'2026-09-07T14:00:00+09:00');`);
  equal(await scalar("select count(*)::int from public.admin_talk_members('1기')"),12);
  await db.exec(`update public.talk_groups set name='토요일 오후 1' where id='${groupA}';`);
  equal(await scalar(`select name from public.talk_groups where id='${groupA}'`),"토요일 오후 1");
  await fails(`delete from public.talk_groups where id='${groupA}'`, /talk_group_not_empty/);
  await db.exec(`insert into public.talk_groups(id,cohort,name) values('10000000-0000-0000-0000-000000000003','1기','빈 그룹');
    insert into public.talk_meetings values('10000000-0000-0000-0000-000000000003',1,'2026-10-03T14:00:00+09:00');
    delete from public.talk_groups where id='10000000-0000-0000-0000-000000000003';`);
  equal(await scalar("select count(*)::int from public.talk_meetings where group_id='10000000-0000-0000-0000-000000000003'"),0);
  await login(2);
  equal(await scalar("select count(*)::int from public.profiles"),1);
  equal(await scalar("select count(*)::int from public.talk_groups"),1);
  equal(await scalar("select count(*)::int from public.talk_group_members"),1);
  equal(await scalar("select count(*)::int from public.talk_meetings"),1);
  await fails("insert into public.talk_groups(cohort,name) values('1기','몰래 만든 그룹')", /row-level security/);
  await fails(`insert into public.talk_group_members values('${id(5)}','1기','${groupA}')`, /row-level security/);
  await fails("select * from public.admin_talk_members('1기')", /admin_required/);
  await fails(`insert into public.talk_day_preferences values('${id(2)}','1기',6)`, /permission denied/);
  await login(1);
  await db.exec(`insert into public.talk_group_members values ${[5,6,7,8].map((n) => `('${id(n)}','1기','${groupA}')`).join(",")};`);
  await fails(`insert into public.talk_group_members values('${id(9)}','1기','${groupA}')`, /talk_group_full/);
  await fails(`insert into public.talk_group_members values('${id(9)}','2기','${groupB}')`, /current_cohort_required|foreign key/);
  await login(2);
  equal(await scalar("select to_char(due_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=1"),"2026-09-10 23:59");
  equal(await scalar("select to_char(due_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=2"),"2026-09-20 23:59");
  await login(4);
  equal(await scalar("select to_char(due_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=1"),"2026-09-05 23:59");
  equal(await scalar("select to_char(opens_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=1"),"2026-09-07 00:00");
  await login(9);
  equal(await scalar("select due_at from public.my_talk_schedule('1기') where week_number=1"),null);
  await fails("select * from public.my_talk_schedule('2기')", /membership_required/);

  // 작성일 경과 후에도 저장 가능, 그룹에 관계없이 선작성한 주차의 같은 기수 답변을 공유한다.
  await login(2);
  await db.exec("select public.save_session_answer(1::smallint,'늦게 남긴 사전 답변'); select public.save_session_answer(2::smallint,'실천한 기록');");
  await login(3);
  equal(await scalar("select count(*)::int from public.session_answers"),0);
  equal(await scalar("select public.session_answer_count('1기',1::smallint)"),1);
  await db.exec("select public.save_session_answer(1::smallint,'같은 그룹의 답변');");
  equal(await scalar("select count(*)::int from public.session_answers where week_number=1"),2);
  await login(4);
  equal(await scalar("select public.session_answer_count('1기',1::smallint)"),2);
  await db.exec("select public.save_session_answer(1::smallint,'다른 그룹의 답변'); select public.save_session_answer(2::smallint,'다른 그룹의 실천');");
  equal(await scalar("select count(*)::int from public.session_answers where week_number=1"),3);
  equal(await scalar("select count(*)::int from public.session_answers where week_number=2"),2);
  await login(12);
  await fails("select * from public.my_talk_schedule('1기')", /membership_required/);
  equal(await scalar("select count(*)::int from public.talk_groups"),0);
  await login(null, "anon");
  await fails("select * from public.talk_groups", /permission denied/);
  await fails("select * from public.my_talk_schedule('1기')", /permission denied/);
  await login(1);
  equal(await scalar("select to_char(public.talk_due_at(null,2,'2026-12-27T18:00:00+09:00') at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI')"),"2027-01-03 23:59");
  equal(await scalar("select public.talk_due_at('2026-09-01',2,null)"),null);
  await login(9);
  equal(await scalar("select opens_at from public.my_talk_schedule('1기') where week_number=2"),null);
  await fails("select public.save_session_answer(2::smallint,'일정 없이 작성 시도')", /week_not_open/);
  await login(1);
  await db.exec(`update public.talk_meetings set starts_at='2026-10-02T18:00:00+09:00' where group_id='${groupA}' and week_number=1;`);
  await login(2);
  equal(await scalar("select to_char(due_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=2"),"2026-10-11 23:59");
  equal(await scalar("select to_char(opens_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=1"),"2026-09-07 00:00");
  equal(await scalar("select to_char(opens_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=2"),"2026-10-03 00:00");
  await db.exec("reset role; update public.cohorts set starts_at='2028-01-01' where name='1기';");
  await login(2);
  equal(await scalar("select to_char(opens_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=1"),"2028-01-01 09:00");
  equal(await scalar("select to_char(due_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=1"),"2026-09-30 23:59");
  equal(await scalar("select to_char(opens_at at time zone 'Asia/Seoul','YYYY-MM-DD HH24:MI') from public.my_talk_schedule('1기') where week_number=2"),"2026-10-03 00:00");

  // UI의 날짜 계산과 안내 시간도 SQL과 같은 값을 쓰는지 검증한다.
  const source = await readFile(new URL("../lib/membership/talkDeadlines.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  const helpers = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
  equal(helpers.talkMeetingTime("2026-10-02T09:00:00Z"),"금요일 오후 6시");
  equal(helpers.talkDueAt(2,null),null);
  for (const [meeting, due] of [["2026-10-02T18:00:00+09:00","2026-10-11T14:59:00.000Z"],["2026-10-04T18:00:00+09:00","2026-10-11T14:59:00.000Z"],["2026-10-05T18:00:00+09:00","2026-10-18T14:59:00.000Z"]]) {
    for (const week of [2,4,6,8]) {
      equal(helpers.talkDueAt(week,meeting),due);
      equal(new Date(await scalar(`select public.talk_due_at(null,${week},'${meeting}')`)).toISOString(),due);
    }
  }
  for (let day = 1; day <= 7; day++) {
    const starts = `2026-09-0${day}T00:00:00+09:00`;
    for (let week = 1; week <= 8; week++) {
      const expected = await scalar(`select public.talk_due_at('${starts}',${week},'2026-09-12T14:00:00+09:00')`);
      equal(helpers.talkDueAt(week,"2026-09-12T14:00:00+09:00"),new Date(expected).toISOString());
    }
  }
  equal(helpers.parseSeoulInput("2026-02-30T12:00"),null);
  equal(helpers.parseSeoulInput("2026-09-20T09:00"),"2026-09-20T00:00:00.000Z");
  const entry = { due_at: "2026-09-20T14:59:00Z", opens_at: "2026-09-14T00:00:00Z", answered: false };
  equal(helpers.talkReminder(entry,Date.parse("2026-09-19T23:59:59Z")),null);
  equal(helpers.talkReminder(entry,Date.parse("2026-09-20T00:00:00Z")),"today");
  equal(helpers.talkReminder(entry,Date.parse("2026-09-20T14:59:59Z")),"today");
  equal(helpers.talkReminder(entry,Date.parse("2026-09-20T15:00:00Z")),"overdue");
  equal(helpers.talkReminder({ ...entry, answered: true },Date.parse("2026-09-20T01:00:00Z")),null);
  // 모든 주차에서 선작성 잠금과 다른 기수 차단을 검증한다. 검증 계정 10은 그룹 미배정이다.
  await db.exec("reset role;");
  for (let week=1; week<=8; week++) {
    await db.exec(`insert into public.session_answers(cohort,week_number,user_id,display_name,content)
      values('1기',${week},'${id(2)}','동료','같은 기수 답변'),('2기',${week},'${id(4)}','다른 기수','다른 기수 답변')
      on conflict(cohort,week_number,user_id) do update set content=excluded.content;`);
    await login(10);
    equal(await scalar(`select count(*)::int from public.session_answers where cohort='1기' and week_number=${week}`),0);
    await db.exec("reset role;");
    await db.exec(`insert into public.session_answers(cohort,week_number,user_id,display_name,content) values('1기',${week},'${id(10)}','본인','먼저 남긴 답변');`);
    await login(10);
    equal(await scalar(`select count(*)::int from public.session_answers where cohort='1기' and week_number=${week} and user_id='${id(2)}'`),1);
    equal(await scalar(`select count(*)::int from public.session_answers where cohort='2기' and week_number=${week}`),0);
    await login(12);
    equal(await scalar(`select count(*)::int from public.session_answers where week_number=${week}`),0);
    await db.exec("reset role;");
  }
  console.log(`그룹 권한·작성일·알림 ${checks}개 검증 통과`);
} finally { await db.close(); }
