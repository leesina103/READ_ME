"use server";

import { currentMeeting } from "@/data/currentMeeting";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type MembershipApplicationState = {
  status: "idle" | "error" | "success";
  message: string;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitMembershipApplicationAction(
  _previousState: MembershipApplicationState,
  formData: FormData
): Promise<MembershipApplicationState> {
  const name = textValue(formData, "name");
  const email = textValue(formData, "email");
  const cohort = textValue(formData, "cohort");
  const message = textValue(formData, "message");
  const privacyConsent = formData.get("privacyConsent") === "on";

  if (name.length < 2 || name.length > 30) {
    return { status: "error", message: "이름은 2자 이상 30자 이하로 입력해 주세요." };
  }

  if (!email || email.length > 320) {
    return { status: "error", message: "연락받을 이메일을 확인해 주세요." };
  }

  if (cohort !== currentMeeting.cohort) {
    return { status: "error", message: "지금 모집 중인 기수의 신청서가 아닙니다." };
  }

  if (!currentMeeting.recruiting) {
    return { status: "error", message: "지금은 모집 기간이 아닙니다." };
  }

  if (message.length > 1000) {
    return { status: "error", message: "남기는 말은 1000자 이하로 작성해 주세요." };
  }

  if (!privacyConsent) {
    return { status: "error", message: "신청 검토를 위한 개인정보 수집에 동의해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_membership_application", {
    p_name: name,
    p_email: email,
    p_cohort: cohort,
    p_message: message
  });

  if (error) {
    return { status: "error", message: "신청서를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  return {
    status: "success",
    message: "가입 신청을 받았습니다. 검토가 끝나면 입력한 이메일로 다음 단계를 안내드릴게요."
  };
}
