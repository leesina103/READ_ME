"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfileAction, type FormActionState } from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

type ProfileFormProps = {
  displayName: string;
  bio: string;
  cohortMessage: string;
  nicknameLocked: boolean;
};

export function ProfileForm({ displayName, bio, cohortMessage, nicknameLocked }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);
  const [editingNickname, setEditingNickname] = useState(false);

  useEffect(() => {
    if (state.status === "success") setEditingNickname(false);
  }, [state]);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3">
          <label className="min-w-0 flex-1">
            <span className="text-xs text-[var(--muted)]">닉네임</span>
            {editingNickname && !nicknameLocked ? (
              <input
                className="mt-1 w-full bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-[var(--muted)]"
                name="displayName"
                minLength={2}
                maxLength={30}
                placeholder="새 닉네임 입력"
                autoFocus
                required
              />
            ) : (
              <span className="mt-1 block font-semibold">{displayName}</span>
            )}
          </label>
          <button
            type={editingNickname ? "submit" : "button"}
            onClick={() => {
              if (!editingNickname) setEditingNickname(true);
            }}
            disabled={nicknameLocked || pending}
            className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            {pending && editingNickname ? "저장 중..." : editingNickname ? "완료" : "변경"}
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {nicknameLocked
            ? "기수가 시작되어 닉네임을 변경할 수 없습니다."
            : "기수 시작 후에는 닉네임 변경이 불가합니다."}
        </p>
      </div>

      {!editingNickname && (
        <input type="hidden" name="displayName" value={displayName} />
      )}
      <label className="text-sm font-medium">
        자기소개
        <textarea className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="bio" defaultValue={bio} minLength={2} maxLength={200} required />
      </label>
      <label className="text-sm font-medium">
        같은 기수 동료들에게 하고 싶은 말
        <textarea className="mt-2 min-h-32 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]" name="cohortMessage" defaultValue={cohortMessage} minLength={2} maxLength={300} required />
      </label>
      {state.message && <p role="status" className="text-sm text-[var(--forest)]">{state.message}</p>}
      <button type="submit" disabled={pending} className="justify-self-start rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)] disabled:opacity-50">
        {pending ? "저장 중..." : "회원 정보 저장"}
      </button>
    </form>
  );
}
