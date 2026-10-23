import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function guideSession(active = true) {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/guide");
  const { data: profile } = await supabase.from("profiles").select("onboarding_completed_at,cohort").eq("id", user.id).single();
  if (!profile?.onboarding_completed_at) redirect("/onboarding");
  const { data: status, error } = await supabase.rpc("my_guide_status");
  if (error) throw new Error("가이드 권한을 확인하지 못했습니다. 잠시 뒤 다시 시도해 주세요.");
  const isAdmin = user.app_metadata?.role === "admin";
  if (active && !isAdmin && status !== "active") redirect("/guide");
  return { supabase, status: status as string | null, isAdmin, isMember: Boolean(profile.cohort) };
}
