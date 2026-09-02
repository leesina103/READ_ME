"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type PasswordChangeState = { status: "idle" | "error" | "success"; message: string };

function value(formData: FormData, key: string) {
  const field = formData.get(key);
  return typeof field === "string" ? field : "";
}

export async function changePasswordAction(
  _previousState: PasswordChangeState,
  formData: FormData
): Promise<PasswordChangeState> {
  const currentPassword = value(formData, "currentPassword");
  const newPassword = value(formData, "newPassword");
  const passwordConfirmation = value(formData, "passwordConfirmation");

  if (!currentPassword || newPassword.length < 8) return { status: "error", message: "현재 비밀번호와 8자 이상의 새 비밀번호를 입력해 주세요." };
  if (newPassword !== passwordConfirmation) return { status: "error", message: "새 비밀번호 확인이 일치하지 않습니다." };
  if (currentPassword === newPassword) return { status: "error", message: "현재 비밀번호와 다른 비밀번호를 사용해 주세요." };
  if (!isSupabaseConfigured()) return { status: "error", message: "Supabase 환경변수 설정이 필요합니다." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { status: "error", message: "로그인이 만료되었습니다. 다시 로그인해 주세요." };

  const { error: reauthenticationError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
  if (reauthenticationError) return { status: "error", message: "현재 비밀번호가 올바르지 않습니다." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { status: "error", message: "비밀번호를 변경하지 못했습니다. 잠시 뒤 다시 시도해 주세요." };

  return { status: "success", message: "비밀번호를 변경했습니다." };
}
