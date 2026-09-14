"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type ResetFormState } from "@/app/reset-password/actions";
import { FormField, FormMessage, inputClassName } from "@/components/FormField";

const initialState: ResetFormState = { status: "idle", message: "" };

type PasswordResetRequestFormProps = { configured: boolean; notice?: string };

export function PasswordResetRequestForm({ configured, notice }: PasswordResetRequestFormProps) {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);
  const emailError = state.status === "error" && state.field === "email" ? state.message : undefined;
  const generalMessage = emailError ? "" : state.message || notice || (configured ? "" : "Supabase 프로젝트 연결 후 이용할 수 있습니다.");

  return (
    <form action={action} className="mt-8 space-y-4">
      <FormField label="가입한 이메일" error={emailError}>
        <input className={inputClassName(Boolean(emailError))} type="email" name="email" autoComplete="email" required placeholder="hello@example.com" />
      </FormField>
      {generalMessage && <FormMessage tone={state.status === "success" ? "success" : "error"}>{generalMessage}</FormMessage>}
      <button type="submit" disabled={pending || !configured} className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 font-medium text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "보내는 중..." : "재설정 링크 보내기"}
      </button>
    </form>
  );
}
