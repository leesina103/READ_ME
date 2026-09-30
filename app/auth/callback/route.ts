import { NextResponse } from "next/server";
import { resetLinkExpiredMessage } from "@/lib/auth/reset-password";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") && !/[\\\r\n]/.test(value) ? value : "/onboarding";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeNextPath(url.searchParams.get("next"));

  // 메일 토큰을 직접 검증하므로 요청한 브라우저의 쿠키가 없어도 인증할 수 있습니다.
  if (tokenHash && isSupabaseConfigured() && (type === "email" || type === "recovery")) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(type === "recovery" ? "/reset-password/new" : "/onboarding", url.origin));
  } else if (!tokenHash && code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const isPasswordReset = type === "recovery" || next.startsWith("/reset-password");
  const failureUrl = new URL(isPasswordReset ? "/reset-password" : "/login", url.origin);
  failureUrl.searchParams.set("message", isPasswordReset ? resetLinkExpiredMessage : "이메일 인증에 실패했습니다. 다시 로그인해 주세요.");
  return NextResponse.redirect(failureUrl);
}
