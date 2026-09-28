import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { bookingTokenPattern, formatInterviewTime } from "@/lib/interview/booking";
import { loadInterviewSlots } from "@/lib/interview/slots";
import { InterviewBookingManager } from "@/components/InterviewBookingManager";

export const metadata: Metadata = { title: "인터뷰 예약 관리", robots: { index: false, follow: false }, referrer: "no-referrer" };
export const dynamic = "force-dynamic";

export default async function ManageInterviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const result = bookingTokenPattern.test(token) ? await supabase.rpc("get_interview_booking", { p_token: token }) : { data: null, error: null };
  const booking = result.data?.[0];
  const { slots, loadFailed } = booking?.can_manage ? await loadInterviewSlots() : { slots: [], loadFailed: false };
  return (
    <main className="interview-apply-page">
      <section className="section interview-apply-hero"><div className="section-shell">
        <Link className="text-link" href="/interview">인터뷰 안내</Link>
        <div className="interview-apply-heading"><div><p className="eyebrow">YOUR INTERVIEW</p><h1>인터뷰 예약을<br />확인해 주세요.</h1></div><p>인터뷰 시작 전까지 일정을 변경하거나 취소할 수 있어요.<br />예약 관리 링크는 본인만 보관해 주세요.</p></div>
      </div></section>
      <section className="section section--paper"><div className="section-shell interview-apply-layout">
        {!booking ? <div className="interview-apply-empty"><h2>{result.error ? "예약을 불러오지 못했어요." : "예약을 찾을 수 없어요."}</h2><p>{result.error ? "잠시 후 다시 시도해 주세요." : "카카오톡이나 예약 완료 화면에서 받은 전용 링크를 확인해 주세요."}</p><Link href="/interview/apply" className="button button--primary">인터뷰 예약하기</Link></div> : <>
          <aside><p className="eyebrow">{booking.status === "cancelled" ? "CANCELLED" : "YOUR SCHEDULE"}</p><h2>{booking.status === "cancelled" ? "취소된 예약이에요." : `${booking.name}님의 예약`}</h2><p>{formatInterviewTime(booking.starts_at)}</p>
            {booking.status === "cancelled" ? <><p>예약 취소가 반영됐어요. 다시 참여하려면 새로운 일정을 선택해 주세요.</p><Link href="/interview/apply" className="button button--primary">다시 예약하기</Link></> : !booking.can_manage ? <p>인터뷰 시작 시간이 지났어요. 일정 관련 문의는 카카오톡으로 남겨 주세요.</p> : <p>일정을 변경하면 이곳에 새 시간이 표시돼요.</p>}
          </aside>
          {booking.can_manage && <InterviewBookingManager token={token} slots={slots.map((slot) => ({ ...slot, available: slot.available && slot.startsAt !== booking.starts_at }))} loadFailed={loadFailed} />}
        </>}
      </div></section>
    </main>
  );
}
