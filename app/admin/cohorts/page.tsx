import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarRange } from "lucide-react";
import { CohortScheduleList } from "@/components/CohortScheduleList";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { cohortPhase, type CohortSchedule } from "@/lib/admin/cohorts";

export const metadata: Metadata = {
  title: "기수 일정 관리",
  robots: { index: false, follow: false }
};

export default async function AdminCohortsPage() {
  const supabase = await requireAdmin("/admin/cohorts");
  let cohorts: CohortSchedule[] = [];
  let loadError = "";

  if (!supabase) {
    loadError = supabaseNotConfiguredMessage;
  } else {
    const { data, error } = await supabase.rpc("admin_list_cohorts");
    if (error) loadError = "기수 목록을 불러오지 못했습니다. 데이터베이스 마이그레이션 적용 여부를 확인해 주세요.";
    else cohorts = (data ?? []) as CohortSchedule[];
  }

  const now = Date.now();
  const ongoingCount = cohorts.filter((cohort) => cohortPhase(cohort, now).label === "진행 중").length;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={16} /> 운영자 공간으로 돌아가기
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">COHORT SCHEDULE</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">기수 일정 관리</h1>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">기수의 시작일과 종료일, 가입 신청 접수 여부를 관리합니다. 종료일이 지난 기수의 온라인 대화방은 읽기만 가능해지고, 새 기수를 추가하면 승인·회원 명단·대화방에서 바로 쓸 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4">
          <CalendarRange className="text-[var(--forest)]" size={20} />
          <span className="text-sm font-semibold">기수 {cohorts.length}개 · 진행 중 {ongoingCount}개</span>
        </div>
      </div>
      <section className="mt-10">
        {loadError ? (
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm leading-6 text-[var(--ink)]">{loadError}</div>
        ) : (
          <CohortScheduleList cohorts={cohorts} now={now} />
        )}
      </section>
    </main>
  );
}
