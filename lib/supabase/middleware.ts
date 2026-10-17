import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { AUTH_UNAVAILABLE_HEADER, createRequestBudget, isTemporaryAuthError } from "@/lib/supabase/request-budget";

function copyCookies(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  // 외부에서 보낸 값은 제거하고 이번 요청에서 확인한 결과만 전달합니다.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(AUTH_UNAVAILABLE_HEADER);
  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (!config) return response;

  const budget = createRequestBudget();
  const supabase = createServerClient(config.url, config.key, {
    global: { fetch: budget.fetch },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        if (!budget.active) return;
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const pathname = request.nextUrl.pathname;

  const isPublicMembershipApply = pathname === "/membership/apply"
    || pathname.startsWith("/membership/apply/")
    || /^\/membership\/apply\d+$/.test(pathname);
  const isProtectedMembership = pathname.startsWith("/membership") && !isPublicMembershipApply;
  const isProtected = pathname.startsWith("/my") || pathname.startsWith("/onboarding")
    || pathname.startsWith("/admin") || isProtectedMembership;

  let user;
  try {
    const result = await budget.run(async () => {
      const result = await supabase.auth.getUser();
      if (isTemporaryAuthError(result.error) && result.error?.name !== "AuthSessionMissingError") {
        throw new Error("인증 서버 응답 지연");
      }
      return result;
    }, "미들웨어");
    user = result.data.user;
  } catch {
    // 인증 실패 시 보호된 화면과 서버 액션을 실행하지 않습니다.
    if (isProtected || request.method !== "GET" && request.method !== "HEAD") {
      return copyCookies(response, new NextResponse(
        "로그인 상태를 확인하는 데 시간이 걸리고 있어요. 잠시 후 새로고침해 주세요.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "private, no-store", "Retry-After": "5" } }
      ));
    }
    requestHeaders.set(AUTH_UNAVAILABLE_HEADER, "1");
    const fallback = NextResponse.next({ request: { headers: requestHeaders } });
    fallback.headers.set("Cache-Control", "private, no-store");
    return copyCookies(response, fallback);
  }

  if (!user && isProtected) {
    const nextPath = `${pathname}${request.nextUrl.search}`;
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", nextPath);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (pathname.startsWith("/admin") && user?.app_metadata?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/my";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/onboarding";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}
