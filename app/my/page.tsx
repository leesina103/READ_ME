import { BookMarked, MessageSquareText, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/ProfileForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function MyPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <p className="eyebrow">MEMBER AREA</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">나의 서재</h1>
        <div className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8">
          <h2 className="text-xl font-semibold">Supabase 연결이 필요합니다</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">`.env.local`에 프로젝트 URL과 Publishable Key를 등록하면 회원 전용 화면이 활성화됩니다.</p>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/my");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.display_name
    ?? (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "READ ME 회원");
  const bio = profile?.bio ?? "";

  return (
    <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">MEMBER AREA</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">{displayName}님의 서재</h1>
          <p className="mt-4 text-sm text-[var(--muted)]">{user.email}</p>
        </div>
        <form action={logoutAction}><button className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold" type="submit">로그아웃</button></form>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7"><BookMarked className="text-[var(--forest)]"/><h2 className="mt-8 text-xl font-semibold">나의 모임</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">참여 기수의 일정, 선정 도서와 공지사항을 확인해요.</p></article>
        <article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7"><MessageSquareText className="text-[var(--forest)]"/><h2 className="mt-8 text-xl font-semibold">질문과 문장</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">모임 전 질문을 적고, 대화 뒤 남은 생각을 기록해요.</p></article>
      </div>

      <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <div className="flex items-start gap-4"><UserRound className="mt-1 shrink-0 text-[var(--forest)]"/><div><h2 className="text-xl font-semibold">회원 정보</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">모임에서 사용할 이름과 간단한 소개를 관리합니다.</p></div></div>
        {profileError && <p className="mt-5 text-sm text-[var(--muted)]">프로필 테이블을 불러오지 못했습니다. Supabase 마이그레이션 적용 여부를 확인해 주세요.</p>}
        <ProfileForm displayName={displayName} bio={bio} />
      </section>
    </main>
  );
}
