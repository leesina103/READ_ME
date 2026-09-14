"use client";

import { useActionState } from "react";
import { setNewPasswordAction, type ResetField, type ResetFormState } from "@/app/reset-password/actions";
import { FormField, FormMessage } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: ResetFormState = { status: "idle", message: "" };

const fields: { name: ResetField; label: string }[] = [
  { name: "password", label: "새 비밀번호" },
  { name: "passwordConfirmation", label: "새 비밀번호 확인" }
];

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(setNewPasswordAction, initialState);
  const errorField = state.status === "error" ? state.field : undefined;
  const generalMessage = errorField ? "" : state.message;

  return (
    <form action={action} className="mt-8 space-y-4">
      {fields.map(({ name, label }) => (
        <FormField key={name} label={label} error={errorField === name ? state.message : undefined}>
          <PasswordInput invalid={errorField === name} name={name} autoComplete="new-password" minLength={8} required placeholder="8자 이상" />
        </FormField>
      ))}
      {generalMessage && <FormMessage tone="error">{generalMessage}</FormMessage>}
      <button type="submit" disabled={pending} className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 font-medium text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "저장 중..." : "비밀번호 저장"}
      </button>
    </form>
  );
}
