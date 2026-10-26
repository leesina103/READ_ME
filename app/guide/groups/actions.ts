"use server";
import { revalidatePath } from "next/cache";
import { guideSession } from "@/lib/guide/access";
import type { GuideActionState } from "@/app/admin/roles/actions";
export async function saveGuideGroup(_state: GuideActionState, form: FormData): Promise<GuideActionState> {
  const { supabase } = await guideSession();
  const id = String(form.get("group"));
  let details: unknown, before: unknown;
  try { details = JSON.parse(String(form.get("details"))); before = JSON.parse(String(form.get("before"))); }
  catch { return { message: "입력값을 확인해 주세요." }; }
  const { error } = await supabase.rpc("guide_save_group", { p_group: id, p_details: details, p_before: before });
  if (error) return { message: ({ stale_group: "다른 사람이 모임을 수정했습니다. 새로고침 후 다시 확인해 주세요.", cohort_ended: "종료된 기수는 수정할 수 없습니다.", invalid_schedule: "지난 일정은 변경할 수 없습니다. 기수 기간 안에서 회차 순서대로 미래 일정을 입력해 주세요.", guide_required: "현재 담당하는 모임만 수정할 수 있습니다.", invalid_details: "이름·소개·장소와 소요 시간(30~480분)을 확인해 주세요." } as Record<string, string>)[error.message] ?? "저장하지 못했습니다. 입력과 권한을 확인해 주세요." };
  revalidatePath(`/guide/groups/${id}`); revalidatePath("/guide"); revalidatePath("/admin/cohorts"); revalidatePath("/my"); revalidatePath("/membership", "layout");
  return { message: "저장했습니다. 일정·장소가 바뀌었다면 참여자에게 직접 안내해 주세요.", success: true };
}
