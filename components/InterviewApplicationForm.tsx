"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CalendarCheck2, CheckCircle2, TriangleAlert } from "lucide-react";
import {
  submitInterviewApplicationAction,
  type InterviewApplicationState
} from "@/app/interview/apply/actions";

import { InterviewSchedulePicker } from "@/components/InterviewSchedulePicker";
import { formatInterviewTime } from "@/lib/interview/booking";
import type { InterviewSlot } from "@/lib/interview/slots";

const initialState: InterviewApplicationState = { status: "idle", message: "" };
type InterviewApplicationFormProps = {
  slots: InterviewSlot[];
  loadFailed?: boolean;
};

export function InterviewApplicationForm({ slots, loadFailed = false }: InterviewApplicationFormProps) {
  const [state, formAction, pending] = useActionState(submitInterviewApplicationAction, initialState);

  if (state.status === "success" && state.startsAt) {
    return (
      <section className="interview-apply-success" aria-live="polite">
        <CheckCircle2 size={34} aria-hidden="true" />
        <p className="eyebrow">APPLICATION COMPLETE</p>
        <h2>인터뷰 예약을 받았습니다.</h2>
        <div className="interview-apply-success__time">
          <CalendarCheck2 size={20} aria-hidden="true" />
          <strong>{formatInterviewTime(state.startsAt)}</strong>
        </div>
        {state.notificationStatus === "sent" && <p>선택한 일정과 안내 페이지를 카카오톡으로 보내드렸어요.</p>}
        {state.notificationStatus === "not_configured" && <p>예약은 저장됐습니다. 카카오 알림 연동 전이라 이 화면에서 일정을 확인해 주세요.</p>}
        {state.notificationStatus === "failed" && <p>예약은 저장됐지만 카카오톡 안내 전송이 지연되고 있습니다. 운영진이 다시 확인할게요.</p>}
        <div className="cta-actions">
          {state.managementPath && <Link href={state.managementPath} className="button button--primary">예약 변경·취소</Link>}
          <Link href="/interview" className="button button--primary">인터뷰 안내 다시 보기</Link>
          <Link href="/" className="button button--ghost">READ ME 홈</Link>
        </div>
        <p>일정 변경·취소는 인터뷰 시작 전까지 가능해요. 예약 관리 링크를 보관해 주세요.</p>
      </section>
    );
  }

  if (loadFailed) {
    return (
      <section className="interview-apply-empty" role="alert">
        <TriangleAlert size={30} aria-hidden="true" />
        <h2>예약 일정을 불러오지 못했어요.</h2>
        <p>일시적인 오류로 보입니다. 잠시 뒤 다시 시도해 주세요.<br />같은 화면이 계속 보이면 운영진에게 알려주시면 바로 확인할게요.</p>
        <Link href="/interview" className="button button--primary">인터뷰 안내로 돌아가기</Link>
      </section>
    );
  }

  if (slots.length === 0) {
    return (
      <section className="interview-apply-empty">
        <CalendarCheck2 size={30} aria-hidden="true" />
        <h2>예약 가능한 일정을 준비하고 있어요.</h2>
        <p>새로운 인터뷰 일정이 열리면 이 페이지에서 날짜와 시간을 선택할 수 있습니다.</p>
        <Link href="/interview" className="button button--primary">인터뷰 안내로 돌아가기</Link>
      </section>
    );
  }

  return (
    <form action={formAction} className="interview-apply-form">
      <InterviewSchedulePicker slots={slots} disabled={pending} />

      <fieldset className="interview-apply-fieldset interview-contact-fields">
        <legend><span>03</span> 예약자 정보</legend>
        <p>예약 확인과 일정 안내에만 사용합니다.</p>
        <label>
          이름
          <input
            name="name"
            autoComplete="name"
            minLength={2}
            maxLength={30}
            required
            placeholder="이름을 입력해 주세요"
          />
        </label>
        <label>
          전화번호
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            inputMode="tel"
            required
            placeholder="010-0000-0000"
          />
        </label>
      </fieldset>

      <label className="interview-privacy-consent">
        <input type="checkbox" name="privacyConsent" required />
        <span>입력한 이름과 전화번호를 인터뷰 예약 확인 및 카카오톡 안내에 사용하는 것에 동의합니다.</span>
      </label>

      {state.message && state.status === "error" && (
        <p role="alert" className="interview-apply-status">{state.message}</p>
      )}

      <button type="submit" className="button button--primary interview-apply-submit" disabled={pending || !slots.some((slot) => slot.available)}>
        {pending ? "예약 중..." : "이 일정으로 예약하기"}
      </button>
    </form>
  );
}
