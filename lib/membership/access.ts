import { cache } from "react";
import { redirect } from "next/navigation";
import { cohortNumberFromName } from "@/data/seasonWeeks";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const missingMembershipFunctionCodes = new Set(["42883", "PGRST202"]);

export function canUseLegacyMembershipFallback(errorCode?: string) {
  return missingMembershipFunctionCodes.has(errorCode ?? "");
}

export const requireActiveMembership = cache(async function requireActiveMembership() {
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
});

export type MemberCohort = { name: string; number: number };

// 참여했던 기수 이력. 현재 기수는 프로필을 따르고, 나머지는 지난 기수로 읽기만 허용한다.
// 현재 기수도 종료일이 지났으면 읽기만 허용한다. 이력 표가 아직 없으면(마이그레이션 미적용) 현재 기수만 사용한다.
// 현재 기수의 시작 시각은 대화방 주차 순차 공개 기준으로 함께 돌려준다.
export const getMemberCohortHistory = cache(async function getMemberCohortHistory() {
  const member = await requireActiveMembership();
  const supabase = await createClient();
  const [{ data: rows, error }, { data: currentCohortRow }] = await Promise.all([
    supabase.from("member_cohorts").select("cohort").eq("user_id", member.user.id),
    member.cohort
      ? supabase.from("cohorts").select("starts_at, ends_at").eq("name", member.cohort).maybeSingle()
      : Promise.resolve({ data: null as { starts_at: string | null; ends_at: string | null } | null })
  ]);

  const cohortNames = new Set<string>(error ? [] : (rows ?? []).map((row: { cohort: string }) => row.cohort));
  if (member.cohort) cohortNames.add(member.cohort);

  const pastCohorts = [...cohortNames]
    .filter((name) => name !== member.cohort)
    .map((name) => ({ name, number: cohortNumberFromName(name) }))
    .filter((cohort): cohort is MemberCohort => cohort.number !== null)
    .sort((a, b) => b.number - a.number);

  const endsAt = currentCohortRow?.ends_at ? new Date(currentCohortRow.ends_at).getTime() : null;
  const currentCohortEnded = endsAt !== null && endsAt <= Date.now();
  const currentCohortStartsAt = currentCohortRow?.starts_at ?? null;

  return { member, cohortNames, pastCohorts, currentCohortEnded, currentCohortStartsAt };
});
