"use server";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/access";

export type GuideActionState = { message: string; success?: boolean; token?: string };
export async function manageGuide(_state: GuideActionState, form: FormData): Promise<GuideActionState> {
  const supabase = await requireAdmin("/admin/roles");
  if (!supabase) return { message: "데이터베이스 연결이 필요합니다." };
  const action = String(form.get("action") ?? "");
  if (action === "clear_audit") {
    const { error } = await supabase.rpc("admin_clear_guide_audit");
    if (error) return { message: "기록을 비우지 못했습니다. 다시 시도해 주세요." };
    revalidatePath("/admin/roles");
    return { message: "기록을 비웠습니다. 이후 변경 기록부터 표시됩니다.", success: true };
  }
  if (action === "reveal_invite") {
    const { data, error } = await supabase.rpc("admin_guide_invitation_link", { p_invitation: form.get("invitation") || null });
    if (error || !data) return { message: error?.message === "invitation_link_not_stored" ? "이전 방식으로 발급되어 링크를 복원할 수 없습니다. 새 초대를 발급해 주세요." : "만료되거나 사용·취소된 초대입니다. 목록을 새로고침해 주세요." };
    return { message: "아래 링크를 복사해 전달해 주세요.", success: true, token: data as string };
  }
  const token = action === "invite" ? randomBytes(32).toString("hex") : null;
  const { error } = await supabase.rpc("admin_manage_guide", {
    p_action: action, p_user: form.get("user") || null, p_invitation: form.get("invitation") || null,
    p_groups: form.getAll("groups"), p_token: token
  });
  if (error) {
    const messages: Record<string, string> = { talk_group_full: "모임 정원이 가득 찼습니다. 다른 모임을 선택하거나 배정을 정리해 주세요.", invitation_claim_conflict: "이메일에 연결된 회원 정보가 다릅니다. 회원 명단을 확인해 주세요.", group_required: "담당·참여 모임을 하나만 선택해 주세요.", group_already_assigned: "이미 다른 가이드에게 배정된 모임입니다. 기존 담당을 먼저 해제해 주세요.", onboarding_required: "이메일 인증과 닉네임 설정이 끝나야 승인할 수 있습니다.", group_unavailable: "종료되었거나 없는 모임은 새로 배정할 수 없습니다." };
    return { message: messages[error.message] ?? "저장하지 못했습니다. 새로고침하여 상태를 확인해 주세요." };
  }
  revalidatePath("/admin/roles"); revalidatePath("/admin/members"); revalidatePath("/guide", "layout"); revalidatePath("/my"); revalidatePath("/membership", "layout"); revalidatePath("/admin/cohorts");
  return { message: token ? "7일 동안 한 번 사용할 수 있는 링크입니다. 아래 목록에서 ‘링크 다시 보기’를 눌러 전달해 주세요." : "저장했습니다.", success: true };
}
