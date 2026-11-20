import Link from "next/link";
import { ArrowRight, CalendarDays, NotebookPen } from "lucide-react";
import { formatSeoulDayHeading, formatSeoulTime } from "@/lib/admin/format";
import { reviewFollowUp, type ReviewEvent } from "@/lib/membership/reviews";
import type { TalkSchedule } from "@/lib/membership/talkDeadlines";
import { themeForCohort } from "@/data/cohortThemes";

type ReviewNextStepsProps = {
  event: ReviewEvent;
  session?: number;
  midpoint?: boolean;
  cohortNumber: number | null;
  schedule: TalkSchedule[];
  ended: boolean;
  scheduleError: boolean;
  now?: number;
};

export function ReviewNextSteps({ event, session, midpoint = false, cohortNumber, schedule, ended, scheduleError, now = Date.now() }: ReviewNextStepsProps) {
  const theme = themeForCohort(cohortNumber);
  const { nextMeeting, record, recordWeek } = reviewFollowUp({ event, session, sessionCount: theme.sessions.length, schedule, ended, now });
  const isSession = event === "session" && Boolean(session);
  const isLastSession = session === theme.sessions.length;
  const canWriteRecord = isSession && !ended && !midpoint;
  const recordNotOpen = Boolean(record?.opens_at && Date.parse(record.opens_at) > now);
  const recordHref = cohortNumber && recordWeek && !recordNotOpen
    ? `/membership/talk/${cohortNumber}/${recordWeek}` : "/membership/talk";
  const nextSession = nextMeeting ? theme.sessions[(nextMeeting.week_number - 1) / 2] : null;

  return (
    <section aria-labelledby="review-next-steps" className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8 max-[820px]:p-6 max-[430px]:p-5">
      <h2 id="review-next-steps" className="font-serif text-2xl text-[var(--forest)]">{isSession ? "후기를 남긴 다음에는" : "함께한 기록 돌아보기"}</h2>
      <div className={`mt-6 grid gap-6 ${isSession ? "grid-cols-2 max-[820px]:grid-cols-1" : "grid-cols-1"}`}>
        {isSession && <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold"><CalendarDays size={18} aria-hidden="true" /> 다음 모임 안내</h3>
          {nextMeeting?.meeting_at ? <>
            <p className="mt-3 text-sm font-semibold text-[var(--forest)]">{formatSeoulDayHeading(nextMeeting.meeting_at)} {formatSeoulTime(nextMeeting.meeting_at)} · 한국 시간</p>
            {nextMeeting.group_name && <p className="mt-1 break-words text-sm text-[var(--muted)]">{nextMeeting.group_name}</p>}
            {nextSession && <p className="mt-3 text-sm leading-7 text-[var(--muted)]">다음에 읽을 책은 『{nextSession.book}』입니다. ‘{nextSession.title}’에 대해 이야기해요. 사전 질문과 준비할 내용은 온라인 대화에서 확인해주세요.</p>}
          </> : <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{ended ? "이번 기수의 일정은 마무리되었어요." : isLastSession ? "이번 기수의 오프라인 모임은 여기까지예요. 마지막 실천과 기록을 마친 뒤 기수 전체 후기를 한 번 남겨주세요." : scheduleError ? "지금은 모임 일정을 불러오지 못했어요. 잠시 후 온라인 대화에서 다시 확인해주세요." : "앞으로의 모임 일정이 아직 등록되지 않았어요. 일정이 정해지면 온라인 대화에서 확인할 수 있어요."}</p>}
          <Link href="/membership/talk" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--forest)]">모임 일정과 질문 보기 <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>}
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold"><NotebookPen size={18} aria-hidden="true" /> {canWriteRecord ? "일상에서 실천하고 기록하기" : "나의 질문과 기록"}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{canWriteRecord ? "토의 전 내가 생각한 답, 오늘 새로 들은 관점, 다음 주에 살펴볼 행동이나 질문을 돌아보세요. 일상에서 작은 행동 하나를 해보고, 무엇을 해봤고 무엇이 달라졌는지 실천·기록 주차에 남겨주세요." : "토의 전 내가 생각한 답과 새로 들은 관점, 일상에서 해본 행동이나 남은 질문을 온라인 대화에서 다시 읽어보세요."}</p>
          {canWriteRecord && recordNotOpen && record?.opens_at && <p className="mt-3 text-sm text-[var(--muted)]">{recordWeek}주차 기록은 {formatSeoulDayHeading(record.opens_at)} {formatSeoulTime(record.opens_at)}에 열려요.</p>}
          {canWriteRecord && record?.due_at && <p className="mt-3 text-sm font-semibold text-[var(--forest)]">{recordWeek}주차 기록 마감 · {formatSeoulDayHeading(record.due_at)} {formatSeoulTime(record.due_at)}</p>}
          <Link href={recordHref} className="button button--primary mt-5 max-[430px]:w-full">{!canWriteRecord ? "기록 다시 보기" : recordNotOpen ? "온라인 대화에서 확인하기" : "실천·기록 남기기"}</Link>
        </div>
      </div>
    </section>
  );
}
