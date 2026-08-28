import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { redirect } from "next/navigation";
import { ApplicationReviewList, type MembershipApplication } from "@/components/ApplicationReviewList";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "가입 신청 관리",
  description: "READ ME 가입 신청을 검토하고 승인합니다."
};

export default async function AdminApplicationsPage() {
  let applications: MembershipApplication[] = [];
  let loadError = "";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login?next=/admin/applications");
    if (user.app_metadata?.role !== "admin") redirect("/my");

    const { data, error } = await supabase.rpc("admin_list_membership_applications");
    if (error) loadError = "신청 목록을 불러오지 못했습니다. 데이터베이스 마이그레이션 적용 여부를 확인해 주세요.";
    else applications = (data ?? []) as MembershipApplication[];
  } else {
    loadError = "Supabase 환경변수 설정이 필요합니다.";
  }

  const pendingCount = applications.filter((application) => application.status === "pending").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={16} /> 운영자 공간으로 돌아가기
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">MEMBERSHIP APPLICATIONS</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">가입 신청 관리</h1>
          <p className="mt-4 text-[var(--muted)]">신청 내용을 확인하고 승인하면 기존 가입 허용 명단에 자동 등록됩니다.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4">
          <ClipboardList className="text-[var(--forest)]" size={20} />
          <span className="text-sm font-semibold">검토 대기 {pendingCount}건</span>
        </div>
      </div>
      <section className="mt-10">
        {loadError ? (
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm leading-6 text-[var(--ink)]">{loadError}</div>
        ) : (
          <ApplicationReviewList applications={applications} />
        )}
      </section>
    </main>
  );
}
