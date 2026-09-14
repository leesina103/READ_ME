import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, CalendarRange, ClipboardList, LockKeyhole, UserRound, UsersRound } from "lucide-react";
import { logoutAction } from "@/app/auth/actions";
import { requireAdmin } from "@/lib/admin/access";
import { seoulDateKey } from "@/lib/admin/format";

export const metadata: Metadata = {
  title: "관리자",
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const supabase = await requireAdmin("/admin");
  let pendingApplications: number | null = null;
  let upcomingInterviews: number | null = null;

  if (supabase) {
    const [applications, interviews] = await Promise.all([
      supabase.rpc("admin_list_membership_applications"),
      supabase.rpc("admin_list_interview_applications")
    ]);
    if (!applications.error) {
      pendingApplications = ((applications.data ?? []) as { status: string }[]).filter((item) => item.status === "pending").length;
    }
    if (!interviews.error) {
      const todayKey = seoulDateKey(new Date().toISOString());
      upcomingInterviews = ((interviews.data ?? []) as { status: string; starts_at: string }[])
        .filter((item) => item.status === "booked" && seoulDateKey(item.starts_at) >= todayKey).length;
    }
  }

  const sections = [
    { href: "/admin/applications", icon: UsersRound, title: "가입 신청 관리", description: "접수된 신청을 확인하고 승인하거나 거절합니다.", badge: pendingApplications === null ? null : `검토 대기 ${pendingApplications}건` },
    { href: "/admin/members", icon: ClipboardList, title: "기수 회원 명단", description: "기수별 승인 명단과 가입 상태를 확인합니다.", badge: null },
    { href: "/admin/interviews", icon: CalendarClock, title: "인터뷰 예약", description: "예약된 인터뷰 일정과 신청자 연락처를 확인합니다.", badge: upcomingInterviews === null ? null : `다가오는 인터뷰 ${upcomingInterviews}건` },
    { href: "/admin/cohorts", icon: CalendarRange, title: "기수 일정 관리", description: "기수 시작일·종료일과 가입 신청 접수 여부를 관리합니다.", badge: null }
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="eyebrow">ADMIN AREA</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">운영자 공간</h1>
          <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">가입 신청과 기수 회원, 인터뷰 예약을 확인하는 운영 전용 영역입니다. 공개 메뉴에는 노출하지 않습니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/my" className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold transition-colors hover:text-[var(--forest)]"><UserRound size={16} aria-hidden="true" /> 나의 서재</Link>
          <form action={logoutAction}><button className="rounded-full border border-[var(--line)] bg-[var(--paper)] px-5 py-3 text-sm font-semibold" type="submit">로그아웃</button></form>
        </div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        {sections.map(({ href, icon: Icon, title, description, badge }) => (
          <Link key={href} href={href} className="group flex flex-col rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 transition-transform hover:-translate-y-1">
            <div className="flex items-start justify-between gap-4">
              <Icon className="text-[var(--forest)]" />
              <ArrowRight className="text-[var(--muted)] transition-transform group-hover:translate-x-1" size={19} />
            </div>
            <h2 className="mt-8 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{description}</p>
            {badge && <span className="mt-5 inline-flex w-fit rounded-full bg-[var(--sage)]/50 px-3 py-1 text-xs font-semibold text-[var(--forest)]">{badge}</span>}
          </Link>
        ))}
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-[24px] border border-[var(--line)] p-6">
        <LockKeyhole className="shrink-0 text-[var(--forest)]" />
        <p className="text-sm text-[var(--muted)]">관리자 역할이 확인된 계정만 접근할 수 있습니다.</p>
      </div>
    </main>
  );
}
