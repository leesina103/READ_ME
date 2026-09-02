import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { seasonWeeks } from "@/data/seasonWeeks";
import { requireActiveMembership } from "@/lib/membership/access";

export default async function TalkIndexPage() {
  const member = await requireActiveMembership();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <p className="eyebrow">ONLINE TALK</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{member.cohort ?? "나의 기수"} 온라인 대화</h1>
      <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">먼저 내 답변을 남긴 뒤 같은 기수 멤버들의 생각을 읽을 수 있어요.</p>
      {member.cohortNumber ? (
        <ol className="mt-10 overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--paper)] px-6 md:px-8">
          {seasonWeeks.map((weekItem) => (
            <li key={weekItem.week} className="border-b border-[var(--line)] last:border-b-0">
              <Link href={`/membership/talk/${member.cohortNumber}/${weekItem.week}`} className="flex min-h-20 items-center justify-between gap-5 py-5">
                <span className="flex min-w-0 items-center gap-4"><MessagesSquare className="shrink-0 text-[var(--forest)]" size={20} /><span><strong className="block">{weekItem.week}주차 · {weekItem.roomTitle}</strong><small className="mt-1 block truncate text-[var(--muted)]">《{weekItem.book}》 {weekItem.author}</small></span></span>
                <ArrowRight className="shrink-0 text-[var(--forest)]" size={17} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-[var(--muted)]">참여 중인 기수가 확인되면 대화 목록이 열립니다.</p>
      )}
    </main>
  );
}
