"use server";

import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { bookingManagementPath, bookingTokenPattern } from "@/lib/interview/booking";

export async function getInterviewManagementLink(applicationId: string): Promise<{ path?: string; error?: string }> {
  const supabase = await requireAdmin("/admin/interviews");
  if (!supabase) return { error: supabaseNotConfiguredMessage };
  if (!bookingTokenPattern.test(applicationId)) return { error: "예약 정보를 확인해 주세요." };
  const { data, error } = await supabase.rpc("admin_interview_management_token", { p_application_id: applicationId });
  if (error || typeof data !== "string" || !bookingTokenPattern.test(data)) {
    return { error: "관리 링크를 불러오지 못했어요. 새로고침 후 다시 시도해 주세요." };
  }
  return { path: bookingManagementPath(data) };
}
