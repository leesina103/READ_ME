"use client";

import { useActionState, useEffect, useState } from "react";
import { PencilLine } from "lucide-react";
import { updateProfileFieldAction, type FormActionState, type ProfileFieldName } from "@/app/auth/actions";

const initialState: FormActionState = { status: "idle", message: "" };

type ProfileFieldProps = {
  name: ProfileFieldName;
  label: string;
  value: string;
  minLength: number;
  maxLength: number;
  multiline?: boolean;
  locked?: boolean;
  note?: string;
};

function ProfileField({ name, label, value, minLength, maxLength, multiline, locked, note }: ProfileFieldProps) {
  const [state, formAction, pending] = useActionState(updateProfileFieldAction, initialState);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [savedVisible, setSavedVisible] = useState(false);

  useEffect(() => {
    if (state.status !== "success") return;
    setEditing(false);
    setSavedVisible(true);
    const timer = setTimeout(() => setSavedVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [state]);

  if (!editing) {
    return (
      <div className="rounded-2xl border border-[var(--line)] px-5 py-5">
        <span className="text-xs text-[var(--muted)]">{label}</span>
        {value ? (
          <p className="mt-2 whitespace-pre-line text-[15px] leading-7">{value}</p>
        ) : (
          <p className="mt-2 text-[15px] leading-7 text-[var(--muted)]">아직 작성하지 않았어요.</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--muted)]">
            {savedVisible && state.status === "success" ? state.message : note}
          </span>
          <button
            type="button"
            onClick={() => {
              setDraft(value);
              setEditing(true);
            }}
            disabled={locked}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <PencilLine size={14} /> 수정하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-2xl border border-[var(--forest)] px-5 py-5">
      <input type="hidden" name="field" value={name} />
      <span className="text-xs text-[var(--muted)]">{label}</span>
      {multiline ? (
        <textarea
          className="mt-2 min-h-28 w-full resize-y bg-transparent text-[15px] leading-7 outline-none placeholder:text-[var(--muted)]"
          name="value"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          minLength={minLength}
          maxLength={maxLength}
          autoFocus
          required
        />
      ) : (
        <input
          className="mt-2 w-full bg-transparent text-[15px] leading-7 outline-none placeholder:text-[var(--muted)]"
          name="value"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          minLength={minLength}
          maxLength={maxLength}
          autoFocus
          required
        />
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-[var(--muted)]">
          {state.status === "error" ? <em className="not-italic text-[#9c3d22]">{state.message}</em> : `${draft.length} / ${maxLength}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-[var(--ink)] px-4 py-2 text-sm font-semibold text-[var(--cream)] disabled:opacity-50"
          >
            {pending ? "저장 중..." : "작성 완료"}
          </button>
        </div>
      </div>
    </form>
  );
}

type ProfileFormProps = {
  displayName: string;
  bio: string;
  cohortMessage: string;
  nicknameLocked: boolean;
};

export function ProfileForm({ displayName, bio, cohortMessage, nicknameLocked }: ProfileFormProps) {
  return (
    <div className="mt-8 grid gap-4">
      <ProfileField
        name="displayName"
        label="닉네임"
        value={displayName}
        minLength={2}
        maxLength={30}
        locked={nicknameLocked}
        note={nicknameLocked ? "기수가 시작되어 닉네임을 변경할 수 없습니다." : "기수 시작 후에는 닉네임 변경이 불가합니다."}
      />
      <ProfileField name="bio" label="자기소개" value={bio} minLength={2} maxLength={200} multiline />
      <ProfileField
        name="cohortMessage"
        label="같은 기수 동료들에게 하고 싶은 말"
        value={cohortMessage}
        minLength={2}
        maxLength={300}
        multiline
      />
    </div>
  );
}
