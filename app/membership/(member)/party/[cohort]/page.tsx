import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MailOpen, PartyPopper } from "lucide-react";
import { requireActiveMembership } from "@/lib/membership/access";

export const metadata: Metadata = {
  title: "파티 초대장",
  robots: { index: false, follow: false }
};

type PartyInvitationPageProps = { params: Promise<{ cohort: string }> };

export default async function PartyInvitationPage({ params }: PartyInvitationPageProps) {
  const member = await requireActiveMembership();
  const cohortNumber = Number((await params).cohort);

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || member.cohortNumber !== cohortNumber) notFound();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <section className="overflow-hidden rounded-[32px] border border-[var(--line)] bg-[var(--paper)]">
        <div className="bg-[var(--forest)] px-7 py-10 text-[var(--cream)] sm:px-10 md:px-12">
          <div className="flex items-center justify-between gap-5"><p className="m-0 text-xs font-bold tracking-[.18em]">PRIVATE INVITATION</p><MailOpen size={26} /></div>
          <h1 className="mt-8 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">READ ME {cohortNumber}기<br />파티 초대장</h1>
        </div>
        <div className="p-7 sm:p-10 md:p-12">
          <PartyPopper className="text-[var(--forest)]" size={30} />
          <h2 className="mt-6 text-2xl font-semibold">함께 읽은 시간을 기념해요</h2>
          <p className="mt-4 max-w-xl leading-8 text-[var(--muted)]">{member.displayName}님과 {member.cohort} 멤버들이 한자리에 모이는 비공개 초대 공간입니다.</p>
          <p className="mt-8 rounded-2xl bg-[var(--sage)] px-5 py-4 text-sm leading-6">파티 일정과 장소는 초대가 확정되면 이곳에서 안내할게요.</p>
        </div>
      </section>
    </main>
  );
}
