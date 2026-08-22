"use client";

import { useActionState } from "react";
import { completeOnboardingAction, type FormActionState } from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <label className="text-sm font-medium">
        닉네임
        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="displayName" minLength={2} maxLength={30} placeholder="모임에서 사용할 닉네임" required />
      </label>
      <label className="text-sm font-medium">
        간단한 자기소개
        <textarea className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="bio" minLength={2} maxLength={200} placeholder="함께 읽는 사람들에게 나를 소개해 주세요." required />
      </label>
      <label className="text-sm font-medium">
        같은 기수 동료들에게 하고 싶은 말
        <textarea className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="cohortMessage" minLength={2} maxLength={300} placeholder="앞으로 함께할 동료들에게 인사를 남겨 주세요." required />
      </label>
      {state.message && <p role="status" className="text-sm text-[var(--forest)]">{state.message}</p>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50">
        {pending ? "저장 중..." : "작성 완료하고 마이페이지로 이동"}
      </button>
    </form>
  );
}
