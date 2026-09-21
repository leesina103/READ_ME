import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityDataError, ActivityRefundNotice } from "@/components/activities/ActivityContent";
import { CancelRegistrationForm, RefreshActivityButton, RegisterActivityForm } from "@/components/activities/ActivityForms";
import { requireActiveMembership } from "@/lib/membership/access";
import { createClient } from "@/lib/supabase/server";
import { activityChatHref, activityDate, activityKindLabel, activityPhase, refundDeadline, refundLabel, registrationLabel, won, type Activity, type ActivityRegistration } from "@/lib/membership/activities";

export default async function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const member = await requireActiveMembership();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = await createClient();
  const [activityResult, registrationResult, bankResult, chatResult] = await Promise.all([
    db.from("activities").select("*").eq("id", id).neq("status", "draft").maybeSingle(),
    db.from("activity_registrations").select("*").eq("activity_id", id).eq("user_id", member.user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    db.from("activity_payment_details").select("bank_info").eq("activity_id", id).maybeSingle(),
    db.from("activity_chat_details").select("chat_url,chat_password").eq("activity_id", id).maybeSingle()
  ]);
  if (activityResult.error) return <main className="activity-page"><ActivityDataError /></main>;
  if (!activityResult.data) notFound();
  const a = activityResult.data as Activity;
  const r = registrationResult.data as ActivityRegistration | null;
  const now = Date.now(), phase = activityPhase(a, now);
  const isHost = member.user.id === a.host_id;
  const chatText = chatResult.data?.chat_url?.trim() ?? "";
  const chatHref = activityChatHref(chatText);
  const canRegister = !isHost && phase === "모집 중" && (!r || (r.status === "cancelled" && !["pending", "check_payment"].includes(r.refund_status)));
  return <main className="activity-page">
    <Link href={`/membership/activities?tab=${a.kind}`}>← 모임 목록</Link>
    <p className="eyebrow activity-section">{activityKindLabel[a.kind]} · {phase}</p><h1>{a.title}</h1>
    <p className="activity-lead activity-preline">{a.description}</p>
    <section className="activity-card"><h2>모임 안내</h2><dl className="activity-facts">
      <div><dt>일시</dt><dd>{activityDate(a.starts_at)}</dd></div><div><dt>장소</dt><dd>{a.location}</dd></div>
      <div><dt>가이드</dt><dd>{a.host_name}</dd></div><div><dt>신청 마감</dt><dd>{activityDate(a.closes_at)}</dd></div>
      <div><dt>정원</dt><dd>{a.capacity}명 · 신청 {a.reserved_count}명</dd></div>
      {a.kind === "book-club" && <><div><dt>책</dt><dd>{a.book_title}</dd></div><div><dt>읽어올 범위</dt><dd>{a.reading_scope}</dd></div></>}
      <div><dt>참가비</dt><dd><strong>{won(a.fee)}</strong></dd></div><div><dt>포함 내역</dt><dd className="activity-preline">{a.included}</dd></div>
      <div><dt>별도 비용</dt><dd className="activity-preline">{a.extra_cost}</dd></div>
    </dl></section>
    <ActivityRefundNotice startsAt={a.starts_at} />
    {!isHost && <section className="activity-card activity-section" aria-labelledby="registration"><h2 id="registration">{r ? "내 신청 상태" : "참여 신청"}</h2>
      {registrationResult.error || bankResult.error || chatResult.error ? <ActivityDataError /> : <>
        {r && <><p className="activity-badge">{registrationLabel[r.status]}</p><p>신청 금액 {won(r.amount)}</p>
          {r.status === "cancelled" && <p>{refundLabel[r.refund_status]}{r.refund_amount > 0 && ` · ${won(r.refund_amount)}`}</p>}
          {r.status === "pending" && bankResult.data && <div className="activity-notice"><h3>운영 계좌 입금 안내</h3><p className="activity-preline">{bankResult.data.bank_info}</p><p>입금 금액: <strong>{won(r.amount)}</strong></p><p>입금자명: <strong>{r.payment_code}{r.payer_name}</strong></p><p>입금자명에 코드가 들어가지 않으면 위 코드와 실제 입금자명을 운영 문의로 알려 주세요.</p><p>운영자가 입금을 확인하면 이 페이지에서 오픈채팅에 입장할 수 있어요. 중복 입금하지 마시고 확인 전 취소했더라도 이미 입금했다면 운영자에게 알려 주세요.</p><RefreshActivityButton /></div>}
          {r.status === "confirmed" && a.status !== "cancelled" && <div className="activity-notice"><h3>오픈채팅 입장 안내</h3>{chatText ? <>{chatHref ? <a className="button button--primary" href={chatHref} target="_blank" rel="noopener noreferrer">오픈채팅 입장</a> : <p className="activity-preline">{chatText}</p>}<p>비밀번호: {chatResult.data?.chat_password || "없음"}</p><p>채팅방 정보는 확정된 참여자만 이용해 주세요.</p></> : <><p>채팅방 준비 중입니다. 가이드가 입장 안내를 등록하면 이곳에서 확인할 수 있어요.</p><RefreshActivityButton /></>}</div>}
          {r.status !== "cancelled" && new Date(a.starts_at).getTime() > now && <details className="activity-section"><summary>신청 취소하기</summary><CancelRegistrationForm registrationId={r.id} refundable={now <= new Date(refundDeadline(a.starts_at)).getTime()} /></details>}
        </>}
        {canRegister ? <RegisterActivityForm activityId={a.id} /> : !r && !isHost && <p>현재 신청할 수 없는 모임입니다. ({phase})</p>}
      </>}
    </section>}
  </main>;
}
