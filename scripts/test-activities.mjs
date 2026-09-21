// 임시 PGlite 설치 경로를 인자로 받아 실제 서비스와 분리된 PostgreSQL에서 검증한다.
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

if (!process.argv[2]) throw new Error("PGlite 패키지의 dist/index.js 경로가 필요합니다.");
const { PGlite } = await import(pathToFileURL(path.resolve(process.argv[2])).href);
const db = new PGlite();
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
    create table public.profiles(id uuid primary key references auth.users(id), display_name text, onboarding_completed_at timestamptz);
    create table public.memberships(user_id uuid primary key references auth.users(id), status text);
    create function public.has_active_membership() returns boolean language sql stable security definer set search_path='' as $fn$
      select exists(select 1 from public.memberships where user_id=auth.uid() and status='active');
    $fn$;
    insert into auth.users values
      ('00000000-0000-0000-0000-000000000001','{"role":"admin"}'),
      ('00000000-0000-0000-0000-000000000002','{}'),
      ('00000000-0000-0000-0000-000000000003','{}'),
      ('00000000-0000-0000-0000-000000000004','{}');
    insert into public.profiles select id,'검증 회원',case when id <> '00000000-0000-0000-0000-000000000004' then now() end from auth.users;
    insert into public.memberships select id,'active' from auth.users where id <> '00000000-0000-0000-0000-000000000004';
  `);
  await db.exec(await readFile(new URL("../supabase/migrations/20260920054923_membership_activities.sql", import.meta.url), "utf8"));
  await db.exec(await readFile(new URL("../supabase/migrations/20260920060428_optional_activity_chat_link.sql", import.meta.url), "utf8"));
  const results = await db.exec(await readFile(new URL("../supabase/tests/membership_activities.sql", import.meta.url), "utf8"));
  for (const result of results) if (result.rows.length) console.log(result.rows);
  const cleanup = await db.query("select (select count(*) from public.activities)::int as activities, (select count(*) from public.activity_registrations)::int as registrations");
  if (cleanup.rows[0].activities || cleanup.rows[0].registrations) throw new Error("검증 데이터 롤백 실패");
  console.log("검증 데이터 롤백 확인 완료");
} finally { await db.close(); }
