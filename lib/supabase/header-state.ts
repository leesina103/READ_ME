import "server-only";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canUseLegacyMembershipFallback } from "@/lib/membership/access";
import { AUTH_UNAVAILABLE_HEADER, createRequestBudget } from "@/lib/supabase/request-budget";

const guest = { isAuthenticated: false, isMember: false, isAdmin: false, accountLabel: "로그인" };
const unavailable = { ...guest, accountLabel: "로그인 확인 지연" };

// 메뉴 표시만 담당합니다. 회원 화면의 서버 측 권한 검사는 그대로 유지합니다.
export async function getHeaderState() {
  if (!isSupabaseConfigured()) return guest;
  if ((await headers()).get(AUTH_UNAVAILABLE_HEADER) === "1") return unavailable;

  const budget = createRequestBudget();
  try {
    return await budget.run(async () => {
      const supabase = await createClient({ fetch: budget.fetch });
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error && error.name !== "AuthSessionMissingError") throw error;
      if (!user) return guest;

      budget.setStage("상단 메뉴 프로필 조회");
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, cohort, onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;

      let isMember = false;
      if (profile?.onboarding_completed_at && profile.cohort) {
        budget.setStage("상단 메뉴 멤버십 조회");
        const { data, error: membershipError } = await supabase.rpc("has_active_membership");
        if (membershipError && !canUseLegacyMembershipFallback(membershipError.code)) throw membershipError;
        isMember = membershipError ? true : data === true;
      }
      return {
        isAuthenticated: true,
        isMember,
        isAdmin: user.app_metadata?.role === "admin",
        accountLabel: profile?.onboarding_completed_at && profile.display_name ? profile.display_name : "설정하기"
      };
    }, "상단 메뉴");
  } catch {
    return unavailable;
  }
}
