"use client";

import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { saveMemberIntroductionAction, type IntroductionFormState } from "@/app/membership/introduction-actions";
import { MemberIntroductionContent } from "@/components/MemberIntroductionContent";
import { introductionFields, isIntroductionComplete, type IntroductionField, type MemberIntroduction } from "@/lib/membership/introduction";

const initialState: IntroductionFormState = { status: "idle", message: "" };

type Props = {
  introduction: MemberIntroduction;
  cohortNumber?: number;
};

export function MemberIntroductionForm({ introduction, cohortNumber }: Props) {
  const isFirstMeeting = cohortNumber !== undefined;
  const [state, formAction, pending] = useActionState(saveMemberIntroductionAction, initialState);
  const complete = isIntroductionComplete(introduction);
  const [editing, setEditing] = useState(!complete);
  const [values, setValues] = useState({ introductionWord: introduction.introduction_word ?? "", bio: introduction.bio, cohortMessage: introduction.cohort_message });

  useEffect(() => {
    if (state.status === "success") setEditing(false);
  }, [state]);

  const startEditing = () => {
    setValues({ introductionWord: introduction.introduction_word ?? "", bio: introduction.bio, cohortMessage: introduction.cohort_message });
    setEditing(true);
  };

  return (
    <div className="introduction-editor">
      {!editing ? <>
        <MemberIntroductionContent introduction={introduction} />
        <button type="button" className="button button--ghost" onClick={startEditing}>내 소개 수정하기</button>
      </> : (
        <form action={formAction} className="introduction-form">
          {cohortNumber !== undefined && <input type="hidden" name="cohort" value={cohortNumber} />}
          {(Object.keys(introductionFields) as IntroductionField[]).map((name) => {
            const field = introductionFields[name];
            const invalid = state.status === "error" && state.field === name;
            const hintId = `${cohortNumber ?? "my"}-${name}-hint`;
            const props = {
              name,
              value: values[name],
              onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((previous) => ({ ...previous, [name]: event.target.value })),
              minLength: field.min,
              maxLength: field.max,
              required: true,
              "aria-invalid": invalid,
              "aria-describedby": isFirstMeeting ? `first-meeting-sharing-note ${hintId}` : hintId,
              className: "introduction-form__input"
            };
            return (
              <label key={name} className="introduction-form__field">
                <span>{isFirstMeeting && name === "cohortMessage" ? "같은 기수 동료들에게 하고 싶은 말" : field.label}</span>
                {name === "introductionWord"
                  ? <input {...props} autoComplete="off" placeholder="예: 유예, 호기심, 산책" />
                  : <textarea {...props} rows={4} placeholder={name === "bio" ? "지금의 마음이나 관심사와 연결해 짧게 적어주세요." : "함께 읽고 이야기할 동료들에게 인사를 남겨주세요."} />}
                <span className="introduction-form__hint" id={hintId}>
                  <span role={invalid ? "alert" : undefined}>{invalid ? state.message : isFirstMeeting ? null : "현재 기수 동료들에게만 보여요."}</span>
                  <span>{values[name].length} / {field.max}</span>
                </span>
              </label>
            );
          })}
          {state.status === "error" && !state.field && <p role="alert" className="text-sm leading-7 text-[var(--ink)]">{state.message}</p>}
          <div className="introduction-form__actions">
            <button type="submit" className="button button--primary" disabled={pending}>{pending ? "저장 중…" : "소개 저장하기"}</button>
            {complete && <button type="button" className="button button--ghost" onClick={() => setEditing(false)} disabled={pending}>취소</button>}
          </div>
        </form>
      )}
      {!editing && state.status === "success" && <p role="status" className="text-sm leading-7 text-[var(--forest)]">{state.message}</p>}
    </div>
  );
}
