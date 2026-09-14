"use client";

import { startTransition, useActionState } from "react";
import { loginAction, resendConfirmationAction, signupAction, type AuthField, type AuthFormState } from "@/app/auth/actions";
import { FormField, FormMessage, inputClassName } from "@/components/FormField";
import { PasswordInput } from "@/components/PasswordInput";

const initialState: AuthFormState = { status: "idle", message: "" };

type AuthFormProps = {
  mode: "login" | "signup";
  configured: boolean;
  next?: string;
  notice?: string;
};

export function AuthForm({ mode, configured, next = "/my", notice }: AuthFormProps) {
  const isLogin = mode === "login";
  const [state, formAction, pending] = useActionState(isLogin ? loginAction : signupAction, initialState);
  const [resendState, resendAction, resendPending] = useActionState(resendConfirmationAction, initialState);
  const errorField = state.status === "error" ? state.field : undefined;
  const errorFor = (field: AuthField) => (errorField === field ? state.message : undefined);
  const generalMessage = errorField ? "" : state.message || notice || (configured ? "" : "Supabase 프로젝트 연결 후 로그인할 수 있습니다.");
  const values = resendState.values ?? state.values;
  const showResend = isLogin && state.status === "error" && state.canResendConfirmation;

  return (
    <form action={formAction} className="mt-8 space-y-4">
      {!isLogin && (
        <FormField label="이름" error={errorFor("displayName")}>
          <input className={inputClassName(errorField === "displayName")} name="displayName" autoComplete="name" minLength={2} maxLength={30} required placeholder="가입 신청서에 적은 이름" defaultValue={values?.displayName ?? ""} />
        </FormField>
      )}
      <FormField label="이메일" error={errorFor("email")}>
        <input
          className={inputClassName(errorField === "email")}
          type={isLogin ? "text" : "email"}
          name="email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete={isLogin ? "username" : "email"}
          required
          placeholder="hello@example.com"
          defaultValue={values?.email ?? ""}
        />
      </FormField>
      {showResend && (resendState.status === "success" ? (
        <FormMessage tone="success">{resendState.message}</FormMessage>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            disabled={resendPending}
            onClick={(event) => {
              const formData = new FormData(event.currentTarget.form ?? undefined);
              startTransition(() => resendAction(formData));
            }}
            className="font-medium text-[var(--forest)] underline underline-offset-4 disabled:opacity-50"
          >
            {resendPending ? "보내는 중..." : "인증 메일 다시 보내기"}
          </button>
          {resendState.status === "error" && <span className="text-[#9c3d22]">{resendState.message}</span>}
        </div>
      ))}
      <FormField label="비밀번호" error={errorFor("password")}>
        <PasswordInput invalid={errorField === "password"} name="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={8} required placeholder="8자 이상" />
      </FormField>
      {isLogin && <input type="hidden" name="next" value={next} />}
      {generalMessage && <FormMessage tone={state.status === "success" ? "success" : "error"}>{generalMessage}</FormMessage>}
      <button type="submit" disabled={pending || !configured} className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 font-medium text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50">
        {pending ? "처리 중..." : isLogin ? "로그인" : "회원가입"}
      </button>
    </form>
  );
}
