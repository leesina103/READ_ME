"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ApplicationReviewState = {
  status: "idle" | "error" | "success";
  message: string;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function reviewMembershipApplicationAction(
  _previousState: ApplicationReviewState,
  formData: FormData
): Promise<ApplicationReviewState> {
  const applicationId = Number(textValue(formData, "applicationId"));
  const decision = textValue(formData, "decision");
  const adminNote = textValue(formData, "adminNote");

  if (!Number.isInteger(applicationId) || applicationId < 1 || !["approved", "rejected"].includes(decision)) {
    return { status: "error", message: "잘못된 검토 요청입니다." };
  }

  if (adminNote.length > 1000) {
    return { status: "error", message: "관리자 메모는 1000자 이하로 작성해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return { status: "error", message: "관리자 권한이 필요합니다." };
  }

  const { error } = await supabase.rpc("review_membership_application", {
    p_application_id: applicationId,
    p_decision: decision,
    p_admin_note: adminNote
  });

  if (error) {
    const message = error.message.includes("invitation_already_claimed")
      ? "이미 회원가입에 사용된 이메일입니다."
      : error.message.includes("application_already_reviewed")
        ? "이미 검토가 끝난 신청입니다."
        : "신청 상태를 변경하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
    return { status: "error", message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  return {
    status: "success",
    message: decision === "approved" ? "승인하고 가입 허용 명단에 등록했습니다." : "신청을 거절 처리했습니다."
  };
}

export async function archiveMembershipApplicationAction(
  _previousState: ApplicationReviewState,
  formData: FormData
): Promise<ApplicationReviewState> {
  const applicationId = Number(textValue(formData, "applicationId"));

  if (!Number.isInteger(applicationId) || applicationId < 1) {
    return { status: "error", message: "잘못된 요청입니다." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return { status: "error", message: "관리자 권한이 필요합니다." };
  }

  const { error } = await supabase.rpc("archive_membership_application", {
    p_application_id: applicationId
  });

  if (error) {
    const message = error.message.includes("application_not_reviewed")
      ? "검토를 마친 신청만 닫을 수 있습니다."
      : "신청을 닫지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
    return { status: "error", message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  return { status: "success", message: "신청을 보관했습니다." };
}
