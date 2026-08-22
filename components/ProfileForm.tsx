"use client";

import { useActionState } from "react";
import { updateProfileAction, type FormActionState } from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

type ProfileFormProps = {
  displayName: string;
  bio: string;
};

export function ProfileForm({ displayName, bio }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <label className="text-sm font-medium">
        이름
        <input className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="displayName" defaultValue={displayName} minLength={2} maxLength={30} required />
      </label>
      <label className="text-sm font-medium">
        자기소개
        <textarea className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="bio" defaultValue={bio} maxLength={200} placeholder="함께 읽는 사람들에게 나를 간단히 소개해 주세요." />
      </label>
      {state.message && <p role="status" className="text-sm text-[var(--forest)]">{state.message}</p>}
      <button type="submit" disabled={pending} className="justify-self-start rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50">
        {pending ? "저장 중..." : "회원 정보 저장"}
      </button>
    </form>
  );
}
