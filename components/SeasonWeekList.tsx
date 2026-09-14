import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { seasonWeeksForCohort, type SeasonWeek } from "@/data/seasonWeeks";
import { formatTalkWeekOpenDate, talkWeekOpensAt } from "@/lib/membership/talkSchedule";

type SeasonWeekListProps = {
  cohortNumber: number;
  // 기수 시작 시각(cohorts.starts_at). 있으면 1주차부터 매주 같은 요일·시각에 순차 공개하고, 없으면 전부 연다.
  startsAt?: string | null;
};

function WeekSummary({ weekItem, locked }: { weekItem: SeasonWeek; locked: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <span className={`w-12 shrink-0 text-sm font-semibold ${locked ? "text-[var(--muted)]" : "text-[var(--forest)]"}`}>{weekItem.week}주차</span>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
          locked
            ? "bg-[var(--sand)]/30 text-[var(--muted)]"
            : weekItem.type === "input"
              ? "bg-[var(--sage)]/50 text-[var(--forest)]"
              : "bg-[var(--sand)]/40 text-[var(--muted)]"
        }`}
      >
        {weekItem.type === "input" ? "토의" : "실천 & OUTPUT"}
      </span>
      <span className="truncate text-[15px]">
        {weekItem.type === "input" ? (
          <>{weekItem.sessionTitle} — 『{weekItem.book}』</>
        ) : (
          <><strong className="font-semibold">{weekItem.sessionTitle}</strong> 실천 기록</>
        )}
      </span>
    </div>
  );
}

export function SeasonWeekList({ cohortNumber, startsAt = null }: SeasonWeekListProps) {
  const seasonWeeks = seasonWeeksForCohort(cohortNumber);
  const now = Date.now();

  return (
    <ol className="border-t border-[var(--line)]">
      {seasonWeeks.map((weekItem) => {
        const opensAt = talkWeekOpensAt(startsAt, weekItem.week);
        const locked = opensAt !== null && opensAt.getTime() > now;

        return (
          <li key={weekItem.week} className="border-b border-[var(--line)] last:border-b-0">
            {locked ? (
              <div className="flex min-h-14 items-center justify-between gap-4 py-4 text-[var(--muted)]">
                <WeekSummary weekItem={weekItem} locked />
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold">
                  <Lock size={13} aria-hidden="true" /> {formatTalkWeekOpenDate(opensAt)} 열림
                </span>
              </div>
            ) : (
              <Link
                href={`/membership/talk/${cohortNumber}/${weekItem.week}`}
                className="flex min-h-14 items-center justify-between gap-4 py-4"
              >
                <WeekSummary weekItem={weekItem} locked={false} />
                <ArrowRight size={16} className="shrink-0 text-[var(--muted)]" />
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}
