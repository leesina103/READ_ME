import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { seasonWeeksForCohort, type SeasonWeek } from "@/data/seasonWeeks";
import { formatTalkWeekOpenDate } from "@/lib/membership/talkSchedule";
import { deadlineText, type TalkSchedule } from "@/lib/membership/talkDeadlines";

type SeasonWeekListProps = {
  cohortNumber: number;
  readOnly?: boolean;
  showIntroduction?: boolean;
  schedule?: TalkSchedule[];
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

export function SeasonWeekList({ cohortNumber, readOnly = false, showIntroduction = true, schedule = [] }: SeasonWeekListProps) {
  const seasonWeeks = seasonWeeksForCohort(cohortNumber);
  const now = Date.now();

  return (
    <ol className="border-t border-[var(--line)]">
      {showIntroduction && <li className="border-b border-[var(--line)]">
        <Link href={`/membership/talk/${cohortNumber}/0`} className="first-meeting-link">
          <span className="first-meeting-link__label">첫 만남</span>
          <span className="first-meeting-link__copy"><strong>나를 소개해요</strong><small>첫 모임 전에 작성하고 동료들의 소개를 읽어보세요.</small></span>
          <ArrowRight size={16} className="shrink-0 text-[var(--forest)]" aria-hidden="true" />
        </Link>
      </li>}
      {seasonWeeks.map((weekItem) => {
        const timing = schedule.find((item) => item.week_number === weekItem.week);
        const opensAt = timing?.opens_at ? new Date(timing.opens_at) : null;
        const locked = !readOnly && (opensAt === null || opensAt.getTime() > now);

        return (
          <li key={weekItem.week} className="border-b border-[var(--line)] last:border-b-0">
            {locked ? (
              <div className="flex min-h-14 items-center justify-between gap-4 py-4 text-[var(--muted)]">
                <WeekSummary weekItem={weekItem} locked />
                <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold">
                  <Lock size={13} aria-hidden="true" /> {opensAt ? `${formatTalkWeekOpenDate(opensAt)} 열림` : "일정 준비 중"}
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
            {timing && !readOnly && <p className="pb-4 text-xs leading-6 text-[var(--muted)]">{timing.answered ? "작성 완료 · " : ""}{timing.due_at ? deadlineText(timing.due_at) : "모임 일정이 정해지면 작성 날짜를 알려드려요."}</p>}
          </li>
        );
      })}
    </ol>
  );
}
