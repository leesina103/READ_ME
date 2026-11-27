export function TalkOwnAnswer({ content }: { content: string }) {
  return <div className="flex justify-end"><div className="min-w-0 text-right"><span className="text-xs text-[var(--muted)]">나</span><div className="mt-1 max-w-[520px] whitespace-pre-line break-words rounded-2xl rounded-tr-sm bg-[var(--forest)] px-4 py-3 text-left text-[15px] leading-7 text-[var(--cream)]">{content}</div></div></div>;
}
