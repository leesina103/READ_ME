import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MemberIntroductionForm } from "@/components/MemberIntroductionForm";
import { MemberIntroductionContent } from "@/components/MemberIntroductionContent";
import { cohortNameFromNumber } from "@/data/seasonWeeks";
import { getMemberCohortHistory } from "@/lib/membership/access";
import type { MemberDirectoryRow, MemberIntroduction } from "@/lib/membership/introduction";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "첫 만남 · 나를 소개해요", robots: { index: false, follow: false } };

export default async function FirstMeetingPage({ params }: { params: Promise<{ cohort: string }> }) {
  const { cohort: cohortParam } = await params;
  const cohortNumber = Number(cohortParam);
  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || cohortNumber > 99) notFound();

  const { member, cohortNames, currentCohortEnded } = await getMemberCohortHistory();
  const cohortName = cohortNameFromNumber(cohortNumber);
  if (!cohortNames.has(cohortName)) redirect("/membership");
  if (member.cohort !== cohortName) redirect("/membership/talk");
  const readOnly = currentCohortEnded;
  const supabase = await createClient();
  const [profileResult, directoryResult] = await Promise.all([
    supabase.from("profiles").select("introduction_word, bio, cohort_message").eq("id", member.user.id).single(),
    supabase.rpc("list_member_directory")
  ]);
  const peers = ((directoryResult.data ?? []) as MemberDirectoryRow[]).filter((row) => row.cohort === cohortName && row.user_id !== member.user.id);

  return (
    <main className="first-meeting-page">
      <Link href="/membership/talk" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={15} aria-hidden="true" /> 온라인 대화 목록으로</Link>
      <article className="first-meeting-room">
        <header className="first-meeting-room__header">
          <p className="eyebrow">READ ME {cohortName} · FIRST MEETING</p>
          <h1>첫 만남 · 나를 소개해요</h1>
          <p>이름, 나이, 직업, MBTI 대신 지금의 나를 보여주는 이야기로 인사해요.</p>
        </header>
        <div className="first-meeting-room__guide">
          <span className="first-meeting-room__avatar" aria-hidden="true">리미</span>
          <div><p className="text-xs text-[var(--muted)]">리미</p><div className="first-meeting-room__bubble"><strong>첫 모임 전에 나의 소개를 남겨주세요.</strong><br />서로의 소개를 읽고, 첫 만남에서 이어서 이야기해요.</div></div>
        </div>
        <section className="first-meeting-room__mine" aria-labelledby="my-introduction-title">
          <div className="first-meeting-room__section-heading"><h2 id="my-introduction-title">나의 소개</h2><span>{member.displayName}</span></div>
          <p id="first-meeting-sharing-note" className="introduction-sharing-note">현재 기수 동료들에게만 보여요.</p>
          {profileResult.error || !profileResult.data ? <p role="alert" className="mt-5 text-sm leading-7">내 소개를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>
            : readOnly ? <>
              <MemberIntroductionContent introduction={profileResult.data as MemberIntroduction} />
              <p className="mt-5 text-sm leading-7 text-[var(--muted)]">이 기수는 읽기 전용이에요. 현재 소개는 <Link href="/my#introduction" className="font-semibold underline underline-offset-4">나의 서재</Link>에서 수정할 수 있어요.</p>
            </> : <MemberIntroductionForm introduction={profileResult.data as MemberIntroduction} cohortNumber={cohortNumber} />}
        </section>
        <section className="first-meeting-room__peers" aria-labelledby="peer-introduction-title">
          <div className="first-meeting-room__section-heading"><h2 id="peer-introduction-title">같은 기수 동료들의 소개</h2><Link href="/membership/members" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--forest)] underline-offset-4 hover:underline focus-visible:underline">전체 멤버 소개 보기 <ArrowRight size={15} aria-hidden="true" /></Link></div>
          {directoryResult.error ? <p role="alert" className="mt-5 text-sm leading-7">동료 소개를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>
            : peers.length === 0 ? <p className="mt-5 text-sm leading-7 text-[var(--muted)]">아직 함께할 동료의 소개가 없어요. 첫 인사를 남겨주세요.</p>
              : <div className="first-meeting-room__peer-list">{peers.map((peer) => <article key={peer.user_id} className="first-meeting-room__peer"><h3>{peer.display_name}</h3><MemberIntroductionContent introduction={peer} variant="reading" /></article>)}</div>}
        </section>
      </article>
    </main>
  );
}
