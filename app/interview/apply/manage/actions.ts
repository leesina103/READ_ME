"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { bookingManagementPath, bookingTokenPattern } from "@/lib/interview/booking";
import { sendInterviewUpdate, type InterviewNotificationStatus } from "@/lib/interview/confirmation";
import { sendInterviewAdminNotification } from "@/lib/interview/admin-notification";

export type ManageBookingState = {
  status: "idle" | "error" | "success";
  message: string;
  cancelled?: boolean;
  notificationStatus?: InterviewNotificationStatus;
};

export async function manageInterviewAction(token: string, _previous: ManageBookingState, form: FormData): Promise<ManageBookingState> {
  const action = form.get("operation");
  const slotId = Number(form.get("slotId"));
  if (!bookingTokenPattern.test(token) || (action !== "cancel" && action !== "reschedule")) {
    return { status: "error", message: "예약 관리 링크를 다시 확인해 주세요." };
  }
  if (action === "cancel" && form.get("confirmCancellation") !== "on") {
    return { status: "error", message: "취소 확인란에 체크해 주세요." };
  }
  if (action === "reschedule" && (!Number.isSafeInteger(slotId) || slotId <= 0)) {
    return { status: "error", message: "변경할 날짜와 시간을 선택해 주세요." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("manage_interview_booking", {
    p_token: token, p_action: action, p_slot_id: action === "reschedule" ? slotId : null
  });
  if (error) {
    revalidatePath(bookingManagementPath(token));
    const messages: Record<string, string> = {
      slot_unavailable: "선택한 시간이 마감됐어요. 기존 예약은 유지됩니다. 다른 시간을 선택해 주세요.",
      booking_started: "인터뷰 시작 시간이 지나 직접 변경·취소할 수 없어요. 인스타그램 DM으로 문의해 주세요.",
      booking_cancelled: "이미 취소된 예약이에요.",
      booking_not_found: "예약을 찾을 수 없어요. 전달받은 링크를 확인해 주세요.",
      same_slot: "현재 예약과 다른 시간을 선택해 주세요."
    };
    return { status: "error", message: Object.entries(messages).find(([key]) => error.message.includes(key))?.[1] ?? "예약을 처리하지 못했어요. 잠시 후 다시 시도해 주세요." };
  }
  const booking = data?.[0];
  if (!booking) return { status: "error", message: "예약 상태를 확인하지 못했어요. 페이지를 새로고침해 주세요." };
  const event = action === "cancel" ? "cancelled" : "rescheduled";
  const [notificationStatus] = await Promise.all([sendInterviewUpdate({
    name: booking.name, phone: booking.phone, startsAt: booking.starts_at,
    applicationId: booking.application_id, managementToken: token, updatedAt: booking.updated_at,
    event
  }), sendInterviewAdminNotification({
    applicationId: booking.application_id,
    startsAt: booking.starts_at,
    updatedAt: booking.updated_at,
    event
  })]);
  revalidatePath("/interview/apply");
  revalidatePath(bookingManagementPath(token));
  revalidatePath("/admin/interviews");
  return { status: "success", message: action === "cancel" ? "인터뷰 예약을 취소했어요." : "인터뷰 일정을 변경했어요.", cancelled: action === "cancel", notificationStatus };
}
