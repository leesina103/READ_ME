import { redirect } from "next/navigation";
import { cohortNumberFromName } from "@/data/seasonWeeks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const missingMembershipFunctionCodes = new Set(["42883", "PGRST202"]);

export function canUseLegacyMembershipFallback(errorCode?: string) {
  return missingMembershipFunctionCodes.has(errorCode ?? "");
}

export async function requireActiveMembership() {
  if (!isSupabaseConfigured()) redirect("/my");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/membership");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, cohort, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const { data: hasActiveMembership, error: membershipError } = await supabase.rpc("has_active_membership");
  const migrationPending = membershipError ? canUseLegacyMembershipFallback(membershipError.code) : false;
  const active = membershipError
    ? migrationPending && Boolean(profile.cohort)
    : hasActiveMembership === true;

  if (!active) redirect("/my?membership=required");

  return {
    user,
    displayName: profile.display_name,
    cohort: profile.cohort,
    cohortNumber: profile.cohort ? cohortNumberFromName(profile.cohort) : null
  };
}
