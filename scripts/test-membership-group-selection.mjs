// 운영 데이터 대신 격리된 PostgreSQL에서 신청·승인·가입·정원·조회 권한을 검증합니다.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
const uid = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const gid = (n) => `10000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
let checks = 0;
const source = (name) => readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8");
async function one(sql) { return Object.values((await db.query(sql)).rows[0])[0]; }
function equal(a, b) { assert.deepEqual(a, b); checks++; }
async function fails(sql, pattern) { await assert.rejects(() => db.query(sql), pattern); checks++; }
async function login(n) {
  await db.exec(`reset role; set role ${n ? "authenticated" : "anon"}; select set_config('request.jwt.claims','${JSON.stringify(n ? { sub: uid(n), app_metadata: n === 1 ? { role: "admin" } : {} } : {})}',false);`);
}
const submit = (email, group = gid(1), cohort = "1기", phone = "010-1234-5678") => `select public.submit_membership_application('검증 회원','${email}','${cohort}',1990,${group ? `'${group}'` : "null"},${phone === null ? "null" : `'${phone}'`},'검증 신청')`;
async function approve(email) {
  await login(1);
  const id = await one(`select id from public.admin_list_membership_applications() where email='${email}'`);
  await db.query(`select public.review_membership_application(${id},'approved','')`);
  checks++;
}
try {
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    grant usage on schema auth to anon, authenticated;
    create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select nullif(current_setting('request.jwt.claims',true),'')::jsonb$$;
    create table public.cohorts(name text primary key,starts_at timestamptz not null,ends_at timestamptz,application_open boolean default true);
    create table public.profiles(id uuid primary key references auth.users,full_name text,display_name text,cohort text,onboarding_completed_at timestamptz);
    alter table public.profiles enable row level security;
    grant select on public.profiles to authenticated;
    create policy self_only on public.profiles to authenticated using(id=auth.uid());
    create table public.member_cohorts(user_id uuid references auth.users,cohort text references public.cohorts,joined_at timestamptz default now(),primary key(user_id,cohort));
    create function public.has_active_membership() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null$$;
    create function public.is_cohort_member(c text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.member_cohorts where user_id=auth.uid() and cohort=c)$$;
    create function public.is_cohort_ended(c text) returns boolean language sql stable security definer set search_path='' as $$select coalesce((select ends_at<=now() from public.cohorts where name=c),false)$$;
    insert into public.cohorts values('1기',now()+interval '1 day',null,true),('2기',now()+interval '1 day',null,true);
    insert into auth.users(id,email,raw_app_meta_data) values('${uid(1)}','admin@example.test','{"role":"admin"}');
  `);
  const invitationSource = await source("20260822000200_create_member_invitations.sql");
  await db.exec(invitationSource.slice(invitationSource.indexOf("create table if not exists public.member_invitations"), invitationSource.indexOf("alter table public.profiles")));
  const history = await source("20260914010000_member_cohort_history.sql");
  await db.exec(history.slice(history.indexOf("create or replace function public.sync_member_cohort_from_profile"), history.indexOf("create or replace function public.is_cohort_member")));
  for (const migration of ["20260827000000_create_session_answers.sql", "20260828000000_create_membership_applications.sql", "20260828010000_archive_membership_applications.sql", "20260914000000_add_birth_year_to_membership_applications.sql"]) await db.exec(await source(migration));
  await db.exec(`create policy "답변을 남긴 활성 기수원만 같은 주차 답변 조회 가능" on public.session_answers for select to authenticated using(false);`);
  await db.exec(await source("20260920062638_talk_group_schedule.sql"));
  await db.exec(await source("20260920065112_guard_talk_group_deletion.sql"));
  await db.exec(await source("20260928014821_membership_group_selection.sql"));
  await db.exec(await source("20260928021430_save_talk_group_details_and_schedule.sql"));
  await db.exec(`insert into public.membership_applications(name,email,cohort,birth_year) values('기존 신청','legacy@example.test','1기',1990);`);
  await db.exec(await source("20260930123533_membership_application_phone.sql"));
  await db.exec(await source("20261001000000_optional_membership_group_host.sql"));
  equal(await one("select phone from public.membership_applications where email='legacy@example.test'"), null);
  await db.exec(invitationSource.slice(invitationSource.indexOf("create or replace function public.handle_new_user()")));
  await db.exec(`create trigger handle_signup after insert on auth.users for each row execute function public.handle_new_user();`);
  await login(1);
  await db.exec(`insert into public.talk_groups(id,cohort,name,host_name,host_style,venue,application_open) values
    ('${gid(1)}','1기','운영 이름 A','가이드 A','적고 나누기','서울',true),
    ('${gid(2)}','1기','운영 이름 B','가이드 B','문장에서 출발하기','서울',true),
    ('${gid(3)}','2기','운영 이름 C','가이드 C','경험 나누기','서울',true),
    ('${gid(4)}','1기','비공개','가이드 D','경험 나누기','서울',false);
    insert into public.talk_meetings select g.id,w,now()+interval '2 days'+(w-1)*interval '7 days' from public.talk_groups g cross join unnest(array[1,3,5,7]) w;`);
  await db.exec("begin");
  const blankHostMeetings = await one("select jsonb_agg(jsonb_build_object('week_number',week_number,'starts_at',starts_at) order by week_number) from public.talk_meetings where group_id='" + gid(4) + "'");
  await db.query("select public.admin_save_talk_group($1,'1기','','','서울',180,true,$2::jsonb)",[gid(4),JSON.stringify(blankHostMeetings)]);
  await login(null);
  equal(await one("select count(*)::int from public.membership_group_options('1기') where id='"+gid(4)+"'"),1);
  await db.exec(submit("no-host@example.test",gid(4)));
  checks++;
  await login(1);
  equal(await one("select group_id from public.admin_list_membership_applications() where email='no-host@example.test'"),gid(4));
  await db.exec("rollback");
  await login(null);
  equal(await one("select count(*)::int from public.membership_group_options('1기')"), 2);
  const option = (await db.query("select * from public.membership_group_options('1기') limit 1")).rows[0];
  equal(option.meetings.length, 4);
  equal(Object.keys(option).sort(), ["id", "host_name", "host_style", "venue", "duration_minutes", "meetings"].sort());
  await fails("select * from public.talk_groups", /permission denied/);
  await fails("select * from public.membership_applications", /permission denied/);
  await fails("select * from public.admin_list_membership_applications()", /permission denied/);
  await fails("select * from public.admin_talk_group_capacity('1기')", /permission denied/);
  await fails(submit("missing@example.test", null), /application_group_unavailable/);
  await fails(submit("wrong@example.test", gid(3)), /application_group_unavailable/);
  await fails(submit("closed@example.test", gid(4)), /application_group_unavailable/);
  await fails(submit("invalid@example.test", gid(1), "1기", "123"), /invalid_application_phone/);
  await fails(submit("empty@example.test", gid(1), "1기", ""), /invalid_application_phone/);
  await fails(submit("null@example.test", gid(1), "1기", null), /invalid_application_phone/);
  await db.exec(submit("new@example.test"));
  await login(1);
  equal(await one("select phone from public.admin_list_membership_applications() where email='new@example.test'"), "01012345678");
  await login(null);
  await fails(submit("new@example.test", gid(2)), /application_already_submitted/);
  await approve("new@example.test");
  // 승인 직후에는 초대장에 자리가 보관되고, 실제 가입 트리거가 회원 배정을 만듭니다.
  await db.exec("reset role");
  equal(await one(`select count(*)::int from public.talk_group_members where group_id='${gid(1)}'`),0);
  equal(await one(`select private.talk_reserved_count('${gid(1)}')`),1);
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('${uid(2)}','new@example.test','{"display_name":"검증 회원"}');`);
  equal(await one(`select group_id::text from public.talk_group_members where user_id='${uid(2)}'`),gid(1));
  equal(await one(`select private.talk_reserved_count('${gid(1)}')`),1);
  await login(2);
  equal(await one("select count(*)::int from public.talk_groups"),1);
  equal(await one("select count(*)::int from public.talk_meetings"),4);
  equal(await one("select host_name from public.talk_groups"),"가이드 A");
  await fails("select * from public.admin_list_membership_applications()", /admin_required/);
  await fails("select * from public.admin_talk_group_capacity('1기')", /admin_required/);
  await fails("select public.review_membership_application(1,'approved','')", /admin_required/);
  equal((await db.query(`update public.talk_groups set host_name='무단 변경' where id='${gid(1)}' returning id`)).rows.length,0);
  equal(await one("select host_name from public.talk_groups"),"가이드 A");
  // 기존 회원이 다음 기수에 신청하면 승인과 동시에 새 기수에 배정됩니다.
  await db.exec(submit("new@example.test",gid(3),"2기"));
  await approve("new@example.test");
  await login(2);
  equal(await one("select cohort from public.profiles"),"2기");
  equal(await one("select group_id::text from public.talk_group_members where cohort='2기'"),gid(3));
  equal(await one("select count(*)::int from public.talk_group_members"),2);
  // 같은 시간 모임은 서로 다른 선택지이며, 정원에는 미가입 승인자도 포함됩니다.
  for (let n=3;n<=8;n++) {
    await login(null);
    await db.exec(submit(`seat${n}@example.test`,gid(2)));
  }
  await login(null);
  await db.exec(submit("overflow@example.test",gid(2)));
  for (let n=3;n<=8;n++) await approve(`seat${n}@example.test`);
  equal(await one(`select reserved_count from public.admin_talk_group_capacity('1기') where group_id='${gid(2)}'`),6);
  const overflow = await one("select id from public.admin_list_membership_applications() where email='overflow@example.test'");
  await fails(`select public.review_membership_application(${overflow},'approved','')`, /talk_group_full/);
  equal(await one(`select status from public.admin_list_membership_applications() where id=${overflow}`),"pending");
  await login(null);
  equal(await one(`select count(*)::int from public.membership_group_options('1기') where id='${gid(2)}'`),0);
  await fails(submit("full@example.test",gid(2)), /application_group_unavailable/);
  await db.exec("reset role");
  await db.exec(`insert into auth.users(id,email,raw_user_meta_data) values('${uid(3)}','seat3@example.test','{"display_name":"검증 회원"}');`);
  equal(await one(`select private.talk_reserved_count('${gid(2)}')`),6);
  await login(1);
  await fails(`insert into public.talk_group_members values('${uid(2)}','2기','${gid(2)}')`, /talk_group_full|foreign key/);
  await fails(`delete from public.talk_groups where id='${gid(2)}'`, /talk_group_not_empty/);
  await db.exec(`update public.talk_groups set application_open=false where id='${gid(1)}';`);
  await login(null);
  equal(await one("select count(*)::int from public.membership_group_options('1기')"),0);
  // 안내 저장 후 일정 저장이 실패해도 안내까지 함께 되돌아가야 합니다.
  const dates = [1,3,5,7].map((week) => ({ week_number: week, starts_at: new Date(Date.now() + (week + 1) * 86400000).toISOString() }));
  const saveGroup = (items = dates) => `select public.admin_save_talk_group('${gid(1)}','1기','통합 가이드','가이드 소개','통합 장소',150,true,'${JSON.stringify(items)}'::jsonb)`;
  await fails(saveGroup(), /permission denied/);
  await login(2);
  await fails(saveGroup(), /admin_required/);
  await login(1);
  await fails(saveGroup(dates.slice(0,3)), /invalid_group_schedule/);
  await fails(saveGroup(dates.map((date) => ({ ...date, starts_at: dates[0].starts_at }))), /invalid_group_schedule/);
  await db.exec("reset role");
  await db.exec(`create function private.reject_test_schedule() returns trigger language plpgsql as $$begin if new.week_number=7 then raise exception 'test_schedule_failure'; end if; return new; end;$$;
    create trigger reject_test_schedule before insert or update on public.talk_meetings for each row execute function private.reject_test_schedule();`);
  await login(1);
  await fails(saveGroup(), /test_schedule_failure/);
  equal(await one(`select host_name from public.talk_groups where id='${gid(1)}'`),"가이드 A");
  equal(await one(`select application_open from public.talk_groups where id='${gid(1)}'`),false);
  await db.exec("reset role; drop trigger reject_test_schedule on public.talk_meetings;");
  await login(1);
  await db.exec(saveGroup());
  equal(await one(`select host_name from public.talk_groups where id='${gid(1)}'`),"통합 가이드");
  equal(await one(`select duration_minutes from public.talk_groups where id='${gid(1)}'`),150);
  equal(await one(`select starts_at from public.talk_meetings where group_id='${gid(1)}' and week_number=7`),new Date(dates[3].starts_at));
  console.log(`모임 선택·통합 저장 검증 ${checks}개 통과`);
} catch (error) {
  console.error(error.message, error.where ?? "", error.query ?? "");
  process.exitCode = 1;
} finally { await db.close(); }
