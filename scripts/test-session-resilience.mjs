/* 인증 서버 장애 시 공개 화면과 접근 제한이 유지되는지 검증합니다. */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { NextRequest } from "next/server.js";
const runtimeRequire = createRequire(import.meta.url);

function load(relative, mocks = {}) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (name) => {
    if (name in mocks) return mocks[name];
    if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`, mocks);
    return runtimeRequire(name);
  };
  new Function("require", "module", "exports", compiled)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}

const budgetModule = load("lib/supabase/request-budget.ts");
const headerName = budgetModule.AUTH_UNAVAILABLE_HEADER;
const shortBudget = { ...budgetModule, createRequestBudget: () => budgetModule.createRequestBudget(40) };
const config = { getSupabaseConfig: () => ({ url: "https://test.supabase.co", key: "test" }), isSupabaseConfigured: () => true };
let auth;
let clientOptions;
const middleware = load("lib/supabase/middleware.ts", {
  "@/lib/supabase/config": config,
  "@/lib/supabase/request-budget": shortBudget,
  "@supabase/ssr": { createServerClient: (_url, _key, options) => {
    clientOptions = options;
    return { auth: { getUser: () => auth(options) } };
  } }
});
const request = (route, options) => new NextRequest(`https://readme.test${route}`, options);
const anonymous = () => Promise.resolve({ data: { user: null }, error: { name: "AuthSessionMissingError", status: 400 } });
const member = { id: "test-user", app_metadata: {} };

async function main() {
  auth = anonymous;
  let response = await middleware.updateSession(request("/"));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  response = await middleware.updateSession(request("/my?tab=book"));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location")).searchParams.get("next"), "/my?tab=book");

  auth = async (options) => {
    options.cookies.setAll([{ name: "session", value: "renewed", options: { httpOnly: true } }]);
    return { data: { user: member }, error: null };
  };
  response = await middleware.updateSession(request("/my", { headers: { [headerName]: "1" } }));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get(`x-middleware-request-${headerName}`), null);
  assert.equal(response.cookies.get("session").value, "renewed");
  assert.match(response.headers.get("x-middleware-request-cookie"), /session=renewed/);
  response = await middleware.updateSession(request("/admin"));
  assert.equal(new URL(response.headers.get("location")).pathname, "/my");
  assert.equal(response.cookies.get("session").value, "renewed");

  auth = () => new Promise(() => {});
  const start = Date.now();
  response = await middleware.updateSession(request("/", { headers: { cookie: "session=existing" } }));
  assert.ok(Date.now() - start < 500);
  assert.equal(response.headers.get(`x-middleware-request-${headerName}`), "1");
  assert.equal(response.headers.get("set-cookie"), null);
  clientOptions.cookies.setAll([{ name: "session", value: "", options: { maxAge: 0 } }]);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.match(response.headers.get("cache-control"), /no-store/);
  for (const route of ["/my", "/admin", "/membership/members", "/onboarding"]) {
    response = await middleware.updateSession(request(route));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("x-middleware-next"), null);
    assert.match(await response.text(), /새로고침/);
  }
  response = await middleware.updateSession(request("/membership/apply/1"));
  assert.equal(response.headers.get("x-middleware-next"), "1");
  response = await middleware.updateSession(request("/login", { method: "POST" }));
  assert.equal(response.status, 503);

  auth = async () => ({ data: { user: null }, error: { name: "AuthRetryableFetchError", status: 503 } });
  response = await middleware.updateSession(request("/my"));
  assert.equal(response.status, 503);

  let created = 0;
  let degraded = true;
  const header = load("lib/supabase/header-state.ts", {
    "server-only": {},
    "next/headers": { headers: async () => new Headers(degraded ? { [headerName]: "1" } : {}) },
    "@/lib/supabase/config": config,
    "@/lib/supabase/request-budget": shortBudget,
    "@/lib/membership/access": { canUseLegacyMembershipFallback: () => false },
    "@/lib/supabase/server": { createClient: async () => {
      created++;
      return { auth: { getUser: () => new Promise(() => {}) } };
    } }
  });
  assert.equal((await header.getHeaderState()).accountLabel, "로그인 확인 지연");
  assert.equal(created, 0);
  degraded = false;
  assert.equal((await header.getHeaderState()).isAuthenticated, false);
  assert.equal(created, 1);

  const originalFetch = global.fetch;
  let aborted = false;
  let calls = 0;
  global.fetch = (_input, init) => {
    calls++;
    return new Promise((_resolve, reject) => init.signal.addEventListener("abort", () => {
      aborted = true;
      reject(new Error("중단됨"));
    }));
  };
  try {
    const budget = shortBudget.createRequestBudget();
    await assert.rejects(budget.run(() => budget.fetch("https://test.supabase.co/auth/v1/token"), "검증"));
    assert.ok(aborted);
    await assert.rejects(budget.fetch("https://test.supabase.co/auth/v1/token"));
    assert.equal(calls, 1);
  } finally { global.fetch = originalFetch; }

  // 설치된 SSR SDK로 실제 쿠키 해석과 갱신 전파도 확인합니다. 외부 통신은 하지 않습니다.
  const realMiddleware = load("lib/supabase/middleware.ts", {
    "@/lib/supabase/config": config,
    "@/lib/supabase/request-budget": shortBudget
  });
  const session = {
    access_token: "test-access-token", refresh_token: "test-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600,
    token_type: "bearer", user: member
  };
  const cookie = (value) => `sb-test-auth-token=base64-${Buffer.from(JSON.stringify(value)).toString("base64url")}`;
  const endpoints = [];
  global.fetch = async (input) => {
    const url = new URL(String(input));
    endpoints.push(url.pathname);
    return Response.json(url.pathname.endsWith("/token") ? session : member);
  };
  try {
    response = await realMiddleware.updateSession(request("/my", { headers: { cookie: cookie(session) } }));
    assert.equal(response.status, 200);
    assert.ok(endpoints.includes("/auth/v1/user"));
    endpoints.length = 0;
    response = await realMiddleware.updateSession(request("/my", {
      headers: { cookie: cookie({ ...session, expires_at: 1 }) }
    }));
    assert.equal(response.status, 200);
    assert.ok(endpoints.includes("/auth/v1/token"));
    assert.match(response.headers.get("set-cookie"), /sb-test-auth-token=/);
    assert.match(response.headers.get("x-middleware-request-cookie"), /sb-test-auth-token=/);
  } finally { global.fetch = originalFetch; }
  console.log("통과: 익명·로그인·쿠키 갱신·헤더 위조·인증 장애·보호 경로·POST 차단·레이아웃 재조회 방지·요청 중단");
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
