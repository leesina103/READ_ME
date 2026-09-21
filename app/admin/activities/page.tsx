import Link from "next/link";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { ActivityCard, ActivityDataError } from "@/components/activities/ActivityContent";
import { activityDate, type Activity, type ActivityProposal, type ActivityRegistration } from "@/lib/membership/activities";

export default async function AdminActivitiesPage() {
  const db = await requireAdmin("/admin/activities");
  if (!db) return <main className="activity-page">{supabaseNotConfiguredMessage}</main>;
  const [a, r, p] = await Promise.all([
    db.from("activities").select("*").order("starts_at", { ascending: false }),
    db.from("activity_registrations").select("*").or("status.eq.pending,refund_status.eq.pending,refund_status.eq.check_payment").order("created_at"),
    db.from("activity_proposals").select("*").order("created_at", { ascending: false })
  ]);
  const activities = (a.data ?? []) as Activity[];
  const registrations = (r.data ?? []) as ActivityRegistration[];
  return <main className="activity-page">
    <Link href="/admin">← 운영자 공간</Link><p className="eyebrow activity-section">ACTIVITY MANAGEMENT</p><h1>북토의·소모임 관리</h1>
    <p className="activity-lead">가이드 모임을 등록하고 입금·환불 내역과 회원 제안을 확인합니다.</p>
    <Link href="/admin/activities/new" className="button button--primary">새 모임 등록</Link>
    <section className="activity-section"><h2>처리할 신청</h2>{r.error ? <ActivityDataError /> : registrations.length ? <div className="activity-stack">{registrations.map(item => <Link key={item.id} href={`/admin/activities/${item.activity_id}#registrations`} className="activity-card activity-row"><span>{activities.find(itemA => itemA.id === item.activity_id)?.title ?? "모임"} · {item.member_name}</span><strong>{item.refund_status === "pending" ? "전액 환불 대기" : item.refund_status === "check_payment" ? "취소 후 입금 확인" : "입금 확인 대기"}</strong></Link>)}</div> : <p>처리할 입금·환불 요청이 없습니다.</p>}</section>
    <section className="activity-section"><h2>등록한 모임</h2>{a.error ? <ActivityDataError /> : activities.length ? <div className="activity-grid">{activities.map(item => <ActivityCard key={item.id} activity={item} admin now={Date.now()} />)}</div> : <p>아직 등록한 모임이 없습니다.</p>}</section>
    <section className="activity-section"><h2>회원이 제안한 모임</h2>{p.error ? <ActivityDataError /> : p.data?.length ? <div className="activity-stack">{(p.data as ActivityProposal[]).map(item => <article className="activity-card" key={item.id}><h3>{item.title}</h3><p>{item.member_name} · {activityDate(item.created_at)}</p><p className="activity-preline">{item.content}</p></article>)}</div> : <p>접수된 제안이 없습니다.</p>}</section>
  </main>;
}
