"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/access";

export async function deletePendingMemberAction(formData: FormData): Promise<{ error?: string }> {
  const id = Number(formData.get("invitationId"));
  const email = String(formData.get("email") ?? "").trim();
  const cohort = String(formData.get("cohort") ?? "").trim();
  if (!Number.isSafeInteger(id) || id < 1 || !email || !cohort) return { error: "삭제할 대상을 확인해 주세요." };
  const supabase = await requireAdmin("/admin/members");
  if (!supabase) return { error: "서비스 설정을 확인해 주세요." };
  const { error } = await supabase.rpc("admin_delete_pending_member", {
    p_invitation_id: id, p_email: email, p_cohort: cohort
  });
  if (error) {
    if (error.message.includes("member_already_joined")) return { error: "이미 가입한 회원은 삭제할 수 없습니다. 명단을 새로고침해 주세요." };
    if (error.message.includes("invitation_changed")) return { error: "대상 정보가 변경되었거나 이미 삭제되었습니다. 명단을 새로고침해 주세요." };
    return { error: "삭제하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }
  for (const path of ["/admin", "/admin/members", "/admin/applications", "/admin/cohorts", "/guide/groups"]) revalidatePath(path);
  revalidatePath("/membership/apply", "layout");
  return {};
}
