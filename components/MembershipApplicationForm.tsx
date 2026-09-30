"use client";

import { useActionState, useState } from "react";
import { MembershipGroupDetails } from "@/components/MembershipGroupDetails";
import type { MembershipGroupOption } from "@/lib/membership/groupSelection";
import {
  submitMembershipApplicationAction,
  type MembershipApplicationState
} from "@/app/membership/actions";

const initialState: MembershipApplicationState = { status: "idle", message: "" };

type MembershipApplicationFormProps = {
  cohort: string;
  configured: boolean;
  groups: MembershipGroupOption[];
  groupsError?: boolean;
};

export function MembershipApplicationForm({ cohort, configured, groups, groupsError = false }: MembershipApplicationFormProps) {
  const [state, formAction, pending] = useActionState(submitMembershipApplicationAction, initialState);
  const [groupId, setGroupId] = useState("");

  return (
    <form action={formAction} className="mt-10 space-y-5">
      <input type="hidden" name="cohort" value={cohort} />
      <fieldset disabled={pending || state.status === "success"} className="min-w-0 space-y-3">
        <legend className="text-lg font-semibold">참여할 모임 선택</legend>
        <p className="text-sm leading-7 text-[var(--muted)]">가이드 소개와 모임 요일·시간을 확인하고 모임 하나를 선택해 주세요. 운영자가 확인한 뒤 참여가 확정됩니다.</p>
        {groupsError ? <p role="alert" className="text-sm leading-7">모임 정보를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요.</p>
          : groups.length === 0 && <p className="text-sm leading-7">현재 신청할 수 있는 모임이 없습니다. 운영자의 다음 안내를 기다려 주세요.</p>}
        {groups.map((group) => <label key={group.id} className={`flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border p-5 max-[430px]:p-4 ${groupId === group.id ? "border-[var(--forest)] bg-[var(--cream)]" : "border-[var(--line)] bg-[var(--paper)]"}`}>
          <input type="radio" name="groupId" value={group.id} required checked={groupId === group.id} onChange={() => setGroupId(group.id)} className="mt-1 size-4 shrink-0 accent-[var(--forest)]" aria-label={`${group.host_name} 가이드 모임 선택`} />
          <MembershipGroupDetails hostName={group.host_name} hostStyle={group.host_style} venue={group.venue} durationMinutes={group.duration_minutes} meetings={group.meetings} compact />
        </label>)}
      </fieldset>
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
          placeholder="회원가입에 사용할 이메일"
        />
      </label>
      <label className="block text-sm font-medium">
        전화번호
        <input
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]"
          type="tel"
          name="phone"
          autoComplete="tel"
          maxLength={20}
          required
          placeholder="010-1234-5678"
          aria-describedby="application-phone-help"
        />
        <span id="application-phone-help" className="mt-2 block text-sm font-normal text-[var(--muted)]">참여 안내를 문자로 보내드려요.</span>
      </label>
      <label className="block text-sm font-medium">
        출생연도
        <input
          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)]"
          name="birthYear"
          inputMode="numeric"
          autoComplete="bday-year"
          pattern="[0-9]{4}"
          minLength={4}
          maxLength={4}
          required
          placeholder="1990"
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
        <span>입력한 이름, 이메일, 전화번호, 출생연도를 가입 신청 검토와 참여 안내에 사용하는 것에 동의합니다.</span>
      </label>
      {(state.message || !configured) && (
        <p role="status" className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm leading-6 text-[var(--ink)]">
          {state.message || "Supabase 프로젝트 연결 후 신청할 수 있습니다."}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !configured || groupsError || !groupId || state.status === "success"}
        className="w-full rounded-2xl bg-[var(--ink)] px-4 py-3 font-medium text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "신청 중..." : state.status === "success" ? "신청 완료" : "가입 신청서 보내기"}
      </button>
    </form>
  );
}
