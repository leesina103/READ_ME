import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { seasonWeeksForCohort } from "@/data/seasonWeeks";

export function SeasonWeekList({ cohortNumber }: { cohortNumber: number }) {
  const seasonWeeks = seasonWeeksForCohort(cohortNumber);

  return (
    <ol className="border-t border-[var(--line)]">
      {seasonWeeks.map((weekItem) => (
        <li key={weekItem.week} className="border-b border-[var(--line)] last:border-b-0">
          <Link
            href={`/membership/talk/${cohortNumber}/${weekItem.week}`}
            className="flex min-h-14 items-center justify-between gap-4 py-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span className="w-12 shrink-0 text-sm font-semibold text-[var(--forest)]">{weekItem.week}주차</span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
                  weekItem.type === "input"
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
            <ArrowRight size={16} className="shrink-0 text-[var(--muted)]" />
          </Link>
        </li>
      ))}
    </ol>
  );
}
