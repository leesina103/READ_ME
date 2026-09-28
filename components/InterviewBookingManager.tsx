"use client";

import { useActionState } from "react";
import { manageInterviewAction, type ManageBookingState } from "@/app/interview/apply/manage/actions";
import { InterviewSchedulePicker } from "@/components/InterviewSchedulePicker";
import type { InterviewSlot } from "@/lib/interview/slots";

const initialState: ManageBookingState = { status: "idle", message: "" };

export function InterviewBookingManager({ token, slots, loadFailed }: { token: string; slots: InterviewSlot[]; loadFailed: boolean }) {
  const [state, action, pending] = useActionState(manageInterviewAction.bind(null, token), initialState);
  return (
    <form action={action} className="interview-apply-form">
      <section className="interview-booking-change" aria-labelledby="change-booking-title">
        <h2 id="change-booking-title">일정 변경</h2>
        <p>새 일정으로 변경을 마칠 때까지 기존 예약은 유지돼요.</p>
        {loadFailed ? <p role="alert">가능한 일정을 불러오지 못했어요. 새로고침 후 다시 확인해 주세요.</p> : slots.some((slot) => slot.available) ? (
          <InterviewSchedulePicker slots={slots} disabled={pending} />
        ) : <p>현재 변경 가능한 시간이 없어요. 일정 조정이 필요하면 카카오톡으로 문의해 주세요.</p>}
        <button className="button button--primary" type="submit" name="operation" value="reschedule" disabled={pending || loadFailed || !slots.some((slot) => slot.available)}>선택한 일정으로 변경</button>
      </section>
      <fieldset className="interview-apply-fieldset" disabled={pending}>
        <legend>예약 취소</legend>
        <p>취소하면 이 시간은 다른 사람이 예약할 수 있어요. 다시 참여하려면 새로 예약해 주세요.</p>
        <label className="interview-privacy-consent"><input type="checkbox" name="confirmCancellation" /><span>인터뷰 예약을 취소할게요.</span></label>
        <button className="button button--ghost" type="submit" name="operation" value="cancel" disabled={pending}>예약 취소하기</button>
      </fieldset>
      {pending && <p role="status">예약을 처리하고 있어요.</p>}
      {state.message && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
      {state.status === "success" && state.notificationStatus !== "sent" && <p>카카오톡 안내와 관계없이 예약 변경은 반영됐어요. 위의 현재 일정을 확인해 주세요.</p>}
    </form>
  );
}
