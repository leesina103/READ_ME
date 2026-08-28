"use client";

import { useActionState } from "react";
import {
  submitMembershipApplicationAction,
  type MembershipApplicationState
} from "@/app/membership/actions";

const initialState: MembershipApplicationState = { status: "idle", message: "" };

type MembershipApplicationFormProps = {
  cohort: string;
  configured: boolean;
};

export function MembershipApplicationForm({ cohort, configured }: MembershipApplicationFormProps) {
  const [state, formAction, pending] = useActionState(submitMembershipApplicationAction, initialState);

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <input type="hidden" name="cohort" value={cohort} />
      <label className="block text-sm font-medium">
        이름
        <input
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]"
          name="name"
          autoComplete="name"
          minLength={2}
          maxLength={30}
          required
          placeholder="인터뷰에서 사용한 이름"
        />
      </label>
      <label className="block text-sm font-medium">
        이메일
        <input
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]"
          type="email"
          name="email"
          autoComplete="email"
          maxLength={320}
          required
          placeholder="승인 안내를 받을 이메일"
        />
      </label>
      <label className="block text-sm font-medium">
        신청 기수
        <input
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--sand)] px-4 py-3 text-[var(--muted)]"
          value={`READ ME ${cohort}`}
          readOnly
        />
      </label>
      <label className="block text-sm font-medium">
        남기고 싶은 말 <span className="font-normal text-[var(--muted)]">(선택)</span>
        <textarea
          className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 leading-7 outline-none focus:border-[var(--forest)]"
          name="message"
          maxLength={1000}
          placeholder="운영자가 신청을 검토할 때 참고하면 좋은 내용을 남겨주세요."
        />
      </label>
      <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-4 text-sm leading-6">
        <input className="mt-1 accent-[var(--forest)]" type="checkbox" name="privacyConsent" required />
        <span>입력한 이름과 이메일을 가입 신청 검토와 참여 안내에 사용하는 것에 동의합니다.</span>
      </label>
      {(state.message || !configured) && (
        <p role="status" className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">
          {state.message || "Supabase 프로젝트 연결 후 신청할 수 있습니다."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !configured || state.status === "success"}
        className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 font-medium text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "신청 중..." : state.status === "success" ? "신청 완료" : "가입 신청서 보내기"}
      </button>
    </form>
  );
}
