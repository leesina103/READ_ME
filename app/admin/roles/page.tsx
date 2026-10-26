import { requireAdmin } from "@/lib/admin/access";
import { GuideShell } from "@/components/GuideShell";
import { GuideRoleManager } from "@/components/GuideRoleManager";
import type { GuideOverview } from "@/lib/guide/types";
import { authCallbackUrl } from "@/lib/auth/site-url";
import { headers } from "next/headers";

export const metadata = { title: "가이드 권한 관리", robots: { index: false, follow: false } };
export default async function RolesPage({ searchParams }: { searchParams: Promise<{ member?: string; tab?: string }> }) {
  const supabase = await requireAdmin("/admin/roles");
  const result = supabase ? await supabase.rpc("admin_guide_overview") : null;
  const host = (await headers()).get("host");
  const origin = host === "localhost:3000" ? "http://localhost:3000" : new URL(authCallbackUrl("/guide")).origin;
  return <GuideShell title="가이드 권한 관리" back="/admin" backLabel="운영자 공간">
    {result?.data && !result.error ? <GuideRoleManager data={result.data as GuideOverview} selectedMember={(await searchParams).member} origin={origin} initialTab={(await searchParams).tab === "active" ? "active" : undefined} /> : <p>가이드 관리 정보를 불러오지 못했습니다. 데이터베이스 연결과 변경 적용 여부를 확인해 주세요.</p>}
  </GuideShell>;
}
