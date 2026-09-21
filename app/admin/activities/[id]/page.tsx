import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { ActivityActionForm, ActivityEditor } from "@/components/activities/ActivityForms";
import { ActivityDataError } from "@/components/activities/ActivityContent";
import { cancelActivityAction, reviewRegistrationAction } from "@/app/membership/activity-actions";
import { activityDate, registrationLabel, refundLabel, won, type Activity, type ActivityRegistration } from "@/lib/membership/activities";

function ReviewForm({ registration, operation, label, confirmation }: { registration: ActivityRegistration; operation: string; label: string; confirmation: string }) {
  return <ActivityActionForm action={reviewRegistrationAction} label={label} confirmation={confirmation}><input type="hidden" name="registrationId" value={registration.id} /><input type="hidden" name="operation" value={operation} /></ActivityActionForm>;
}
export default async function AdminActivityDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const db = await requireAdmin(`/admin/activities/${id}`);
  if (!db) return <main className="activity-page">{supabaseNotConfiguredMessage}</main>;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [a, b, c, r] = await Promise.all([
    db.from("activities").select("*").eq("id", id).maybeSingle(),
    db.from("activity_payment_details").select("bank_info").eq("activity_id", id).maybeSingle(),
    db.from("activity_chat_details").select("chat_url,chat_password").eq("activity_id", id).maybeSingle(),
    db.from("activity_registrations").select("*").eq("activity_id", id).order("created_at", { ascending: false })
  ]);
  if (a.error || b.error || c.error) return <main className="activity-page"><ActivityDataError /></main>;
  if (!a.data) notFound();
  const activity = a.data as Activity;
  return <main className="activity-page"><Link href="/admin/activities">← 모임 관리</Link><h1>{activity.title}</h1>
    {(await searchParams).saved && <p role="status" className="activity-notice">모임을 저장했습니다.</p>}
    {activity.status !== "draft" && <Link href={`/membership/activities/${id}`} className="button button--ghost">회원용 상세 화면</Link>}
    <section id="registrations" className="activity-section"><h2>신청자 · {activity.reserved_count} / {activity.capacity}명</h2><p>은행 내역과 입금자명을 대조한 뒤 처리해 주세요. 버튼은 상태만 기록하며 실제 환불 송금은 별도로 진행합니다.</p>
      {r.error ? <ActivityDataError /> : r.data?.length ? <div className="activity-stack">{(r.data as ActivityRegistration[]).map(item => <article className="activity-card" key={item.id}>
        <div className="activity-row"><h3>{item.member_name}</h3><span className="activity-badge">{registrationLabel[item.status]}</span></div>
        <p>입금자명: <strong>{item.payment_code}{item.payer_name}</strong> · {won(item.amount)}</p><p>신청: {activityDate(item.created_at)}</p>
        {item.paid_at && <p>입금 확인: {activityDate(item.paid_at)}</p>}
        {item.status === "cancelled" && <p>{refundLabel[item.refund_status]}{item.refund_amount > 0 && ` · ${won(item.refund_amount)}`}</p>}
        {!item.paid_at && (item.status === "cancelled" || new Date(activity.starts_at).getTime() > Date.now()) && <ReviewForm registration={item} operation="confirm_payment" label={item.status === "cancelled" ? "취소한 신청의 입금 기록" : "입금 확인 · 참여 확정"} confirmation="운영 계좌에서 이 신청자의 정확한 참가비 입금을 확인했습니다." />}
        {!item.paid_at && (item.status === "pending" || item.refund_status === "check_payment") && <ReviewForm registration={item} operation="unpaid" label={item.status === "pending" ? "미입금 확인 · 신청 취소" : "미입금으로 확인"} confirmation="입금 내역이 없는 것을 확인했습니다. 신청 자리가 해제됩니다." />}
        {item.refund_status === "pending" && <ReviewForm registration={item} operation="refund" label="전액 환불 완료로 표시" confirmation={`${won(item.refund_amount)}을 신청자에게 실제로 반환했습니다.`} />}
      </article>)}</div> : <p className="activity-notice">아직 신청자가 없습니다.</p>}
    </section>
    {activity.status !== "cancelled" ? <>
      <details className="activity-section" open={!r.data?.length}><summary>모임 내용 수정</summary><ActivityEditor activity={activity} secrets={{ bank_info: b.data?.bank_info ?? "", chat_url: c.data?.chat_url ?? "", chat_password: c.data?.chat_password ?? "" }} /></details>
      <details className="activity-section"><summary>가이드 사정으로 모임 취소</summary><p>입금한 신청자는 전액 환불 대상으로 바뀌며 채팅방 정보 공개가 중단됩니다. 이미 입장한 회원에게는 별도로 취소를 안내해 주세요.</p><ActivityActionForm action={cancelActivityAction} label="모임 취소 · 전액 환불 대상으로 변경" confirmation="이 모임을 취소하고 입금한 신청자 전원에게 전액 환불합니다."><input type="hidden" name="activityId" value={id} /></ActivityActionForm></details>
    </> : <p className="activity-notice">취소된 모임입니다. 위 신청자 목록에서 입금 확인과 환불 처리를 완료해 주세요.</p>}
  </main>;
}
