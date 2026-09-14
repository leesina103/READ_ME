"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PasswordField = "currentPassword" | "newPassword" | "passwordConfirmation";
export type PasswordChangeState = { status: "idle" | "error" | "success"; message: string; field?: PasswordField };

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

function fieldError(field: PasswordField, message: string): PasswordChangeState {
  return { status: "error", field, message };
}

export async function changePasswordAction(
  _previousState: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  const passwordConfirmation = value(formData, "passwordConfirmation");

  if (!currentPassword) return fieldError("currentPassword", "현재 비밀번호를 입력해 주세요.");
  if (newPassword.length < 8) return fieldError("newPassword", "새 비밀번호는 8자 이상 입력해 주세요.");
  if (newPassword !== passwordConfirmation) return fieldError("passwordConfirmation", "새 비밀번호 확인이 일치하지 않습니다.");
  if (currentPassword === newPassword) return fieldError("newPassword", "현재 비밀번호와 다른 비밀번호를 사용해 주세요.");
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { error: reauthenticationError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (reauthenticationError) return fieldError("currentPassword", "현재 비밀번호가 올바르지 않습니다.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    if (error.code === "weak_password") return fieldError("newPassword", "조금 더 안전한 비밀번호를 사용해 주세요.");
    return { status: "error", message: "비밀번호를 변경하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };
  }

  return { status: "success", message: "비밀번호를 변경했습니다." };
}
