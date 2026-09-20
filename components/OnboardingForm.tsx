"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { completeOnboardingAction, type OnboardingField, type OnboardingFormState } from "@/app/auth/actions";
import { FormField, FormMessage, inputClassName } from "@/components/FormField";

const initialState: OnboardingFormState = { status: "idle", message: "" };
const limits: Record<OnboardingField, number> = { displayName: 30 };

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);
  const [values, setValues] = useState<Record<OnboardingField, string>>({ displayName: "" });
  const errorField = state.status === "error" ? state.field : undefined;
  const errorFor = (field: OnboardingField) => (errorField === field ? state.message : undefined);
  const counterFor = (field: OnboardingField) => `${values[field].length} / ${limits[field]}`;
  const update = (field: OnboardingField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = event.target.value;
    setValues((previous) => ({ ...previous, [field]: next }));
  };

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <FormField label="닉네임" error={errorFor("displayName")} hint="기수가 시작되면 바꿀 수 없어요." counter={counterFor("displayName")}>
        <input className={inputClassName(errorField === "displayName")} name="displayName" value={values.displayName} onChange={update("displayName")} minLength={2} maxLength={limits.displayName} placeholder="모임에서 사용할 닉네임" required />
      </FormField>
      {!errorField && state.message && <FormMessage tone="error">{state.message}</FormMessage>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50">
        {pending ? "저장 중..." : "닉네임 저장하고 나의 서재로"}
      </button>
    </form>
  );
}
