import { NextResponse } from "next/server";
import { resetLinkExpiredMessage } from "@/lib/auth/reset-password";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/onboarding";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }

  const isPasswordReset = next.startsWith("/reset-password");
  const failureUrl = new URL(isPasswordReset ? "/reset-password" : "/login", url.origin);
  failureUrl.searchParams.set("message", isPasswordReset ? resetLinkExpiredMessage : "이메일 인증에 실패했습니다. 다시 로그인해 주세요.");
  return NextResponse.redirect(failureUrl);
}
