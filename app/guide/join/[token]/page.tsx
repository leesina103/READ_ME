import { AuthForm } from "@/components/AuthForm";
import { GuideShell } from "@/components/GuideShell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
export const metadata = { title: "가이드 가입 초대", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function GuideJoin({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (user) redirect("/guide");
  const valid = /^[a-f0-9]{64}$/.test(token) && supabase ? await supabase.rpc("guide_invitation_valid", { p_token: token }) : null;
  return <GuideShell title="가이드 가입 초대" back="/login" backLabel="이미 가입했다면 로그인">
    {valid?.data === true ? <div className="guide-card"><p>가입 → 이메일 인증 → 닉네임 설정 → 운영자 승인 순서로 진행합니다. 운영자가 담당 모임을 배정하면 가이드 모임 관리를 사용할 수 있습니다.</p><AuthForm mode="signup" configured={configured} guideToken={token} /></div> : <p>사용할 수 없거나 만료된 초대입니다. 운영자에게 새 초대 링크를 요청해 주세요.</p>}
  </GuideShell>;
}
