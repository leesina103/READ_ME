import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { TallyReviewEmbed } from "@/components/TallyReviewEmbed";
import { currentTheme } from "@/data/themes";
import { requireActiveMembership } from "@/lib/membership/access";
import { parseReviewEvent, reviewEventDetails } from "@/lib/membership/reviews";

export const metadata: Metadata = {
  title: "후기 남기기",
  robots: { index: false, follow: false }
};

type ReviewPageProps = {
  searchParams: Promise<{ event?: string; session?: string }>;
};

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const member = await requireActiveMembership();
  const params = await searchParams;
  const requestedEvent = parseReviewEvent(params.event);
  const requestedSession = Number(params.session);
  const session = requestedEvent === "session"
    && Number.isInteger(requestedSession)
    && requestedSession >= 1
    && requestedSession <= currentTheme.sessions.length
    ? requestedSession
    : undefined;
  const event = requestedEvent === "session" && !session ? "cohort" : requestedEvent;
  const detail = reviewEventDetails[event];
  const cohort = member.cohortNumber ? String(member.cohortNumber) : member.cohort ?? "";
  const contextLabel = event === "session" && session
    ? `READ ME ${member.cohort ?? "현재 기수"} · ${session}회차 세션`
    : `READ ME ${member.cohort ?? "현재 기수"} · ${event === "party" ? "파티" : "기수 전체"}`;
  const tallyParams = new URLSearchParams({
    alignLeft: "1",
    hideTitle: "1",
    transparentBackground: "1",
    dynamicHeight: "1",
    event,
    cohort,
    session: session ? String(session) : ""
  });
  const embedUrl = `https://tally.so/embed/pbQKJb?${tallyParams.toString()}`;
  const externalUrl = `https://tally.so/r/pbQKJb?${new URLSearchParams({
    event,
    cohort,
    session: session ? String(session) : ""
  }).toString()}`;

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 md:py-20">
      <Link href="/membership" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={15} /> 멤버십 홈으로
      </Link>

      <section className="mt-6 overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--paper)]">
        <header className="border-b border-[var(--line)] bg-[var(--forest)] px-6 py-9 text-[var(--cream)] sm:px-9 md:px-12 md:py-11">
          <p className="text-xs font-bold tracking-[.18em]">{detail.eyebrow}</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{detail.title}</h1>
          <p className="mt-4 max-w-2xl leading-8 text-[var(--cream)]/80">{detail.description} 짧게 남겨주셔도 충분해요.</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--cream)]/25 px-4 py-2 text-xs font-semibold">
            <ShieldCheck size={14} /> {contextLabel}
          </div>
        </header>

        <div className="px-2 py-4 sm:px-5 sm:py-6 md:px-8">
          <TallyReviewEmbed embedUrl={embedUrl} />
          <p className="px-4 pb-4 text-center text-xs leading-6 text-[var(--muted)]">
            폼이 보이지 않으면 <a href={externalUrl} target="_blank" rel="noreferrer" className="font-semibold text-[var(--forest)] underline underline-offset-4">새 창에서 작성하기</a>
          </p>
        </div>
      </section>
    </main>
  );
}
