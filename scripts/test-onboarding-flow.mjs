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
  "@/lib/interview/booking": { formatInterviewTime: (value) => value }
}, {
  process: { env }, AbortSignal,
  fetch: async (_url, init) => { requests.push(init); return { ok: true }; }
});
const booking = { applicationId: "test-booking", startsAt: "2030-01-01T00:00:00Z" };
equal(await notify(booking), "accepted");
equal(await notify({ ...booking, event: "rescheduled", updatedAt: "2030-01-01T01:00:00Z" }), "accepted");
equal(await notify({ ...booking, event: "rescheduled", updatedAt: "2030-01-01T02:00:00Z" }), "accepted");
equal(await notify({ ...booking, event: "cancelled", updatedAt: "2030-01-01T03:00:00Z" }), "accepted");
equal(new Set(requests.map((request) => request.headers["Idempotency-Key"])).size, 4);
equal(requests.map((request) => JSON.parse(request.body).subject), ["[READ ME] 새 인터뷰 예약", "[READ ME] 인터뷰 일정 변경", "[READ ME] 인터뷰 일정 변경", "[READ ME] 인터뷰 예약 취소"]);
delete env.RESEND_API_KEY;
equal(await notify(booking), "not_configured");
equal(requests.length, 4);
console.log(`인증·알림 검증 ${checks}개 통과`);
