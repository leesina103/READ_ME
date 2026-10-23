import { AuthForm } from "@/components/AuthForm";
import { GuideShell } from "@/components/GuideShell";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { redirect } from "next/navigation";
import Link from "next/link";
export const metadata = { title: "가이드 가입 초대", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function GuideJoin({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const configured = isSupabaseConfigured();
  const supabase = configured ? await createClient() : null;
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (user) redirect("/guide");
  const result = /^[a-f0-9]{64}$/.test(token) && supabase ? await supabase.rpc("guide_invitation_status", { p_token: token }) : null;
  const status = result?.data;
  return <GuideShell title="가이드 가입 초대" back="/login" backLabel="이미 가입했다면 로그인">
    {!configured || result?.error ? <div className="guide-card"><h2>초대 상태를 확인하지 못했어요.</h2><p>잠시 뒤 새로고침해 주세요. 계속 문제가 생기면 운영자에게 문의해 주세요.</p></div>
      : status === "used" ? <div className="guide-card">
        <h2>이미 회원가입에 사용된 초대 링크예요.</h2>
        <p>이 링크로 가입하셨다면, 가입한 이메일로 보내드린 인증 메일을 확인해 주세요. 인증을 마쳤다면 로그인해 다음 단계를 진행해 주세요.</p>
        <Link href="/login?next=%2Fguide" className="button">로그인하기</Link>
      </div>
      : status === "available" ? <div className="guide-card"><p>가입 → 이메일 인증 → 닉네임 설정 → 운영자 승인 순서로 진행합니다. 운영자가 담당 모임을 배정하면 가이드 모임 관리를 사용할 수 있습니다.</p><AuthForm mode="signup" configured={configured} guideToken={token} /></div>
      : <p>사용할 수 없거나 만료된 초대입니다. 운영자에게 새 초대 링크를 요청해 주세요.</p>}
  </GuideShell>;
}
