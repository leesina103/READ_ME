"use server";

import { revalidatePath } from "next/cache";
import {
  sendInterviewConfirmation,
  type InterviewNotificationStatus
} from "@/lib/interview/confirmation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type InterviewApplicationState = {
  status: "idle" | "error" | "success";
  message: string;
  startsAt?: string;
  notificationStatus?: InterviewNotificationStatus;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitInterviewApplicationAction(
  _previousState: InterviewApplicationState,
  formData: FormData
): Promise<InterviewApplicationState> {
  const slotId = Number(textValue(formData, "slotId"));
  const name = textValue(formData, "name");
  const phone = textValue(formData, "phone").replace(/[^0-9]/g, "");
  const privacyConsent = formData.get("privacyConsent") === "on";

  if (!Number.isInteger(slotId) || slotId < 1) {
    return { status: "error", message: "인터뷰 날짜와 시간을 선택해 주세요." };
  }

  if (name.length < 2 || name.length > 30) {
    return { status: "error", message: "이름은 2자 이상 30자 이하로 입력해 주세요." };
  }

  if (!/^01(0|1|6|7|8|9)[0-9]{7,8}$/.test(phone)) {
    return { status: "error", message: "안내받을 전화번호를 확인해 주세요." };
  }

  if (!privacyConsent) {
    return { status: "error", message: "인터뷰 신청을 위한 개인정보 수집에 동의해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "예약 저장소 연결이 필요합니다." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("submit_interview_application", {
    p_slot_id: slotId,
    p_name: name,
    p_phone: phone
  });

  if (error) {
    if (error.message.includes("slot_unavailable")) {
      return { status: "error", message: "방금 선택한 시간이 마감되었습니다. 다른 시간을 선택해 주세요." };
    }

    if (error.message.includes("already_applied")) {
      return { status: "error", message: "이미 신청한 전화번호입니다. 일정 변경은 카카오톡 채널로 문의해 주세요." };
    }

    return { status: "error", message: "신청을 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  const booking = Array.isArray(data) ? data[0] : null;
  const startsAt = typeof booking?.starts_at === "string" ? booking.starts_at : "";

  if (!startsAt) {
    return { status: "error", message: "예약 시간을 확인하지 못했습니다. 운영진에게 문의해 주세요." };
  }

  const notificationStatus = await sendInterviewConfirmation({ name, phone, startsAt });
  revalidatePath("/interview/apply");

  return {
    status: "success",
    message: "인터뷰 신청이 완료되었습니다.",
    startsAt,
    notificationStatus
  };
}
