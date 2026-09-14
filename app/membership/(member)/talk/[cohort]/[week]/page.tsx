import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { TalkComposer } from "@/components/TalkComposer";
import { cohortNameFromNumber, findSeasonWeek } from "@/data/seasonWeeks";
import { getMemberCohortHistory } from "@/lib/membership/access";
import { createClient } from "@/lib/supabase/server";

type TalkPageProps = { params: Promise<{ cohort: string; week: string }> };

const blurredFillers = [
  "내 답변을 남기면 열리는 이야기예요. 함께 나눈 생각이 담겨 있어요.",
  "이 자리에는 같은 기수 동료의 답변이 기다리고 있어요.",
  "먼저 나의 답변을 남기고, 서로의 생각을 읽어보세요."
];

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

export default async function TalkPage({ params }: TalkPageProps) {
  const { cohort: cohortParam, week: weekParam } = await params;
  const cohortNumber = Number(cohortParam);
  const week = Number(weekParam);

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || cohortNumber > 99) notFound();
  const weekInfo = findSeasonWeek(cohortNumber, week);
  if (!weekInfo) notFound();

  // 진행 중인 현재 기수만 읽기·쓰기. 지난 기수와 종료일이 지난 기수는 읽기만 허용하고, 그 외 기수는 멤버십 홈으로 보낸다.
  const { member, cohortNames, currentCohortEnded } = await getMemberCohortHistory();
  const cohortName = cohortNameFromNumber(cohortNumber);
  if (!cohortNames.has(cohortName)) redirect("/membership");
  const isCurrentCohort = member.cohort === cohortName;
  const readOnly = !isCurrentCohort || currentCohortEnded;
  const user = member.user;

  const supabase = await createClient();
  const { data: answers, error: answersError } = await supabase
    .from("session_answers")
    .select("user_id, display_name, content, created_at")
    .eq("cohort", cohortName)
    .eq("week_number", week)
    .order("created_at", { ascending: true });
  if (answersError) return <TalkDataError />;

  const mine = answers?.find((answer) => answer.user_id === user.id) ?? null;
  const others = (answers ?? []).filter((answer) => answer.user_id !== user.id);
  let hiddenCount = 0;

  if (!mine) {
    const { data: totalCount, error: countError } = await supabase.rpc("session_answer_count", { target_cohort: cohortName, target_week: week });
    if (countError) return <TalkDataError />;
    hiddenCount = typeof totalCount === "number" ? totalCount : 0;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <Link href="/membership/talk" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={15} /> 온라인 대화 목록으로</Link>
      <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--line)]">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-6 py-5">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--forest)]">READ ME {cohortName} · {week}주차 · {weekInfo.type === "input" ? "토의" : "실천 & OUTPUT"}{readOnly && " · 읽기 전용"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{weekInfo.roomTitle}</h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><BookOpen size={15} /> 『{weekInfo.book}』 {weekInfo.author}</p>
        </header>

        <div className="flex flex-col gap-5 bg-[var(--sage)]/35 px-5 py-7 sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-xs font-bold text-[var(--cream)]">리미</span>
            <div><span className="text-xs text-[var(--muted)]">리미</span><div className="mt-1 max-w-[520px] rounded-2xl rounded-tl-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[15px] leading-7">{weekInfo.type === "input" ? <>이번 주 질문이에요.<br /><strong>{weekInfo.prompt}</strong></> : <>이번 주 과제예요.<br /><strong>{weekInfo.prompt}</strong></>}</div></div>
          </div>

          {others.map((answer) => (
            <div key={answer.user_id} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--sand)] text-sm font-bold text-[var(--ink)]">{answer.display_name.slice(0, 1)}</span>
              <div className="min-w-0"><span className="text-xs text-[var(--muted)]">{answer.display_name}</span><div className="mt-1 max-w-[520px] whitespace-pre-line rounded-2xl rounded-tl-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[15px] leading-7">{answer.content}</div></div>
            </div>
          ))}

          {!mine && hiddenCount > 0 && <>
            {Array.from({ length: hiddenCount }, (_, index) => <div key={index} className="flex items-start gap-3" aria-hidden="true"><span className="size-9 shrink-0 rounded-full bg-[var(--sand)]/70" /><div className="max-w-[520px] select-none rounded-2xl rounded-tl-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[15px] leading-7 blur-[6px]">{blurredFillers[index % blurredFillers.length]}</div></div>)}
            <div className="mx-auto my-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-center text-sm font-semibold text-[var(--muted)]"><Lock size={14} className="shrink-0" /> {readOnly ? `답변을 남기지 않은 주차라 동료들의 답변 ${hiddenCount}개는 열리지 않아요.` : `내 답변을 남기면 ${hiddenCount}개의 답변이 열려요.`}</div>
          </>}

          {!mine && hiddenCount === 0 && <p className="mx-auto my-2 text-sm text-[var(--muted)]">{readOnly ? "이 주차에는 남겨진 답변이 없어요." : "아직 답변이 없어요. 첫 번째 이야기를 남겨보세요."}</p>}
          {mine && <div className="flex justify-end"><div className="min-w-0 text-right"><span className="text-xs text-[var(--muted)]">나</span><div className="mt-1 max-w-[520px] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[var(--forest)] px-4 py-3 text-left text-[15px] leading-7 text-[var(--cream)]">{mine.content}</div></div></div>}
        </div>

        {readOnly ? (
          <div className="flex items-start gap-2 border-t border-[var(--line)] bg-[var(--paper)] p-4 text-sm leading-6 text-[var(--muted)] sm:p-5">
            <Lock size={14} className="mt-1 shrink-0" aria-hidden="true" />
            {isCurrentCohort ? (
              <p>{cohortName}가 마무리되어 대화방은 읽기만 가능해요.</p>
            ) : (
              <p>지난 기수 대화방은 읽기만 가능해요.{member.cohort && !currentCohortEnded && <> 새 답변은 <Link href="/membership/talk" className="font-semibold text-[var(--forest)] underline underline-offset-4">{member.cohort} 대화방</Link>에서 남겨주세요.</>}</p>
            )}
          </div>
        ) : (
          <TalkComposer cohortNumber={cohortNumber} week={week} initialContent={mine?.content ?? ""} hasAnswer={Boolean(mine)} />
        )}
      </div>
    </main>
  );
}
