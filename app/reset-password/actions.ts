"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resetLinkExpiredMessage } from "@/lib/auth/reset-password";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ResetField = "email" | "password" | "passwordConfirmation";
export type ResetFormState = { status: "idle" | "error" | "success"; message: string; field?: ResetField };

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field.trim() : "";
}

function fieldError(field: ResetField, message: string): ResetFormState {
  return { status: "error", field, message };
}

export async function requestPasswordResetAction(
  _previousState: ResetFormState,
  formData: FormData
): Promise<ResetFormState> {
  const email = value(formData, "email");

  if (!email) return fieldError("email", "이메일을 입력해 주세요.");
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl("/reset-password/new") });

  if (error) {
    if (error.code === "over_email_send_rate_limit") {
      return { status: "error", message: "재설정 메일 요청이 많습니다. 잠시 뒤 다시 시도해 주세요." };
    }
    return { status: "error", message: "재설정 메일을 보내지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  return { status: "success", message: "입력한 이메일로 재설정 링크를 보냈습니다. 메일함을 확인해 주세요." };
}

export async function setNewPasswordAction(
  _previousState: ResetFormState,
  formData: FormData
): Promise<ResetFormState> {
  const password = value(formData, "password");
  const passwordConfirmation = value(formData, "passwordConfirmation");

  if (password.length < 8) return fieldError("password", "새 비밀번호는 8자 이상 입력해 주세요.");
  if (password !== passwordConfirmation) return fieldError("passwordConfirmation", "새 비밀번호 확인이 일치하지 않습니다.");
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: "error", message: resetLinkExpiredMessage };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "weak_password") return fieldError("password", "조금 더 안전한 비밀번호를 사용해 주세요.");
    if (error.code === "same_password") return fieldError("password", "이전과 다른 비밀번호를 사용해 주세요.");
    return { status: "error", message: "비밀번호를 저장하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  revalidatePath("/", "layout");
  redirect("/my");
}
