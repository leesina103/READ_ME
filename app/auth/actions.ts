"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cohortNumberFromName, findSeasonWeek } from "@/data/seasonWeeks";

export type FormActionState = {
  status: "idle" | "error" | "success";
  message: string;
};

function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function safeNextPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/my";
}

function authErrorMessage(code?: string) {
  switch (code) {
    case "invalid_credentials":
      return "이메일 또는 비밀번호를 확인해 주세요.";
    case "email_not_confirmed":
      return "이메일 인증을 완료한 뒤 로그인해 주세요.";
    case "user_already_exists":
    case "email_exists":
      return "이미 가입된 이메일입니다.";
    case "weak_password":
      return "조금 더 안전한 비밀번호를 사용해 주세요.";
    case "over_email_send_rate_limit":
      return "인증 메일 요청이 많습니다. 잠시 뒤 다시 시도해 주세요.";
    default:
      return "요청을 처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
  }
}

const nicknameLockedMessage = "기수가 시작되어 닉네임을 변경할 수 없습니다.";

export async function loginAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const loginId = textValue(formData, "email");
  const password = textValue(formData, "password");
  const next = safeNextPath(textValue(formData, "next"));

  if (!loginId || !password) {
    return { status: "error", message: "이메일과 비밀번호를 모두 입력해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const isAdminAlias = loginId.toLowerCase() === "admin";
  const email = isAdminAlias
    ? process.env.ADMIN_LOGIN_EMAIL?.trim()
    : loginId;

  if (!email) {
    return { status: "error", message: "관리자 로그인 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { status: "error", message: authErrorMessage(error.code) };

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", data.user.id)
    .maybeSingle();

  revalidatePath("/", "layout");
  if (isAdminAlias) redirect("/admin");
  redirect(profile?.onboarding_completed_at ? next : "/onboarding");
}

export async function signupAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const displayName = textValue(formData, "displayName");
  const email = textValue(formData, "email");
  const password = textValue(formData, "password");

  if (displayName.length < 2 || displayName.length > 30) {
    return { status: "error", message: "이름은 2자 이상 30자 이하로 입력해 주세요." };
  }

  if (!email || password.length < 8) {
    return { status: "error", message: "이메일과 8자 이상의 비밀번호를 입력해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data: isInvited, error: invitationError } = await supabase.rpc("is_member_invited", {
    p_email: email,
    p_name: displayName
  });

  if (invitationError) {
    return { status: "error", message: "가입 허용 명단을 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  if (!isInvited) {
    return { status: "error", message: "인터뷰 합격 승인 후에 회원가입 가능합니다." };
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`
    }
  });

  if (error) {
    const message = error.code === "unexpected_failure"
      ? "인터뷰 합격 승인 후에 회원가입 가능합니다."
      : authErrorMessage(error.code);
    return { status: "error", message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    status: "success",
    message: "가입 확인 메일을 보냈습니다. 이메일 인증 후 로그인해 주세요."
  };
}

export async function completeOnboardingAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const displayName = textValue(formData, "displayName");
  const bio = textValue(formData, "bio");
  const cohortMessage = textValue(formData, "cohortMessage");

  if (displayName.length < 2 || displayName.length > 30) {
    return { status: "error", message: "닉네임은 2자 이상 30자 이하로 입력해 주세요." };
  }

  if (bio.length < 2 || bio.length > 200) {
    return { status: "error", message: "자기소개는 2자 이상 200자 이하로 입력해 주세요." };
  }

  if (cohortMessage.length < 2 || cohortMessage.length > 300) {
    return { status: "error", message: "동료들에게 전할 말은 2자 이상 300자 이하로 입력해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_member_onboarding", {
    p_display_name: displayName,
    p_bio: bio,
    p_cohort_message: cohortMessage
  });

  if (error) {
    return { status: "error", message: "회원 정보를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  revalidatePath("/my");
  redirect("/my");
}

function withJosa(word: string, batchimForm: string, openForm: string) {
  const lastChar = word.charCodeAt(word.length - 1);
  const hasBatchim = lastChar >= 0xac00 && lastChar <= 0xd7a3 && (lastChar - 0xac00) % 28 > 0;
  return `${word}${hasBatchim ? batchimForm : openForm}`;
}

const profileFields = {
  displayName: { column: "display_name", label: "닉네임", min: 2, max: 30 },
  bio: { column: "bio", label: "자기소개", min: 2, max: 200 },
  cohortMessage: { column: "cohort_message", label: "동료들에게 전할 말", min: 2, max: 300 }
} as const;

export type ProfileFieldName = keyof typeof profileFields;

export async function updateProfileFieldAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const fieldName = textValue(formData, "field") as ProfileFieldName;
  const field = profileFields[fieldName];

  if (!field) return { status: "error", message: "알 수 없는 항목입니다." };

  const value = textValue(formData, "value");

  if (value.length < field.min || value.length > field.max) {
    return { status: "error", message: `${withJosa(field.label, "은", "는")} ${field.min}자 이상 ${field.max}자 이하로 입력해 주세요.` };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  if (fieldName === "displayName") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, cohort")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return { status: "error", message: "회원 정보를 찾지 못했습니다." };

    if (value !== profile.display_name && profile.cohort) {
      const { data: cohort } = await supabase
        .from("cohorts")
        .select("starts_at")
        .eq("name", profile.cohort)
        .maybeSingle();

      if (cohort?.starts_at && new Date(cohort.starts_at).getTime() <= Date.now()) {
        return { status: "error", message: nicknameLockedMessage };
      }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ [field.column]: value, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    if (error.message.includes("nickname_locked")) {
      return { status: "error", message: nicknameLockedMessage };
    }
    return { status: "error", message: `${withJosa(field.label, "을", "를")} 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.` };
  }

  revalidatePath("/my");
  if (fieldName === "displayName") {
    revalidatePath("/membership/community");
    revalidatePath("/membership/talk", "layout");
  }
  return { status: "success", message: `${withJosa(field.label, "을", "를")} 저장했습니다.` };
}

export async function saveSessionAnswerAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const cohortNumber = Number(textValue(formData, "cohort"));
  const week = Number(textValue(formData, "week"));
  const content = textValue(formData, "content");

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || !findSeasonWeek(week)) {
    return { status: "error", message: "잘못된 요청입니다." };
  }

  if (content.length < 2 || content.length > 2000) {
    return { status: "error", message: "답변은 2자 이상 2000자 이하로 작성해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("cohort")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.cohort || cohortNumberFromName(profile.cohort) !== cohortNumber) {
    return { status: "error", message: "참여 중인 기수의 토크방에만 답변을 남길 수 있어요." };
  }
  const { error } = await supabase.rpc("save_session_answer", {
    target_week: week,
    target_content: content
  });

  if (error) {
    return { status: "error", message: "답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath(`/membership/talk/${cohortNumber}/${week}`);
  return { status: "success", message: "답변을 남겼습니다." };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
