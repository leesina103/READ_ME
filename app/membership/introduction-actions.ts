"use server";

import { revalidatePath } from "next/cache";
import type { FormActionState } from "@/app/auth/actions";
import { cohortNameFromNumber } from "@/data/seasonWeeks";
import { introductionFields, type IntroductionField } from "@/lib/membership/introduction";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type IntroductionFormState = FormActionState & { field?: IntroductionField };

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function saveMemberIntroductionAction(_previousState: IntroductionFormState, formData: FormData): Promise<IntroductionFormState> {
  const values = { introductionWord: textValue(formData, "introductionWord"), bio: textValue(formData, "bio"), cohortMessage: textValue(formData, "cohortMessage") };
  for (const name of Object.keys(introductionFields) as IntroductionField[]) {
    const field = introductionFields[name];
    if (values[name].length < field.min || values[name].length > field.max) {
      return { status: "error", field: name, message: `${field.min}자 이상 ${field.max}자 이하로 입력해 주세요.` };
    }
  }
  if (/\s/u.test(values.introductionWord)) return { status: "error", field: "introductionWord", message: "띄어쓰기 없이 한 단어로 적어주세요." };

  const cohortParam = textValue(formData, "cohort");
  const cohort = cohortParam ? Number(cohortParam) : null;
  if (cohort !== null && (!Number.isInteger(cohort) || cohort < 1 || cohort > 99)) return { status: "error", message: "기수를 확인해 주세요." };
  if (!isSupabaseConfigured()) return { status: "error", message: "소개를 저장할 준비가 되지 않았습니다. 잠시 뒤 다시 시도해 주세요." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { error } = await supabase.rpc("save_member_introduction", {
    p_word: values.introductionWord,
    p_bio: values.bio,
    p_cohort_message: values.cohortMessage,
    p_cohort: cohort === null ? null : cohortNameFromNumber(cohort)
  });
  if (error) {
    if (error.message.includes("cohort_read_only")) return { status: "error", message: "지난 기수와 종료된 기수에서는 읽기만 가능해요. 소개 수정은 나의 서재에서 해주세요." };
    if (error.message.includes("membership_required")) return { status: "error", message: "기수 참여가 확인된 회원만 소개를 작성할 수 있어요." };
    return { status: "error", message: "소개를 저장하지 못했습니다. 작성한 내용은 그대로 있으니 잠시 뒤 다시 시도해 주세요." };
  }

  revalidatePath("/my");
  revalidatePath("/membership/members");
  revalidatePath("/membership/talk", "layout");
  return { status: "success", message: "소개를 저장했어요. 나의 서재와 멤버 소개에도 함께 반영됩니다." };
}
