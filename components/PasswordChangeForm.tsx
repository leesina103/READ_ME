"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordChangeState } from "@/app/my/settings/actions";

const initialState: PasswordChangeState = { status: "idle", message: "" };

export function PasswordChangeForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initialState);

  return (
    <form action={action} className="mt-7 space-y-5">
      <label className="block text-sm font-medium">현재 비밀번호<input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" type="password" name="currentPassword" autoComplete="current-password" required /></label>
      <label className="block text-sm font-medium">새 비밀번호<input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" type="password" name="newPassword" autoComplete="new-password" minLength={8} required /></label>
      <label className="block text-sm font-medium">새 비밀번호 확인<input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" type="password" name="passwordConfirmation" autoComplete="new-password" minLength={8} required /></label>
      {state.message && <p role="status" className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm leading-6">{state.message}</p>}
      <button type="submit" disabled={pending} className="button button--primary disabled:opacity-50">{pending ? "변경 중..." : "비밀번호 변경"}</button>
    </form>
  );
}
