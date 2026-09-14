import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { formatPhone, formatSeoulDate, formatSeoulDayHeading, formatSeoulTime, seoulDateKey } from "@/lib/admin/format";

export const metadata: Metadata = {
  title: "인터뷰 예약",
  robots: { index: false, follow: false }
};

type InterviewRow = {
  id: string;
  name: string;
  phone: string;
  status: "booked" | "cancelled";
  starts_at: string;
  created_at: string;
  cancelled_at: string | null;
};

function InterviewTable({ rows, showDate = false }: { rows: InterviewRow[]; showDate?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr>
            <th className="px-6 py-3 font-semibold">{showDate ? "일시" : "시간"}</th>
            <th className="px-4 py-3 font-semibold">이름</th>
            <th className="px-4 py-3 font-semibold">연락처</th>
            <th className="px-4 py-3 font-semibold">예약한 날</th>
            <th className="px-6 py-3 font-semibold">상태</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const cancelled = row.status === "cancelled";
            return (
              <tr key={row.id} className={`border-t border-[var(--line)] ${cancelled ? "text-[var(--muted)]" : ""}`}>
                <td className="px-6 py-4 font-semibold">{showDate ? `${formatSeoulDate(row.starts_at)} ${formatSeoulTime(row.starts_at)}` : formatSeoulTime(row.starts_at)}</td>
                <td className={`px-4 py-4 ${cancelled ? "line-through" : ""}`}>{row.name}</td>
                <td className="px-4 py-4"><a href={`tel:${row.phone}`} className="text-[var(--forest)] underline-offset-4 hover:underline">{formatPhone(row.phone)}</a></td>
                <td className="px-4 py-4 text-[var(--muted)]">{formatSeoulDate(row.created_at)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${cancelled ? "border border-[var(--line)] text-[var(--muted)]" : "bg-[var(--sage)]/50 text-[var(--forest)]"}`}>
                    {cancelled ? "취소" : "예약"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminInterviewsPage() {
  const supabase = await requireAdmin("/admin/interviews");
  let interviews: InterviewRow[] = [];
  let loadError = "";

  if (!supabase) {
    loadError = supabaseNotConfiguredMessage;
  } else {
    const { data, error } = await supabase.rpc("admin_list_interview_applications");
    if (error) loadError = "인터뷰 예약을 불러오지 못했습니다. 데이터베이스 마이그레이션 적용 여부를 확인해 주세요.";
    else interviews = (data ?? []) as InterviewRow[];
  }

  const todayKey = seoulDateKey(new Date().toISOString());
  const upcoming = interviews.filter((row) => seoulDateKey(row.starts_at) >= todayKey);
  const past = interviews.filter((row) => seoulDateKey(row.starts_at) < todayKey).reverse();
  const upcomingBooked = upcoming.filter((row) => row.status === "booked").length;

  const groups = upcoming.reduce<{ key: string; heading: string; rows: InterviewRow[] }[]>((list, row) => {
    const key = seoulDateKey(row.starts_at);
    const group = list.find((item) => item.key === key);
    if (group) group.rows.push(row);
    else list.push({ key, heading: formatSeoulDayHeading(row.starts_at), rows: [row] });
    return list;
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={16} /> 운영자 공간으로 돌아가기
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">INTERVIEW BOOKINGS</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">인터뷰 예약</h1>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">예약된 인터뷰를 날짜별로 보여줍니다. 취소된 예약은 흐리게 표시되고, 끝난 인터뷰는 다음 날부터 아래 지난 목록으로 이동합니다. 시간은 모두 한국 시간입니다.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4">
          <CalendarClock className="text-[var(--forest)]" size={20} />
          <span className="text-sm font-semibold">다가오는 인터뷰 {upcomingBooked}건</span>
        </div>
      </div>
      <section className="mt-10 grid gap-6">
        {loadError ? (
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm leading-6 text-[var(--ink)]">{loadError}</div>
        ) : (
          <>
            {groups.length === 0 && (
              <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--muted)]">다가오는 인터뷰 예약이 없습니다.</div>
            )}
            {groups.map((group) => (
              <article key={group.key} className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--paper)]">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-6 py-5">
                  <h2 className="text-xl font-semibold">{group.heading}</h2>
                  <span className="text-sm text-[var(--muted)]">{group.rows.filter((row) => row.status === "booked").length}건</span>
                </header>
                <InterviewTable rows={group.rows} />
              </article>
            ))}
            {past.length > 0 && (
              <details className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--paper)]">
                <summary className="cursor-pointer list-none px-6 py-5 text-sm font-semibold text-[var(--muted)]">지난 인터뷰 {past.length}건 보기</summary>
                <div className="border-t border-[var(--line)]"><InterviewTable rows={past} showDate /></div>
              </details>
            )}
          </>
        )}
      </section>
    </main>
  );
}
