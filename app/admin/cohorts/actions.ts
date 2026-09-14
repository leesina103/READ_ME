"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CohortScheduleState = {
  status: "idle" | "error" | "success";
  message: string;
};

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/;
const cohortNamePattern = /^\d+기$/;

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

// 날짜만 입력받아 한국 시간 기준으로 시작일은 그날 0시, 종료일은 그날 자정 직전으로 저장한다.
function seoulDayStart(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`);
}

function seoulDayEnd(dateKey: string) {
  return new Date(`${dateKey}T23:59:59.999+09:00`);
}

export async function saveCohortScheduleAction(
  _previousState: CohortScheduleState,
  formData: FormData
): Promise<CohortScheduleState> {
  const name = textValue(formData, "name").replace(/\s+/g, "");
  const startDate = textValue(formData, "startDate");
  const endDate = textValue(formData, "endDate");
  const applicationOpen = formData.get("applicationOpen") === "on";

  if (!cohortNamePattern.test(name)) {
    return { status: "error", message: "기수 이름은 2기처럼 숫자와 '기'로 입력해 주세요." };
  }

  if (!dateKeyPattern.test(startDate)) {
    return { status: "error", message: "시작일을 선택해 주세요." };
  }

  if (endDate && !dateKeyPattern.test(endDate)) {
    return { status: "error", message: "종료일 형식을 확인해 주세요." };
  }

  const startsAt = seoulDayStart(startDate);
  const endsAt = endDate ? seoulDayEnd(endDate) : null;

  if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime()))) {
    return { status: "error", message: "날짜를 다시 확인해 주세요." };
  }

  if (endsAt && endsAt.getTime() < startsAt.getTime()) {
    return { status: "error", message: "종료일은 시작일보다 빠를 수 없어요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.app_metadata?.role !== "admin") {
    return { status: "error", message: "관리자 권한이 필요합니다." };
  }

  const { error } = await supabase.rpc("admin_save_cohort", {
    p_name: name,
    p_starts_at: startsAt.toISOString(),
    p_ends_at: endsAt ? endsAt.toISOString() : null,
    p_application_open: applicationOpen
  });

  if (error) {
    const message = error.message.includes("invalid_cohort_name")
      ? "기수 이름은 2기처럼 숫자와 '기'로 입력해 주세요."
      : error.message.includes("invalid_cohort_schedule")
        ? "종료일은 시작일보다 빠를 수 없어요."
        : "기수 일정을 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
    return { status: "error", message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/cohorts");
  return { status: "success", message: `${name} 일정을 저장했습니다.` };
}
