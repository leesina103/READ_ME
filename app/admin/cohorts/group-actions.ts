"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/access";
import { parseSeoulInput } from "@/lib/membership/talkDeadlines";
import type { TalkFormState } from "@/lib/membership/talkDeadlines";

function value(form: FormData, name: string) { return String(form.get(name) ?? "").trim(); }
const failure = (message: string): TalkFormState => ({ status: "error", message });

export async function manageTalkGroup(_previous: TalkFormState, form: FormData): Promise<TalkFormState> {
  const supabase = await requireAdmin("/admin/cohorts");
  if (!supabase) return failure("데이터베이스 연결을 확인해주세요.");
  const cohort = value(form, "cohort");
  const groupId = value(form, "groupId");
  const operation = value(form, "operation");
  // 운영자용 RPC로 기수 존재 여부와 종료 상태를 확인한다. 기존 cohorts RLS는 본인 기수만 허용한다.
  const { data: cohorts, error: listError } = await supabase.rpc("admin_list_cohorts");
  const selected = (cohorts as { name: string; starts_at: string; ends_at: string | null }[] | null)?.find((item) => item.name === cohort);
  if (listError || !selected || (selected.ends_at && Date.parse(selected.ends_at) <= Date.now())) return failure("진행 중이거나 시작 전인 기수에서만 그룹을 관리할 수 있어요.");
  let error: { message: string } | null = null;
  if (operation === "create") {
    const name = value(form, "name");
    if (!name || name.length > 40) return failure("그룹 이름은 1~40자로 입력해주세요.");
    ({ error } = await supabase.from("talk_groups").insert({ cohort, name }));
  } else if (operation === "rename" || operation === "delete") {
    if (!groupId) return failure("그룹 정보를 확인해주세요.");
    if (operation === "rename") {
      const name = value(form, "name");
      if (!name || name.length > 40) return failure("그룹 이름은 1~40자로 입력해주세요.");
      const result = await supabase.from("talk_groups").update({ name }).eq("id", groupId).eq("cohort", cohort).select("id").maybeSingle();
      error = result.error;
      if (!error && !result.data) return failure("그룹이 없거나 이미 삭제되었습니다.");
    } else {
      const { count, error: countError } = await supabase.from("talk_group_members").select("user_id", { count: "exact", head: true }).eq("group_id", groupId);
      if (countError) return failure("그룹 인원을 확인하지 못했어요. 다시 시도해주세요.");
      if (count) return failure("회원이 남아 있는 그룹은 삭제할 수 없어요. 다른 그룹으로 먼저 옮겨주세요.");
      const result = await supabase.from("talk_groups").delete().eq("id", groupId).eq("cohort", cohort).select("id").maybeSingle();
      error = result.error;
      if (error?.message.includes("talk_group_not_empty")) return failure("회원이 남아 있는 그룹은 삭제할 수 없어요. 다른 그룹으로 먼저 옮겨주세요.");
      if (!error && !result.data) return failure("그룹이 없거나 이미 삭제되었습니다.");
    }
  } else if (operation === "assign") {
    const userId = value(form, "userId");
    if (!userId) return failure("회원을 선택해주세요.");
    if (groupId) ({ error } = await supabase.from("talk_group_members").upsert({ user_id: userId, cohort, group_id: groupId }));
    else ({ error } = await supabase.from("talk_group_members").delete().eq("user_id", userId).eq("cohort", cohort));
  } else if (operation === "schedule") {
    const { data: group } = await supabase.from("talk_groups").select("id").eq("id", groupId).eq("cohort", cohort).maybeSingle();
    if (!group) return failure("그룹 정보를 확인해주세요.");
    const meetings = [1, 3, 5, 7].map((week) => ({ group_id: groupId, week_number: week, starts_at: parseSeoulInput(value(form, `week${week}`)) }));
    if (meetings.some((item) => !item.starts_at)) return failure("네 번의 모임 날짜와 시각을 모두 입력해주세요.");
    if (meetings.some((item) => Date.parse(item.starts_at!) < Date.parse(selected.starts_at))) return failure("모임 날짜는 기수 시작일 이후로 정해주세요.");
    const { data: savedMeetings, error: scheduleError } = await supabase.from("talk_meetings").select("week_number, starts_at").eq("group_id", groupId);
    if (scheduleError) return failure("기존 모임 일정을 확인하지 못했어요. 다시 시도해주세요.");
    const now = Date.now();
    // 지난 모임을 그대로 두고 다음 모임만 조정하는 것은 허용한다.
    if (meetings.some((item) => Date.parse(item.starts_at!) <= now && !savedMeetings?.some((saved) => saved.week_number === item.week_number && Date.parse(saved.starts_at) === Date.parse(item.starts_at!)))) return failure("새로 입력하거나 변경하는 모임 시각은 현재 시각 이후로 정해주세요.");
    if (meetings.some((item, index) => index > 0 && Date.parse(item.starts_at!) <= Date.parse(meetings[index - 1].starts_at!))) return failure("모임은 주차 순서대로 뒤의 날짜를 선택해주세요.");
    if (selected.ends_at && meetings.some((item) => Date.parse(item.starts_at!) > Date.parse(selected.ends_at!))) return failure("모임 날짜는 기수 종료일 안으로 정해주세요.");
    ({ error } = await supabase.from("talk_meetings").upsert(meetings));
  } else return failure("요청을 확인해주세요.");
  if (error) return failure(error.message.includes("talk_group_full") ? "한 그룹에는 최대 6명까지 배정할 수 있어요." : error.message.includes("duplicate") ? "같은 이름의 그룹이 이미 있어요." : "저장하지 못했어요. 기수와 회원 정보를 확인해주세요.");
  revalidatePath("/admin/cohorts");
  revalidatePath("/membership", "layout");
  return { status: "success", message: operation === "delete" ? "그룹과 모임 일정을 삭제했습니다." : "저장했습니다." };
}
