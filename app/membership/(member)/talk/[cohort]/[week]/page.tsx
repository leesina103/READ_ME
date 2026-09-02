import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Lock } from "lucide-react";
import { TalkComposer } from "@/components/TalkComposer";
import { cohortNumberFromName, findSeasonWeek } from "@/data/seasonWeeks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type TalkPageProps = { params: Promise<{ cohort: string; week: string }> };

const blurredFillers = [
  "내 답변을 남기면 열리는 이야기예요. 함께 나눈 생각이 담겨 있어요.",
  "이 자리에는 같은 기수 동료의 답변이 기다리고 있어요.",
  "먼저 나의 답변을 남기고, 서로의 생각을 읽어보세요."
];

export default async function TalkPage({ params }: TalkPageProps) {
  const { cohort: cohortParam, week: weekParam } = await params;
  const cohortNumber = Number(cohortParam);
  const week = Number(weekParam);

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || cohortNumber > 99) notFound();
  const weekInfo = findSeasonWeek(week);
  if (!weekInfo) notFound();
  if (!isSupabaseConfigured()) redirect("/my");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/membership/talk/${cohortNumber}/${week}`);

  const { data: profile } = await supabase.from("profiles").select("cohort").eq("id", user.id).maybeSingle();
  if (!profile?.cohort || cohortNumberFromName(profile.cohort) !== cohortNumber) redirect("/membership");
  const cohortName = profile.cohort;

  const { data: answers } = await supabase
    .from("session_answers")
    .select("user_id, display_name, content, created_at")
    .eq("cohort", cohortName)
    .eq("week_number", week)
    .order("created_at", { ascending: true });

  const mine = answers?.find((answer) => answer.user_id === user.id) ?? null;
  const others = (answers ?? []).filter((answer) => answer.user_id !== user.id);
  let hiddenCount = 0;

  if (!mine) {
    const { data: totalCount } = await supabase.rpc("session_answer_count", { target_cohort: cohortName, target_week: week });
    hiddenCount = typeof totalCount === "number" ? totalCount : 0;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <Link href="/membership" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={15} /> 멤버십 홈으로</Link>
      <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--line)]">
        <header className="border-b border-[var(--line)] bg-[var(--paper)] px-6 py-5">
          <p className="text-xs font-bold tracking-[.14em] text-[var(--forest)]">READ ME {cohortName} · {week}주차 · {weekInfo.type === "input" ? "토의" : "휴식 & OUTPUT"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{weekInfo.roomTitle}</h1>
          <p className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--muted)]"><BookOpen size={15} /> 《{weekInfo.book}》 {weekInfo.author}</p>
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
            <div className="mx-auto my-2 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold text-[var(--muted)]"><Lock size={14} /> 내 답변을 남기면 {hiddenCount}개의 답변이 열려요.</div>
          </>}

          {!mine && hiddenCount === 0 && <p className="mx-auto my-2 text-sm text-[var(--muted)]">아직 답변이 없어요. 첫 번째 이야기를 남겨보세요.</p>}
          {mine && <div className="flex justify-end"><div className="min-w-0 text-right"><span className="text-xs text-[var(--muted)]">나</span><div className="mt-1 max-w-[520px] whitespace-pre-line rounded-2xl rounded-tr-sm bg-[var(--forest)] px-4 py-3 text-left text-[15px] leading-7 text-[var(--cream)]">{mine.content}</div></div></div>}
        </div>
        <TalkComposer cohortNumber={cohortNumber} week={week} initialContent={mine?.content ?? ""} hasAnswer={Boolean(mine)} />
      </div>
    </main>
  );
}
