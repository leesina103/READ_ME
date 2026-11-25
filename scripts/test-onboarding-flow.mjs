// 외부 메일을 발송하지 않고 인증 분기와 알림 요청의 내용을 검증합니다.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

let checks = 0;
function equal(actual, expected) { assert.deepEqual(actual, expected); checks++; }
function load(file, imports, globals = {}) {
  const loaded = { exports: {} };
  const source = ts.transpileModule(readFileSync(file, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(source, { module: loaded, exports: loaded.exports, URL, Response, console, ...globals, require: (name) => {
    if (!(name in imports)) throw new Error(`등록하지 않은 의존성: ${name}`);
    return imports[name];
  } }, { filename: file });
  return loaded.exports;
}

const calls = [];
let authError = null;
const callback = load("app/auth/callback/route.ts", {
  "next/server": { NextResponse: { redirect: (url) => Response.redirect(url, 307) } },
  "@/lib/auth/reset-password": { resetLinkExpiredMessage: "만료" },
  "@/lib/supabase/config": { isSupabaseConfigured: () => true },
  "@/lib/supabase/server": { createClient: async () => ({ auth: {
    verifyOtp: async (args) => { calls.push(JSON.parse(JSON.stringify(args))); return { error: authError }; },
    exchangeCodeForSession: async (code) => { calls.push(code); return { error: authError }; }
  } }) }
});
async function redirect(query) {
  return (await callback.GET(new Request(`https://readme.example/auth/callback?${query}`))).headers.get("location");
}
equal(await redirect("token_hash=signup-token&type=email"), "https://readme.example/onboarding");
equal(calls.pop(), { token_hash: "signup-token", type: "email" });
equal(await redirect("token_hash=reset-token&type=recovery&next=https://other.example"), "https://readme.example/reset-password/new");
equal(calls.pop(), { token_hash: "reset-token", type: "recovery" });
equal(await redirect("code=legacy&next=/my"), "https://readme.example/my");
equal(calls.pop(), "legacy");
equal(await redirect("code=legacy&next=/%5Cother.example"), "https://readme.example/onboarding");
calls.pop();
authError = { message: "이미 사용한 토큰" };
equal(new URL(await redirect("token_hash=used&type=recovery")).pathname, "/reset-password");
equal(new URL(await redirect("token_hash=used&type=email")).pathname, "/login");
calls.length = 0;
equal(new URL(await redirect("token_hash=token&type=invite&code=legacy")).pathname, "/login");
equal(calls.length, 0);

const requests = [];
const env = { RESEND_API_KEY: "test-key", INTERVIEW_ADMIN_EMAIL: "admin@example.test" };
const { sendInterviewAdminNotification: notify } = load("lib/interview/admin-notification.ts", {
  "server-only": {},
  "@/lib/interview/booking": { formatInterviewTime: (value) => value },
  "@/supabase/functions/operations-worker/email-html.mjs": await import("../supabase/functions/operations-worker/email-html.mjs"),
  "@/supabase/functions/operations-worker/message-templates.mjs": await import("../supabase/functions/operations-worker/message-templates.mjs")
}, {
  process: { env }, AbortSignal,
  fetch: async (_url, init) => { requests.push(init); return { ok: true }; }
});
const booking = { applicationId: "test-booking", startsAt: "2030-01-01T00:00:00Z", name: "테스트 예약자", phone: "01000000000" };
equal(await notify(booking), "accepted");
equal(await notify({ ...booking, event: "rescheduled", updatedAt: "2030-01-01T01:00:00Z" }), "accepted");
equal(await notify({ ...booking, event: "rescheduled", updatedAt: "2030-01-01T02:00:00Z" }), "accepted");
equal(await notify({ ...booking, event: "cancelled", updatedAt: "2030-01-01T03:00:00Z" }), "accepted");
equal(new Set(requests.map((request) => request.headers["Idempotency-Key"])).size, 4);
equal(requests.map((request) => JSON.parse(request.body).subject), ["[READ ME] 새 인터뷰 예약", "[READ ME] 인터뷰 일정 변경", "[READ ME] 인터뷰 일정 변경", "[READ ME] 인터뷰 예약 취소"]);
for (const request of requests) {
  const message = JSON.parse(request.body);
  equal(message.to, [env.INTERVIEW_ADMIN_EMAIL]);
  equal(message.text.includes("예약자 이름: 테스트 예약자"), true);
  equal(message.text.includes("연락처: 010-0000-0000"), true);
  equal(message.text.includes(booking.startsAt), true);
  equal(message.text.includes("/admin/interviews"), true);
  equal(message.text.includes("/interview/apply/manage/"), false);
}
delete env.RESEND_API_KEY;
equal(await notify(booking), "not_configured");
equal(requests.length, 4);
env.RESEND_API_KEY = 'test-key';
let claimed = { id: 'notice', lease_id: 'lease', payload: { name: '<가이드>', nickname: '나무', email: 'guide@example.test' } };
let sendOk = true;
const finishes = [];
const guideRequests = [];
const mailGlobals = {
  process: { env }, AbortSignal, console: { error() {} },
  fetch: async (_url, init) => { guideRequests.push(init); return { ok: sendOk, status: sendOk ? 200 : 500 }; }
};
const mail = load('lib/admin-review-email.ts', { 'server-only': {} }, mailGlobals);
const { sendGuideApprovalNotification: notifyGuide } = load('lib/guide/admin-notification.ts', {
  'server-only': {}, '@/lib/admin-review-email': mail
}, mailGlobals);
const client = { rpc: async (name, args) => {
  if (name === 'claim_guide_approval_notification') return { data: claimed, error: null };
  finishes.push(args); return { error: null };
} };
await notifyGuide(client);
equal(finishes.length, 1);
const message = JSON.parse(guideRequests[0].body);
equal(message.to, ['admin@example.test']);
equal(message.text.includes('guide@example.test'), true);
equal(message.html.includes('&lt;가이드&gt;'), true);
equal(message.html.includes('/admin/roles'), true);
equal(guideRequests[0].headers['Idempotency-Key'], 'guide-approval-notice');
sendOk = false; await notifyGuide(client);
equal(finishes.length, 1);
equal(guideRequests[1].body, guideRequests[0].body);
claimed = null; await notifyGuide(client); equal(guideRequests.length, 2);
delete env.RESEND_API_KEY; await notifyGuide(client); equal(guideRequests.length, 2);
env.RESEND_API_KEY = 'test-key';
let applicationError = null;
const { submitMembershipApplicationAction } = load('app/membership/actions.ts', {
  '@/data/currentMeeting': { currentMeeting: { cohort: '1기', recruiting: true } },
  '@/lib/admin-review-email': mail,
  '@/lib/supabase/config': { isSupabaseConfigured: () => true },
  '@/lib/supabase/server': { createClient: async () => ({ rpc: async () => ({ error: applicationError }) }) },
  '@/lib/membership/referral': { validateReferral: () => null }
}, mailGlobals);
const form = new FormData();
for (const [key, value] of Object.entries({
  name: '<신청자>', email: 'member@example.test', phone: '01012345678', birthYear: '1990',
  cohort: '1기', groupId: '12345678-1234-1234-1234-123456789abc', privacyConsent: 'on'
})) form.set(key, value);
sendOk = true;
equal((await submitMembershipApplicationAction(null, form)).status, 'success');
const applicationMail = JSON.parse(guideRequests.at(-1).body);
equal(applicationMail.to, ['admin@example.test']);
equal(applicationMail.html.includes('&lt;신청자&gt;'), true);
equal(applicationMail.html.includes('/admin/applications'), true);
sendOk = false;
equal((await submitMembershipApplicationAction(null, form)).status, 'success');
applicationError = { message: 'application_already_submitted' };
equal((await submitMembershipApplicationAction(null, form)).status, 'error');
equal(guideRequests.length, 4);
console.log(`인증·알림 검증 ${checks}개 통과`);
