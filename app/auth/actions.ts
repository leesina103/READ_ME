"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cohortNumberFromName, findSeasonWeek } from "@/data/seasonWeeks";
import { authCallbackUrl } from "@/lib/auth/site-url";

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

const nicknameLockedMessage = "기수가 시작되어 닉네임을 바꿀 수 없어요.";

export type AuthField = "displayName" | "email" | "password";
export type AuthFormState = FormActionState & {
  field?: AuthField;
  canResendConfirmation?: boolean;
  values?: { displayName?: string; email?: string };
};

const invitationRequiredMessage = "가입 신청서에 적은 이름과 이메일이 일치해야 가입할 수 있어요. 승인 안내를 받지 못했다면 운영진에게 문의해 주세요.";

function authFieldError(field: AuthField, message: string, extra: Omit<AuthFormState, "status" | "message" | "field"> = {}): AuthFormState {
  return { status: "error", field, message, ...extra };
}

export async function loginAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const loginId = textValue(formData, "email");
  const password = textValue(formData, "password");
  const next = safeNextPath(textValue(formData, "next"));
  const values = { email: loginId };

  if (!loginId) return authFieldError("email", "이메일을 입력해 주세요.");
  if (!password) return authFieldError("password", "비밀번호를 입력해 주세요.", { values });

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다.", values };
  }

  const isAdminAlias = loginId.toLowerCase() === "admin";
  const email = isAdminAlias
    ? process.env.ADMIN_LOGIN_EMAIL?.trim()
    : loginId;

  if (!email) {
    return { status: "error", message: "관리자 로그인 설정이 필요합니다.", values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = authErrorMessage(error.code);
    return error.code === "email_not_confirmed"
      ? authFieldError("email", message, { canResendConfirmation: true, values })
      : { status: "error", message, values };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", data.user.id)
    .maybeSingle();

  revalidatePath("/", "layout");
  if (isAdminAlias) redirect("/admin");
  redirect(profile?.onboarding_completed_at ? next : "/onboarding");
}

export async function resendConfirmationAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = textValue(formData, "email");
  const values = { email };

  if (!email) return { status: "error", message: "이메일을 입력해 주세요." };
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다.", values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: authCallbackUrl("/onboarding") }
  });

  if (error) {
    const message = error.code === "over_email_send_rate_limit"
      ? "인증 메일 요청이 많습니다. 잠시 뒤 다시 시도해 주세요."
      : "인증 메일을 다시 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요.";
    return { status: "error", message, values };
  }

  return { status: "success", message: "인증 메일을 다시 보냈습니다. 메일함을 확인해 주세요.", values };
}

export async function signupAction(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const displayName = textValue(formData, "displayName");
  const email = textValue(formData, "email");
  const password = textValue(formData, "password");
  const values = { displayName, email };

  if (displayName.length < 2 || displayName.length > 30) {
    return authFieldError("displayName", "이름은 2자 이상 30자 이하로 입력해 주세요.", { values });
  }

  if (!email) return authFieldError("email", "이메일을 입력해 주세요.", { values });
  if (password.length < 8) return authFieldError("password", "비밀번호는 8자 이상 입력해 주세요.", { values });

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다.", values };
  }

  const supabase = await createClient();
  const { data: isInvited, error: invitationError } = await supabase.rpc("is_member_invited", {
    p_email: email,
    p_name: displayName
  });

  if (invitationError) {
    return { status: "error", message: "가입 허용 명단을 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.", values };
  }

  if (!isInvited) {
    return { status: "error", message: invitationRequiredMessage, values };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: authCallbackUrl("/onboarding")
    }
  });

  if (error) {
    if (error.code === "unexpected_failure") {
      return { status: "error", message: invitationRequiredMessage, values };
    }
    const message = authErrorMessage(error.code);
    if (error.code === "user_already_exists" || error.code === "email_exists") return authFieldError("email", message, { values });
    if (error.code === "weak_password") return authFieldError("password", message, { values });
    return { status: "error", message, values };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    status: "success",
    message: "가입 확인 메일을 보냈습니다. 메일의 링크를 누르면 첫 회원 정보 작성으로 이어져요."
  };
}

export type OnboardingField = "displayName";
export type OnboardingFormState = FormActionState & { field?: OnboardingField };

export async function completeOnboardingAction(
  _previousState: OnboardingFormState,
  formData: FormData
): Promise<OnboardingFormState> {
  const displayName = textValue(formData, "displayName");

  if (displayName.length < 2 || displayName.length > 30) {
    return { status: "error", field: "displayName", message: "닉네임은 2자 이상 30자 이하로 입력해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_member_onboarding", {
    p_display_name: displayName
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
  cohortMessage: { column: "cohort_message", label: "동료들에게 하고 싶은 말", min: 2, max: 300 }
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
    return { status: "error", message: `${withJosa(field.label, "을", "를")} 저장하지 못했어요. 잠시 후 다시 시도해 주세요.` };
  }

  revalidatePath("/my");
  revalidatePath("/membership/members");
  revalidatePath("/membership/talk", "layout");
  if (fieldName === "displayName") {
    revalidatePath("/membership/community");
  }
  return { status: "success", message: `${withJosa(field.label, "을", "를")} 저장했어요.` };
}

export async function saveSessionAnswerAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const cohortNumber = Number(textValue(formData, "cohort"));
  const week = Number(textValue(formData, "week"));
  const content = textValue(formData, "content");

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || !findSeasonWeek(cohortNumber, week)) {
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

  const { data: hasActiveMembership, error: membershipError } = await supabase.rpc("has_active_membership");
  if (membershipError) return { status: "error", message: "멤버십 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  if (hasActiveMembership !== true) return { status: "error", message: "활성 멤버십이 있어야 답변을 저장할 수 있어요." };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("cohort")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { status: "error", message: "회원 정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  if (!profile?.cohort || cohortNumberFromName(profile.cohort) !== cohortNumber) {
    return { status: "error", message: "참여 중인 기수의 토크방에만 답변을 남길 수 있어요." };
  }
  const { error } = await supabase.rpc("save_session_answer", {
    target_week: week,
    target_content: content
  });

  if (error) {
    if (error.message.includes("cohort_ended")) {
      return { status: "error", message: "기수가 마무리되어 답변을 남길 수 없어요." };
    }
    if (error.message.includes("week_not_open")) {
      return { status: "error", message: "아직 열리지 않은 주차예요. 공개 날짜에 다시 찾아주세요." };
    }
    return { status: "error", message: "답변을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }

  revalidatePath(`/membership/talk/${cohortNumber}/${week}`);
  return { status: "success", message: "답변을 저장했습니다." };
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  revalidatePath("/", "layout");
  redirect("/");
}
