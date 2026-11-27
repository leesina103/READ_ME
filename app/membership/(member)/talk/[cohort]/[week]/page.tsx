import { CohortLabel } from "@/components/CohortLabel";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { TalkQuestions } from "@/components/TalkQuestions";
import { TalkExampleFrame } from "@/components/TalkExampleFrame";
import { cohortNameFromNumber, findSeasonWeek } from "@/data/seasonWeeks";
import { getMemberCohortHistory } from "@/lib/membership/access";
import { createClient } from "@/lib/supabase/server";
import { getTalkSchedule } from "@/lib/membership/talkData";
import { deadlineText } from "@/lib/membership/talkDeadlines";
import { formatSeoulDayHeading, formatSeoulTime } from "@/lib/admin/format";

type TalkPageProps = { params: Promise<{ cohort: string; week: string }>; searchParams: Promise<{ preview?: string; question?: string }> };

function TalkDataError() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <Link href="/membership/talk" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={15} /> 온라인 대화 목록으로
      </Link>
      <div role="alert" className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm leading-7 text-[var(--muted)]">
        대화를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.
      </div>
    </main>
  );
}

export default async function TalkPage({ params, searchParams }: TalkPageProps) {
  const { cohort: cohortParam, week: weekParam } = await params;
  const cohortNumber = Number(cohortParam);
  const week = Number(weekParam);

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || cohortNumber > 99) notFound();
  const weekInfo = findSeasonWeek(cohortNumber, week);
  if (!weekInfo) notFound();

  // 진행 중인 현재 기수만 읽기·쓰기. 지난 기수와 종료일이 지난 기수는 읽기만 허용하고, 그 외 기수는 멤버십 홈으로 보낸다.
  const { member, cohortNames } = await getMemberCohortHistory();
  const cohortName = cohortNameFromNumber(cohortNumber);
  if (!cohortNames.has(cohortName)) redirect("/membership");
  const isAdmin = member.user.app_metadata?.role === "admin";
  const query = await searchParams;
  const isExample = query.preview === "1";
  const selected = query.question === undefined ? null : Number(query.question);
  const roomPath = `/membership/talk/${cohortNumber}/${week}`;
  if (isExample && !isAdmin) redirect(roomPath);
  const isCurrentCohort = member.ownCohort === cohortName;
  const staffView = member.staffCohorts.includes(cohortName);
  const supabase = await createClient();
  const { data: cohortInfo } = await supabase.from("cohorts").select("ends_at").eq("name", cohortName).maybeSingle();
  const currentCohortEnded = Boolean(cohortInfo?.ends_at && Date.parse(cohortInfo.ends_at) <= Date.now());
  const { schedule } = await getTalkSchedule(cohortName);
  const timing = schedule.find((item) => item.week_number === week);
  // 운영자는 공개 전 질문도 미리 읽을 수 있다. 회원의 공개 일정과 답변 작성 조건은 유지한다.
  const isPendingWeek = (isCurrentCohort || staffView) && (!timing?.opens_at || Date.parse(timing.opens_at) > Date.now());
  if (isPendingWeek && !isAdmin) redirect("/membership/talk");
  const readOnly = !isCurrentCohort || currentCohortEnded || isPendingWeek;
  const user = member.user;

  const [followups, answers] = await Promise.all([
    supabase.from("talk_followup_questions").select("question_number,prompt")
      .eq("cohort", cohortName).eq("week_number", week).order("question_number"),
    isExample ? { data: [], error: null } : supabase.from("talk_question_answers")
      .select("question_number,user_id,display_name,content").eq("cohort", cohortName)
      .eq("week_number", week).order("created_at").order("id")
  ]);
  if (followups.error || !followups.data || followups.data.length < 2 || answers.error) return <TalkDataError />;
  const questions = [{ question_number: 1, prompt: weekInfo.prompt }, ...followups.data];
  if (selected !== null && !questions.some(q => q.question_number === selected)) notFound();
  const rows = answers.data ?? [];
  const mine = new Set(rows.filter(answer => answer.user_id === user.id).map(answer => answer.question_number));
  const staffReader = staffView && !isCurrentCohort;
  let lockedPeerCount = 0;
  if (selected !== null && !isExample && !staffReader && !mine.has(selected)) {
    const { data, error } = await supabase.rpc("talk_question_peer_count", {
      target_cohort: cohortName, target_week: week, target_question: selected
    });
    if (error || typeof data !== "number") return <TalkDataError />;
    lockedPeerCount = data;
  }
  const visibleAnswers = rows.filter(answer => staffReader || mine.has(answer.question_number));
  const listPath = roomPath + (isExample ? "?preview=1" : "");

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <Link href={selected ? listPath : "/membership/talk"} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={15} /> {selected ? `${week}주차 질문 목록` : "온라인 대화 목록으로"}</Link>
      <TalkExampleFrame enabled={isExample}>
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-6 py-5">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--forest)]">READ ME <CohortLabel>{cohortName}</CohortLabel> · {week}주차 · {weekInfo.type === "input" ? "토의" : "실천 & OUTPUT"}{isExample ? <span className="group-data-[capture=true]/talk:hidden"> · 예시 작성</span> : readOnly && " · 읽기 전용"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{weekInfo.roomTitle}</h1>
          <div className="mt-2 flex items-center justify-between gap-4 max-[820px]:gap-2 max-[430px]:flex-col max-[430px]:items-stretch">
            <p className="flex min-w-0 items-center gap-2 text-sm text-[var(--muted)]"><BookOpen size={15} className="shrink-0" /><span>『{weekInfo.book}』 {weekInfo.author}</span></p>
            {isAdmin && <Link href={isExample ? roomPath : `${roomPath}?preview=1`} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-[var(--forest)] underline underline-offset-4 max-[430px]:self-end group-data-[capture=true]/talk:hidden">{isExample ? "예시 작성 끝내기" : "예시 답변 작성해 보기"}</Link>}
          </div>
          {selected === null && !isExample && !readOnly && <div className="mt-4 rounded-2xl bg-[var(--sage)]/35 p-4 text-sm leading-7">
            {timing?.meeting_at && <p>{formatSeoulDayHeading(timing.meeting_at)} {formatSeoulTime(timing.meeting_at)} 모임</p>}
            <p className="font-semibold">{timing?.due_at ? deadlineText(timing.due_at) : "모임 일정이 정해지면 작성 날짜를 알려드려요."}</p>
            <p className="text-xs text-[var(--muted)]">날짜가 지나도 기수가 끝나기 전까지 작성하거나 수정할 수 있어요.</p>
            <p className="text-xs text-[var(--muted)]">답변은 같은 기수 동료들과 나눠요. 이 기수 담당 가이드와 운영자도 모임 준비를 위해 읽을 수 있어요. 질문에 답하면 그 질문에 남긴 동료들의 답변이 열려요.</p>
          </div>}
        </header>

        <TalkQuestions key={roomPath + String(isExample)} cohortNumber={cohortNumber} week={week}
          lockedPeerCount={lockedPeerCount} selected={selected} questions={questions} answers={visibleAnswers.map(answer => ({
            question: answer.question_number, name: answer.display_name, content: answer.question_number === selected ? answer.content : "", mine: answer.user_id === user.id
          }))} example={isExample} readOnly={readOnly} staffView={staffReader} />

        {readOnly && !isExample && (
          <div className="flex items-start gap-2 border-t border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--muted)] sm:p-5">
            <Lock size={14} className="mt-1 shrink-0" aria-hidden="true" />
            {isPendingWeek ? (
              <p>운영자 미리보기입니다. 질문은 미리 볼 수 있고, 답변은 주차가 열린 뒤 작성할 수 있어요.</p>
            ) : staffView && !isCurrentCohort ? (
              <p>운영·진행을 위한 조회 화면입니다. 참여자로 가입한 현재 기수에서는 내 답변을 작성할 수 있어요.</p>
            ) : isCurrentCohort ? (
              <p>{cohortName}가 마무리되어 대화방은 읽기만 가능해요.</p>
            ) : (
              <p>지난 기수 대화방은 읽기만 가능해요.{member.cohort && !currentCohortEnded && <> 새 답변은 <Link href="/membership/talk" className="font-semibold text-[var(--forest)] underline underline-offset-4">{member.cohort} 대화방</Link>에서 남겨주세요.</>}</p>
            )}
          </div>
        )}
      </TalkExampleFrame>
    </main>
  );
}
