"use client";

import { useActionState, useState } from "react";
import { SendHorizonal } from "lucide-react";
import { saveSessionAnswerAction, type FormActionState } from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

type TalkComposerProps = {
  cohortNumber: number;
  week: number;
  question: number;
  initialContent: string;
  hasAnswer: boolean;
  onExampleSubmit?: (content: string) => void;
};

export function TalkComposer({ cohortNumber, week, question, initialContent, hasAnswer, onExampleSubmit }: TalkComposerProps) {
  const [draft, setDraft] = useState(initialContent);
  const deleting = hasAnswer && !draft.trim();
  async function submitExample(_previous: FormActionState, form: FormData): Promise<FormActionState> {
    const content = String(form.get("content") ?? "").trim();
    if (!deleting && (content.length < 2 || content.length > 2000)) {
      return { status: "error", message: "답변은 2자 이상 2000자 이하로 작성해 주세요." };
    }
    onExampleSubmit?.(content);
    return { status: "success", message: deleting ? "예시 답변을 삭제했어요." : "예시 답변을 표시했어요." };
  }
  const [state, formAction, pending] = useActionState(onExampleSubmit ? submitExample : saveSessionAnswerAction, initialState);
  const inputId = `talk-answer-${question}`;
  const messageId = `${inputId}-message`;

  return (
    <form action={formAction} className="border-t border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5">
      <input type="hidden" name="cohort" value={cohortNumber} />
      <input type="hidden" name="intent" value={deleting ? "delete" : "save"} />
      <input type="hidden" name="week" value={week} />
      <div className="flex items-end gap-3 max-[430px]:flex-col max-[430px]:items-stretch">
        <input type="hidden" name="question" value={question} />
        <label className="sr-only" htmlFor={inputId}>{question}번 질문에 대한 나의 답변</label>
        <textarea
          id={inputId}
          className="min-h-20 w-full flex-1 resize-y rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 text-[15px] leading-7 outline-none focus:border-[var(--forest)]"
          name="content"
          value={draft}
          onChange={event => setDraft(event.target.value)}
          placeholder={hasAnswer ? "답변을 수정할 수 있어요." : "나의 답변을 남겨보세요."}
          minLength={deleting ? undefined : 2}
          maxLength={2000}
          required={!hasAnswer}
          aria-describedby={state.message ? messageId : undefined}
        />
        <button
          type="submit"
          disabled={pending || (!deleting && draft.trim().length < 2)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--cream)] cursor-pointer disabled:cursor-default disabled:opacity-50 max-[430px]:w-full"
        >
          {pending ? "저장 중..." : deleting ? "답변 삭제하기" : hasAnswer ? "수정하기" : "보내기"} <SendHorizonal size={14} />
        </button>
      </div>
      {state.message && <p id={messageId} role={state.status === "error" ? "alert" : "status"} className={`mt-3 rounded-2xl px-4 py-3 text-sm leading-6 ${state.status === "error" ? "bg-[var(--sand)]" : "bg-[var(--sage)]/40"}`}>{state.message}</p>}
    </form>
  );
}
