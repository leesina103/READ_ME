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
    create function public.is_cohort_member(target_cohort text) returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.member_cohorts where user_id=auth.uid() and cohort=target_cohort)$$;
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

  await db.exec("alter table auth.users add email_confirmed_at timestamptz; alter table public.profiles add bio text default '', add cohort_message text default '', add introduction_word text default '', add updated_at timestamptz default now()");
  await db.exec(await source("20260902000000_create_memberships.sql"));
  await db.exec(await source("20260902010000_create_community_posts.sql"));
  for (const migration of ["20261022082058_guide_roles.sql","20261022083947_role_hierarchy_member_access.sql","20261023010142_guide_invitation_history.sql","20261023011348_guide_audit_cleanup.sql","20261023014912_guide_member_assignment.sql","20261023040704_admin_guide_member_roster.sql"]) await db.exec(await source(migration));
  await db.exec("create trigger guide_signup after insert on auth.users for each row execute function public.handle_new_user()");
  await db.exec(`insert into public.talk_groups(id,cohort,name) values ('${gid(1)}','1기','첫 모임'),('${gid(2)}','1기','다른 모임'),('${gid(3)}','2기','다음 기수')`);
  await login(1);
  await db.exec("select public.admin_manage_guide('invite',p_token=>repeat('a',64))");
  await db.exec(`reset role; insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values ('${uid(2)}','guide@example.test',now(),'{"display_name":"새 가이드","guide_token":"${'a'.repeat(64)}"}'); update public.profiles set onboarding_completed_at=now() where id='${uid(2)}'`);
  await login(2); await fails(`select public.admin_manage_guide('approve','${uid(2)}',array['${gid(1)}']::uuid[])`,/admin_required/);
  await login(1);
  await fails(`select public.admin_manage_guide('approve','${uid(2)}',array['${gid(1)}','${gid(2)}']::uuid[])`,/group_required/);
  const assign = group => db.exec(`select public.admin_manage_guide('approve','${uid(2)}',array['${group}']::uuid[])`);
  await assign(gid(1)); await db.exec("reset role");
  equal(await one(`select cohort from public.profiles where id='${uid(2)}'`),'1기');
  equal(await one(`select status from public.memberships where user_id='${uid(2)}'`),'active');
  equal(await one(`select group_id from public.talk_group_members where user_id='${uid(2)}' and cohort='1기'`),gid(1));
  equal(await one(`select count(*)::int from public.member_invitations where claimed_by='${uid(2)}' and claimed_at is not null`),1);
  await login(2);
  await db.exec("select public.create_community_post('writing','가이드 글','함께 읽는 이야기',null,null,null)"); checks++;
  await fails("select public.admin_guide_member_roster()",/admin_required/);
  await login(null); await fails("select public.admin_guide_member_roster()",/permission denied/);
  await login(1);
  equal(await one("select public.admin_guide_member_roster()->0->>'linked'"),"true");
  await db.exec("reset role");
  await db.exec(`delete from public.talk_group_members where user_id='${uid(2)}'`);
  await login(1);
  equal(await one("select public.admin_guide_member_roster()->0->>'linked'"),"false");
  await assign(gid(1));
  equal(await one("select public.admin_guide_member_roster()->0->>'linked'"),"true");
  await assign(gid(2)); await db.exec("reset role");
  equal(await one(`select count(*)::int from public.member_invitations where claimed_by='${uid(2)}'`),1);
  equal(await one(`select group_id from public.talk_group_members where user_id='${uid(2)}' and cohort='1기'`),gid(2));
  await login(1);
  await db.exec("reset role");
  for(let n=0;n<6;n++) await db.exec(`insert into public.member_invitations(name,email,cohort,group_id) values('대기 회원','wait${n}@example.test','2기','${gid(3)}')`);
  await login(1);
  await assert.rejects(()=>assign(gid(3)),/talk_group_full/); checks++;
  await db.exec("reset role");
  equal(await one(`select cohort from public.profiles where id='${uid(2)}'`),'1기');
  equal(await one(`select group_id from public.guide_assignments where user_id='${uid(2)}'`),gid(2));
  await db.exec("delete from public.member_invitations where email like 'wait%@example.test'");
  await login(1); await assign(gid(3)); await db.exec("reset role");
  equal(await one(`select cohort from public.profiles where id='${uid(2)}'`),'2기');
  equal(await one(`select count(*)::int from public.member_cohorts where user_id='${uid(2)}'`),2);
  equal(await one(`select count(*)::int from public.talk_group_members where user_id='${uid(2)}'`),2);
  await login(1); await db.exec(`select public.admin_manage_guide('revoke','${uid(2)}')`);
  await login(2); equal(await one("select public.has_active_membership()"),true);
  await fails(`select public.guide_group_detail('${gid(3)}')`,/guide_required/);
  console.log(`가이드 회원 자동 연결 ${checks}개 검증 통과`);
} catch(error) { console.error(error.message,error.where??"",error.query??"",error.position??""); process.exitCode=1; } finally { await db.close(); }

