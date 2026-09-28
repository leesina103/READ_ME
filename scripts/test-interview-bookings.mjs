// 운영 데이터와 분리된 PostgreSQL에서 예약 관리의 권한과 상태 전이를 검증합니다.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const db = new PGlite();
let checks = 0;
async function one(sql) { return (await db.query(sql)).rows[0]; }
function equal(actual, expected) { assert.equal(actual, expected); checks++; }
async function fails(sql, pattern) { await assert.rejects(() => db.query(sql), pattern); checks++; }
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;`);
  for (const file of ["20260829010000_create_interview_bookings.sql", "20260928013213_interview_booking_management.sql", "20260928015251_admin_interview_management_link.sql"]) {
    await db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
  }
  await db.exec("insert into public.interview_slots(id,starts_at,is_open) values (1,now()+interval '1 day',true),(2,now()+interval '2 days',true),(3,now()+interval '3 days',true),(4,now()+interval '4 days',false),(5,now()-interval '1 day',true);");
  await db.exec("set role anon");
  const a = await one("select * from public.book_interview_with_management(1,'검증 하나','01000000001')");
  const b = await one("select * from public.book_interview_with_management(2,'검증 둘','01000000002')");
  equal(typeof a.management_token, "string");
  assert.notEqual(a.management_token, b.management_token); checks++;
  await fails(`select public.admin_interview_management_token('${a.application_id}')`, /permission denied/);
  await db.exec("reset role; set role authenticated; select set_config('request.jwt.claims','{}',false)");
  await fails(`select public.admin_interview_management_token('${a.application_id}')`, /admin_required/);
  await db.exec(`select set_config('request.jwt.claims','{"user_metadata":{"role":"admin"}}',false)`);
  await fails(`select public.admin_interview_management_token('${a.application_id}')`, /admin_required/);
  await db.exec(`select set_config('request.jwt.claims','{"app_metadata":{"role":"admin"}}',false)`);
  equal((await one(`select public.admin_interview_management_token('${a.application_id}') as token`)).token, a.management_token);
  await fails("select public.admin_interview_management_token('00000000-0000-4000-8000-000000000000')", /booking_not_found/);
  await db.exec("reset role; set role anon; select set_config('request.jwt.claims','{}',false)");
  equal((await one(`select * from public.get_interview_booking('${a.management_token}')`)).name, "검증 하나");
  equal((await db.query("select * from public.get_interview_booking('00000000-0000-4000-8000-000000000000')")).rows.length, 0);
  await fails("select * from public.interview_applications", /permission denied/);
  await fails("select * from public.manage_interview_booking('00000000-0000-4000-8000-000000000000','cancel')", /booking_not_found/);
  await fails(`select * from public.manage_interview_booking('${a.management_token}','reschedule',2)`, /slot_unavailable/);
  equal((await one(`select * from public.get_interview_booking('${a.management_token}')`)).starts_at.getTime(), a.starts_at.getTime());
  await fails(`select * from public.manage_interview_booking('${a.management_token}','reschedule',4)`, /slot_unavailable/);
  await fails(`select * from public.manage_interview_booking('${a.management_token}','reschedule',5)`, /slot_unavailable/);
  await fails(`select * from public.manage_interview_booking('${a.management_token}','reschedule',1)`, /same_slot/);
  await fails(`select * from public.manage_interview_booking('${a.management_token}','invalid')`, /invalid_booking_action/);
  await fails(`select * from public.manage_interview_booking('${a.management_token}',null)`, /invalid_booking_action/);
  await db.query(`select * from public.manage_interview_booking('${a.management_token}','reschedule',3)`);
  equal((await one(`select * from public.get_interview_booking('${a.management_token}')`)).status, "booked");
  const c = await one("select * from public.book_interview_with_management(1,'검증 셋','01000000003')");
  equal(typeof c.application_id, "string");
  await fails("select * from public.book_interview_with_management(3,'검증 넷','01000000004')", /slot_unavailable/);
  await db.query(`select * from public.manage_interview_booking('${a.management_token}','cancel')`);
  equal((await one(`select * from public.get_interview_booking('${a.management_token}')`)).can_manage, false);
  await fails(`select * from public.manage_interview_booking('${a.management_token}','reschedule',3)`, /booking_cancelled/);
  const d = await one("select * from public.book_interview_with_management(3,'검증 하나','01000000001')");
  assert.notEqual(d.management_token, a.management_token); checks++;
  await db.exec("reset role; update public.interview_slots set starts_at=now()-interval '1 hour' where id=2; set role anon;");
  await fails(`select * from public.manage_interview_booking('${b.management_token}','cancel')`, /booking_started/);
  await fails(`select * from public.manage_interview_booking('${b.management_token}','reschedule',1)`, /booking_started/);
  equal((await one(`select * from public.get_interview_booking('${b.management_token}')`)).can_manage, false);
  console.log(`인터뷰 예약 관리 검증 ${checks}개 통과`);
} finally { await db.close(); }
