"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TalkComposer } from "@/components/TalkComposer";
import { TalkOwnAnswer } from "@/components/TalkMessages";

type Answer = { question: number; name: string; content: string; mine: boolean };
type Props = {
  cohortNumber: number;
  week: number;
  questions: { question_number: number; prompt: string }[];
  answers: Answer[];
  selected: number | null;
  lockedPeerCount: number;
  example: boolean;
  readOnly: boolean;
  staffView: boolean;
};

export function TalkQuestions({ cohortNumber, week, questions, answers, selected, lockedPeerCount, example, readOnly, staffView }: Props) {
  const [examples, setExamples] = useState<Record<number, string>>({});
  const [reset, setReset] = useState(0);
  const written = example ? Object.values(examples).filter(Boolean).length : answers.filter(a => a.mine).length;
  const path = `/membership/talk/${cohortNumber}/${week}`;
  const questionUrl = (number: number) => `${path}?question=${number}${example ? "&preview=1" : ""}`;
  const index = questions.findIndex(q => q.question_number === selected);
  const question = questions[index];
  const next = questions[index + 1];
  const own = selected && (example ? examples[selected] : answers.find(a => a.mine && a.question === selected)?.content);
  const peers = answers.filter(a => !a.mine && a.question === selected);
  const canRead = Boolean(own) || (staffView && !example);

  return <section aria-label={question ? "질문 대화방" : "주차별 질문"} className="bg-[var(--paper)]">
    {example && <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2 text-sm group-data-[capture=true]/talk:hidden">
      <p>운영자 예시 작성 · 새로고침하면 지워져요.</p>
      <button type="button" className="min-h-11 cursor-pointer underline" onClick={() => {
        setExamples({}); setReset(value => value + 1);
      }}>예시 초기화</button>
    </div>}
    {!question ? <div className="p-6 max-[430px]:p-4">
      <p className="mb-4 text-sm font-semibold text-[var(--forest)]">{written} / {questions.length} 작성</p>
      {questions.map(({ question_number: number, prompt }) => {
        const done = example ? Boolean(examples[number]) : answers.some(a => a.mine && a.question === number);
        const count = answers.filter(a => !a.mine && a.question === number).length;
        return <Link key={number} href={questionUrl(number)} className="flex min-h-14 cursor-pointer items-start gap-3 border-t border-[var(--line)] py-4 hover:bg-[var(--cream)]">
          <span className="font-semibold text-[var(--forest)]">{number}.</span>
          <span className="min-w-0 flex-1"><strong className="block whitespace-pre-line break-words">{prompt}</strong>
            <small className="mt-1 block text-[var(--muted)]">{done ? `작성 완료 · 동료 답변 ${count}개` : "미작성"}</small></span>
          <ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0" />
        </Link>;
      })}
    </div> : <>
      <div className="space-y-4 bg-[var(--sage)]/35 p-6 max-[430px]:p-4">
        <p className="text-xs font-semibold text-[var(--forest)]">질문 {index + 1} / {questions.length}</p>
        <div><span className="text-xs text-[var(--muted)]">리미</span><h2 className="mt-1 w-fit max-w-[520px] whitespace-pre-line rounded-2xl rounded-tl-sm bg-[var(--paper)] px-4 py-3 font-semibold">{question.prompt}</h2></div>
        {canRead && peers.map((a, i) => <div key={i}><span className="text-xs text-[var(--muted)]">{a.name}</span>
          <p className="mt-1 w-fit max-w-[520px] whitespace-pre-wrap break-words rounded-2xl rounded-tl-sm bg-[var(--paper)] px-4 py-3">{a.content}</p></div>)}
        {own && <TalkOwnAnswer content={own} />}
        {!canRead && lockedPeerCount > 0 && <p className="flex w-fit items-center gap-2 rounded-2xl rounded-tl-sm bg-[var(--paper)] px-4 py-3 text-sm">
          <span role="img" aria-label="잠김">🔒</span> 동료 {lockedPeerCount}명이 답했어요.
        </p>}
        {(!canRead && lockedPeerCount === 0 || canRead && peers.length === 0) && <p className="text-sm text-[var(--muted)]">{own ? "아직 동료 답변이 없어요." : "아직 첫 답변을 기다리고 있어요"}</p>}
      </div>
      {(example || !readOnly) && <TalkComposer key={`${question.question_number}-${reset}-${Boolean(own)}`} cohortNumber={cohortNumber} week={week} question={question.question_number}
        initialContent={own || ""} hasAnswer={Boolean(own)} onExampleSubmit={example ? content => setExamples(prev => ({ ...prev, [question.question_number]: content })) : undefined} />}
      <div className="flex justify-end border-t border-[var(--line)] px-5">
        <Link href={next ? questionUrl(next.question_number) : path + (example ? "?preview=1" : "")} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--forest)]">{next ? "다음 질문" : "질문 목록"} <ArrowRight size={15} /></Link>
      </div>
    </>}
  </section>;
}
