import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Settings, UserRound } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { ProfileForm } from "@/components/ProfileForm";
import { SeasonWeekList } from "@/components/SeasonWeekList";
import { cohortNumberFromName } from "@/data/seasonWeeks";
import { themeForCohort } from "@/data/cohortThemes";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "나의 서재",
  robots: { index: false, follow: false }
};

type MyPageProps = { searchParams: Promise<{ membership?: string }> };

export default async function MyPage({ searchParams }: MyPageProps) {
  const membershipRequired = (await searchParams).membership === "required";
  if (!isSupabaseConfigured()) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="eyebrow">MY READ ME</p>
        <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">나의 서재</h1>
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
  const cohortTheme = cohortNumber ? themeForCohort(cohortNumber) : null;
  const nicknameLocked = Boolean(
    cohortSchedule?.starts_at && new Date(cohortSchedule.starts_at).getTime() <= Date.now()
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">MY READ ME</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl"><span className="text-[var(--forest)]">{displayName}</span>님의 서재</h1>
          <p className="mt-4 text-sm text-[var(--muted)]">{cohort} · {user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/my/settings"
            aria-label="계정 설정"
            title="계정 설정"
            className="grid size-11 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] transition-colors hover:text-[var(--forest)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forest)]"
          >
            <Settings size={18} aria-hidden="true" />
          </Link>
          <form action={logoutAction}><button className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold" type="submit">로그아웃</button></form>
        </div>
      </div>

      {membershipRequired && <p className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--sand)] px-5 py-4 text-sm leading-6">멤버십이 필요한 공간이에요. 멤버십이 만료되었거나 아직 승인 전이라면 운영진에게 문의해 주세요.</p>}

      <section className="mt-12 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <div className="flex items-start gap-4"><UserRound className="mt-1 shrink-0 text-[var(--forest)]"/><div><h2 className="text-xl font-semibold">회원 정보</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">현재 기수는 <strong className="text-[var(--ink)]">{cohort}</strong>입니다. 닉네임과 소개를 관리할 수 있어요.</p></div></div>
        {profileError && <p className="mt-5 text-sm text-[var(--muted)]">회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}
        <ProfileForm displayName={displayName} bio={bio} cohortMessage={cohortMessage} nicknameLocked={nicknameLocked} />
      </section>

      <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <div className="flex items-start gap-4"><CalendarDays className="mt-1 shrink-0 text-[var(--forest)]"/><div><h2 className="text-xl font-semibold">나의 현재 기수</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{cohortTheme ? <>READ ME <strong className="text-[var(--ink)]">{cohort}</strong> · {cohortTheme.name}, {cohortTheme.subtitle}</> : "아직 참여 중인 기수가 없어요."}</p></div></div>
        {cohortNumber && (
          <div className="mt-6"><SeasonWeekList cohortNumber={cohortNumber} /></div>
        )}
      </section>
    </main>
  );
}
