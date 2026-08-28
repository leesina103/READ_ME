import Link from "next/link";
import { ArrowRight, BookMarked, CalendarDays, MessageSquareText, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/ProfileForm";
import { cohortNumberFromName, seasonWeeks } from "@/data/seasonWeeks";
import { currentTheme } from "@/data/themes";
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
    .select("full_name, display_name, bio, cohort, cohort_message, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.onboarding_completed_at) redirect("/onboarding");

  const { data: cohortSchedule } = profile?.cohort
    ? await supabase.from("cohorts").select("starts_at").eq("name", profile.cohort).maybeSingle()
    : { data: null };

  const displayName = profile?.display_name
    ?? (typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "READ ME 회원");
  const bio = profile?.bio ?? "";
  const cohortMessage = profile?.cohort_message ?? "";
  const cohort = profile?.cohort ?? "기수 미지정";
  const cohortNumber = profile?.cohort ? cohortNumberFromName(profile.cohort) : null;
  const nicknameLocked = Boolean(
    cohortSchedule?.starts_at && new Date(cohortSchedule.starts_at).getTime() <= Date.now()
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">MEMBER AREA</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">{displayName}님의 서재</h1>
          <p className="mt-4 text-sm text-[var(--muted)]">{cohort} · {user.email}</p>
        </div>
        <form action={logoutAction}><button className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold" type="submit">로그아웃</button></form>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7"><BookMarked className="text-[var(--forest)]"/><h2 className="mt-8 text-xl font-semibold">나의 모임</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">참여 기수의 일정, 선정 도서와 공지사항을 확인해요.</p></article>
        <article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7"><MessageSquareText className="text-[var(--forest)]"/><h2 className="mt-8 text-xl font-semibold">질문과 문장</h2><p className="mt-3 text-sm leading-6 text-[var(--muted)]">모임 전 질문을 적고, 대화 뒤 남은 생각을 기록해요.</p></article>
      </div>

      <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <div className="flex items-start gap-4"><UserRound className="mt-1 shrink-0 text-[var(--forest)]"/><div><h2 className="text-xl font-semibold">회원 정보</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">현재 기수는 <strong className="text-[var(--ink)]">{cohort}</strong>입니다. 닉네임과 소개를 관리할 수 있어요.</p></div></div>
        {profileError && <p className="mt-5 text-sm text-[var(--muted)]">프로필 테이블을 불러오지 못했습니다. Supabase 마이그레이션 적용 여부를 확인해 주세요.</p>}
        <ProfileForm displayName={displayName} bio={bio} cohortMessage={cohortMessage} nicknameLocked={nicknameLocked} />
      </section>

      <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <div className="flex items-start gap-4"><CalendarDays className="mt-1 shrink-0 text-[var(--forest)]"/><div><h2 className="text-xl font-semibold">나의 현재 기수</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{cohortNumber ? <>READ ME <strong className="text-[var(--ink)]">{cohort}</strong> · {currentTheme.name}, {currentTheme.subtitle}</> : "아직 참여 중인 기수가 없어요."}</p></div></div>
        {cohortNumber && (
          <ol className="mt-6 border-t border-[var(--line)]">
            {seasonWeeks.map((weekItem) => (
              <li key={weekItem.week} className="border-b border-[var(--line)]">
                <Link href={`/my/talk/${cohortNumber}/${weekItem.week}`} className="flex min-h-14 items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="w-12 shrink-0 text-sm font-semibold text-[var(--forest)]">{weekItem.week}주차</span>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${weekItem.type === "input" ? "bg-[var(--sage)]/50 text-[var(--forest)]" : "bg-[var(--sand)]/40 text-[#8a6a2f]"}`}>
                      {weekItem.type === "input" ? "토의" : "휴식 & OUTPUT"}
                    </span>
                    <span className="truncate text-[15px]">
                      {weekItem.type === "input" ? <>{weekItem.sessionTitle} — 《{weekItem.book}》</> : <>{weekItem.sessionTitle} 실천 기록</>}
                    </span>
                  </div>
                  <ArrowRight size={16} className="shrink-0 text-[var(--muted)]" />
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
