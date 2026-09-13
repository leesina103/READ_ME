import { SeasonWeekList } from "@/components/SeasonWeekList";
import { requireActiveMembership } from "@/lib/membership/access";

export default async function TalkIndexPage() {
  const member = await requireActiveMembership();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="eyebrow">ONLINE TALK</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{member.cohort ?? "나의 기수"} 온라인 대화</h1>
      <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">먼저 내 답변을 남긴 뒤 같은 기수 멤버들의 생각을 읽을 수 있어요.</p>
      {member.cohortNumber ? (
        <section className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
          <SeasonWeekList cohortNumber={member.cohortNumber} />
        </section>
      ) : (
        <p className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-[var(--muted)]">참여 중인 기수가 확인되면 대화 목록이 열립니다.</p>
      )}
    </main>
  );
}
