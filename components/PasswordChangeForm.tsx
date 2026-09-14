"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordChangeState, type PasswordField } from "@/app/my/settings/actions";
import { FormField, FormMessage } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: PasswordChangeState = { status: "idle", message: "" };

const fields: { name: PasswordField; label: string; autoComplete: string; minLength?: number }[] = [
  { name: "currentPassword", label: "현재 비밀번호", autoComplete: "current-password" },
  { name: "newPassword", label: "새 비밀번호", autoComplete: "new-password", minLength: 8 },
  { name: "passwordConfirmation", label: "새 비밀번호 확인", autoComplete: "new-password", minLength: 8 }
];

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);
  const errorField = state.status === "error" ? state.field : undefined;
  const generalMessage = errorField ? "" : state.message;

  return (
    <form action={action} className="mt-7 space-y-5">
      {fields.map(({ name, label, autoComplete, minLength }) => (
        <FormField key={name} label={label} error={errorField === name ? state.message : undefined}>
          <PasswordInput invalid={errorField === name} name={name} autoComplete={autoComplete} minLength={minLength} required />
        </FormField>
      ))}
      {generalMessage && <FormMessage tone={state.status === "success" ? "success" : "error"}>{generalMessage}</FormMessage>}
      <button type="submit" disabled={pending} className="button button--primary disabled:opacity-50">{pending ? "변경 중..." : "비밀번호 변경"}</button>
    </form>
  );
}
