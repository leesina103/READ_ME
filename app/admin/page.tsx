import Link from "next/link";
import { ArrowRight, ClipboardList, LockKeyhole, UsersRound } from "lucide-react";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login?next=/admin");
    if (user.app_metadata?.role !== "admin") redirect("/my");
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
      <p className="eyebrow">ADMIN AREA</p>
      <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">운영자 공간</h1>
      <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">기수와 회차, 신청자와 공지를 관리하는 운영 전용 영역입니다. 공개 메뉴에는 노출하지 않습니다.</p>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7">
          <ClipboardList className="text-[var(--forest)]" />
          <h2 className="mt-8 text-xl font-semibold">기수·회차 관리</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">모집 상태, 도서, 일정, 장소와 질문을 관리합니다.</p>
        </article>
        <Link href="/admin/applications" className="group rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 transition-transform hover:-translate-y-1">
          <div className="flex items-start justify-between gap-4">
            <UsersRound className="text-[var(--forest)]" />
            <ArrowRight className="text-[var(--muted)] transition-transform group-hover:translate-x-1" size={19} />
          </div>
          <h2 className="mt-8 text-xl font-semibold">가입 신청 관리</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">접수된 신청을 확인하고 승인하거나 거절합니다.</p>
        </Link>
      </div>
      <div className="mt-5 flex items-center gap-4 rounded-[24px] border border-[var(--line)] p-6">
        <LockKeyhole className="shrink-0 text-[var(--forest)]" />
        <p className="text-sm text-[var(--muted)]">관리자 역할이 확인된 계정만 접근할 수 있습니다.</p>
      </div>
    </main>
  );
}
