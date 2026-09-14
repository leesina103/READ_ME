import { Lock } from "lucide-react";
import { SeasonWeekList } from "@/components/SeasonWeekList";
import { getMemberCohortHistory } from "@/lib/membership/access";

function ReadOnlyBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--sand)]/40 px-3 py-1 text-[11px] font-bold tracking-wide text-[var(--muted)]">
      <Lock size={12} aria-hidden="true" /> 읽기 전용
    </span>
  );
}

export default async function TalkIndexPage() {
  const { member, pastCohorts, currentCohortEnded, currentCohortStartsAt } = await getMemberCohortHistory();

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="eyebrow">ONLINE TALK</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">{member.cohort ?? "나의 기수"} 온라인 대화</h1>
      <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">
        {currentCohortEnded
          ? `${member.cohort}가 마무리되어 대화방은 읽기만 가능해요. 답변을 남겼던 주차의 이야기를 다시 볼 수 있어요.`
          : "먼저 내 답변을 남긴 뒤 같은 기수 멤버들의 생각을 읽을 수 있어요."}
      </p>
      {member.cohortNumber ? (
        <section className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
          {currentCohortEnded && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{member.cohort} 온라인 대화</h2>
              <ReadOnlyBadge />
            </div>
          )}
          <SeasonWeekList cohortNumber={member.cohortNumber} startsAt={currentCohortStartsAt} />
        </section>
      ) : (
        <p className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-[var(--muted)]">참여 중인 기수가 확인되면 대화 목록이 열립니다.</p>
      )}

      {pastCohorts.length > 0 && (
        <section className="mt-14" aria-labelledby="past-cohort-talks">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--forest)]">PAST SEASONS</p>
          <h2 id="past-cohort-talks" className="mt-3 text-2xl font-semibold">지난 기수 대화방</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">지난 기수 대화방은 읽기만 가능해요. 답변을 남겼던 주차의 이야기를 다시 볼 수 있어요.</p>
          {pastCohorts.map((cohort) => (
            <div key={cohort.name} className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold">{cohort.name} 온라인 대화</h3>
                <ReadOnlyBadge />
              </div>
              <div className="mt-5"><SeasonWeekList cohortNumber={cohort.number} /></div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
