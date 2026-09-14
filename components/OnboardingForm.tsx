"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { completeOnboardingAction, type OnboardingField, type OnboardingFormState } from "@/app/auth/actions";
import { FormField, FormMessage, inputClassName } from "@/components/FormField";

const initialState: OnboardingFormState = { status: "idle", message: "" };
const limits: Record<OnboardingField, number> = { displayName: 30, bio: 200, cohortMessage: 300 };

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(completeOnboardingAction, initialState);
  const [values, setValues] = useState<Record<OnboardingField, string>>({ displayName: "", bio: "", cohortMessage: "" });
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
      <FormField label="자기소개" error={errorFor("bio")} counter={counterFor("bio")}>
        <textarea className={`${inputClassName(errorField === "bio")} min-h-28 resize-y`} name="bio" value={values.bio} onChange={update("bio")} minLength={2} maxLength={limits.bio} placeholder="함께 읽는 사람들에게 나를 소개해 주세요." required />
      </FormField>
      <FormField label="같은 기수 동료들에게 하고 싶은 말" error={errorFor("cohortMessage")} counter={counterFor("cohortMessage")}>
        <textarea className={`${inputClassName(errorField === "cohortMessage")} min-h-32 resize-y`} name="cohortMessage" value={values.cohortMessage} onChange={update("cohortMessage")} minLength={2} maxLength={limits.cohortMessage} placeholder="앞으로 함께할 동료들에게 인사를 남겨 주세요." required />
      </FormField>
      {!errorField && state.message && <FormMessage tone="error">{state.message}</FormMessage>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50">
        {pending ? "저장 중..." : "작성 완료하고 나의 서재로"}
      </button>
    </form>
  );
}
