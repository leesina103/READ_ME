"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { completeOnboardingAction, type OnboardingField, type OnboardingFormState } from "@/app/auth/actions";
import { FormField, FormMessage, inputClassName } from "@/components/FormField";

const initialState: OnboardingFormState = { status: "idle", message: "" };
const limits: Record<OnboardingField, number> = { displayName: 30 };

async function previewOnboardingAction(_state: OnboardingFormState, formData: FormData): Promise<OnboardingFormState> {
  const nickname = String(formData.get("displayName") ?? "").trim();
  if (nickname.length < 2 || nickname.length > 30) {
    return { status: "error", field: "displayName", message: "닉네임은 2자 이상 30자 이하로 입력해 주세요." };
  }
  return { status: "success", message: "미리보기 확인이 끝났어요. 실제 닉네임은 저장되지 않았어요." };
}

export function OnboardingForm({ preview = false }: { preview?: boolean }) {
  const [state, formAction, pending] = useActionState(preview ? previewOnboardingAction : completeOnboardingAction, initialState);
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
      {!errorField && state.message && <FormMessage tone={state.status === "success" ? "success" : "error"}>{state.message}</FormMessage>}
      <button type="submit" disabled={pending} className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50">
        {pending ? "저장 중..." : "닉네임 저장하고 나의 서재로"}
      </button>
    </form>
  );
}
