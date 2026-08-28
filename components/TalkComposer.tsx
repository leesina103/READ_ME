"use client";

import { useActionState } from "react";
import { SendHorizonal } from "lucide-react";
import { saveSessionAnswerAction, type FormActionState } from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

type TalkComposerProps = {
  cohortNumber: number;
  week: number;
  initialContent: string;
  hasAnswer: boolean;
};

export function TalkComposer({ cohortNumber, week, initialContent, hasAnswer }: TalkComposerProps) {
  const [state, formAction, pending] = useActionState(saveSessionAnswerAction, initialState);

  return (
    <form action={formAction} className="border-t border-[var(--line)] bg-[var(--paper)] p-4 sm:p-5">
      <input type="hidden" name="cohort" value={cohortNumber} />
      <input type="hidden" name="week" value={week} />
      <div className="flex items-end gap-3">
        <textarea
          key={initialContent}
          className="min-h-20 w-full flex-1 resize-y rounded-2xl border border-[var(--line)] bg-white/60 px-4 py-3 text-[15px] leading-7 outline-none focus:border-[var(--forest)]"
          name="content"
          defaultValue={initialContent}
          placeholder={hasAnswer ? "답변을 수정할 수 있어요." : "나의 답변을 남겨보세요."}
          minLength={2}
          maxLength={2000}
          required
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--forest)] px-5 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50"
        >
          {pending ? "저장 중..." : hasAnswer ? "수정하기" : "보내기"} <SendHorizonal size={14} />
        </button>
      </div>
      {state.status === "error" && <p className="mt-2 text-sm text-[#9c3d22]">{state.message}</p>}
    </form>
  );
}
