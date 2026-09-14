import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const supabaseNotConfiguredMessage = "Supabase 환경변수 설정이 필요합니다.";

export async function requireAdmin(nextPath: string) {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=${nextPath}`);
  if (user.app_metadata?.role !== "admin") redirect("/my");

  return supabase;
}
