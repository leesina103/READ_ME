import Link from "next/link";
import { activityDate, activityKindLabel, activityPhase, refundDeadline, refundRules, won, type Activity } from "@/lib/membership/activities";

export function ActivityCard({ activity, admin = false, now }: { activity: Activity; admin?: boolean; now: number }) {
  return <Link href={`${admin ? "/admin" : "/membership"}/activities/${activity.id}`} className="activity-card activity-card-link">
    <div className="activity-row"><span className="eyebrow">{activityKindLabel[activity.kind]}</span><span className="activity-badge">{activityPhase(activity, now)}</span></div>
    <h3>{activity.title}</h3><p>{activityDate(activity.starts_at)}</p><p>{activity.location}</p>
    <div className="activity-row">{admin && <strong>{won(activity.fee)}</strong>}<span>신청 {activity.reserved_count} / {activity.capacity}명</span></div>
    <p>가이드 {activity.host_name}</p>
  </Link>;
}
export function ActivityRefundNotice({ startsAt }: { startsAt?: string }) {
  return <section className="activity-notice" aria-label="취소·환불 기준"><h2>취소·환불 안내</h2>
    {startsAt && <p><strong>전액 환불 취소 기한: {activityDate(refundDeadline(startsAt))}까지</strong></p>}
    <ul>{refundRules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
    <p>환불 대상 금액은 운영자가 입금 내역을 확인한 뒤 반환합니다.</p>
  </section>;
}
export function ActivityDataError() {
  return <p role="alert" className="activity-notice">모임 정보를 불러오지 못했습니다. 잠시 후 새로고침해 주세요. 계속 문제가 생기면 운영자에게 알려 주세요.</p>;
}
