"use client";

import { useActionState } from "react";
import {
  loginAction,
  signupAction,
  type FormActionState
} from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

type AuthFormProps = {
  mode: "login" | "signup";
  configured: boolean;
  next?: string;
  notice?: string;
};

export function AuthForm({ mode, configured, next = "/my", notice }: AuthFormProps) {
  const action = mode === "login" ? loginAction : signupAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {mode === "signup" && (
        <label className="block text-sm font-medium">
          이름
          <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="displayName" autoComplete="name" minLength={2} maxLength={30} required placeholder="모임에서 사용할 이름" />
        </label>
      )}
      <label className="block text-sm font-medium">
        이메일
        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" type="email" name="email" autoComplete="email" required placeholder="hello@example.com" />
      </label>
      <label className="block text-sm font-medium">
        비밀번호
        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" type="password" name="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required placeholder="8자 이상" />
      </label>
      {mode === "login" && <input type="hidden" name="next" value={next} />}
      {(state.message || notice || !configured) && (
        <p role="status" className={`rounded-2xl border border-[var(--line)] px-4 py-3 text-sm leading-6 ${state.status === "error" || !configured ? "text-[var(--ink)]" : "text-[var(--forest)]"}`}>
          {state.message || notice || "Supabase 프로젝트 연결 후 로그인할 수 있습니다."}
        </p>
      )}
      <button type="submit" disabled={pending || !configured} className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 font-medium text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}
