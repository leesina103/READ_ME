export function TalkPrompt({ type, prompt }: { type: "input" | "output"; prompt: string }) {
  return <div className="flex items-start gap-3">
    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--forest)] text-xs font-bold text-[var(--cream)]">리미</span>
    <div className="min-w-0"><span className="text-xs text-[var(--muted)]">리미</span><div className="mt-1 max-w-[520px] rounded-2xl rounded-tl-sm border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-[15px] leading-7">{type === "input" ? "이번 주 질문이에요." : "이번 주 과제예요."}<br /><strong>{prompt}</strong></div></div>
  </div>;
}

export function TalkOwnAnswer({ content }: { content: string }) {
  return <div className="flex justify-end"><div className="min-w-0 text-right"><span className="text-xs text-[var(--muted)]">나</span><div className="mt-1 max-w-[520px] whitespace-pre-line break-words rounded-2xl rounded-tr-sm bg-[var(--forest)] px-4 py-3 text-left text-[15px] leading-7 text-[var(--cream)]">{content}</div></div></div>;
}
