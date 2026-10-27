"use client";

import { useState } from "react";
import { TalkComposer } from "@/components/TalkComposer";
import { TalkOwnAnswer, TalkPrompt } from "@/components/TalkMessages";

export function TalkExample({ cohortNumber, week, type, prompt }: {
  cohortNumber: number; week: number; type: "input" | "output"; prompt: string;
}) {
  const [content, setContent] = useState("");
  const [resetCount, setResetCount] = useState(0);

  return <>
    <div className="flex items-center justify-between gap-4 border-b border-[var(--line)] bg-[var(--paper)] px-5 py-4 text-sm leading-6 sm:px-6 max-[820px]:gap-2 max-[430px]:flex-col max-[430px]:items-stretch group-data-[capture=true]/talk:hidden">
      <div className="min-w-0 flex-1">
        <p className="font-semibold">운영자 전용 · 예시 작성 중</p>
        <p className="text-[var(--muted)]">답변을 보내고 수정하는 화면을 확인할 수 있어요. 실제 답변으로 저장되거나 회원에게 보이지 않으며, 새로고침하면 사라져요.</p>
      </div>
      <button type="button" className="min-h-11 shrink-0 text-sm font-semibold text-[var(--forest)] underline underline-offset-4 max-[430px]:self-end" onClick={() => {
        setContent("");
        setResetCount((count) => count + 1);
      }}>예시 초기화</button>
    </div>
    <div className="flex flex-col gap-5 bg-[var(--sage)]/35 px-5 py-7 sm:px-6">
      <TalkPrompt type={type} prompt={prompt} />
      {content ? <TalkOwnAnswer content={content} /> : <p className="mx-auto my-2 text-sm text-[var(--muted)]"><span className="group-data-[capture=true]/talk:hidden">아래에 예시 답변을 작성해 보세요.</span><span className="hidden group-data-[capture=true]/talk:inline">아직 답변이 없어요. 첫 번째 이야기를 남겨보세요.</span></p>}
    </div>
    <TalkComposer key={resetCount} cohortNumber={cohortNumber} week={week} initialContent={content} hasAnswer={Boolean(content)} onExampleSubmit={setContent} />
  </>;
}
