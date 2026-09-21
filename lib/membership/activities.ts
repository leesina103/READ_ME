export type Activity = {
  id: string; host_id: string; host_name: string; kind: "book-club" | "gatherings";
  title: string; description: string; starts_at: string; closes_at: string; location: string;
  capacity: number; reserved_count: number; fee: number; book_title: string; reading_scope: string;
  included: string; extra_cost: string; contact: string; status: "draft" | "open" | "closed" | "cancelled";
};
export type ActivityRegistration = {
  id: string; activity_id: string; user_id: string; member_name: string; payer_name: string;
  payment_code: string; amount: number; status: "pending" | "confirmed" | "cancelled";
  refund_status: "none" | "check_payment" | "pending" | "completed" | "not_due";
  refund_amount: number; paid_at: string | null; created_at: string;
};
export type ActivityProposal = { id: string; title: string; content: string; member_name: string; status: "submitted" | "reviewed"; created_at: string };
export type ActivitySecrets = { bank_info: string; chat_url: string; chat_password: string };
export type ActivityActionState = { status: "idle" | "success" | "error"; message: string };
export const activityKindLabel = { "book-club": "북토의", gatherings: "소모임" };
export function activityDefaultDetails(kind: Activity["kind"]) {
  return {
    included: kind === "book-club" ? "발제문·가이드 토의 진행" : "모임 모집·신청 관리",
    extra_cost: "식비·입장료 등 활동 비용은 별도입니다.",
    contact: "사이트 하단의 공통 문의 안내를 확인해 주세요."
  };
}
export const registrationLabel = { pending: "입금 확인 대기", confirmed: "참여 확정", cancelled: "신청 취소" };
export const refundLabel = { none: "환불할 입금 없음", check_payment: "입금 여부 확인 중", pending: "전액 환불 대기", completed: "전액 환불 완료", not_due: "환불 기한 경과 · 환불 불가" };
export const refundRules = ["모임 시작 7일 전까지 취소하면 전액 환불됩니다.", "그 이후 취소는 환불되지 않습니다.", "가이드 사정으로 모임이 취소되면 전액 환불됩니다."];
export function activityDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "long", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}
export function refundDeadline(startsAt: string) { return new Date(new Date(startsAt).getTime() - 7 * 86400000).toISOString(); }
export function activityChatHref(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}
export function seoulInput(value: string) { return new Date(new Date(value).getTime() + 9 * 3600000).toISOString().slice(0, 16); }
export function won(value: number) { return `${value.toLocaleString("ko-KR")}원`; }
export function activityPhase(activity: Activity, now: number) {
  if (activity.status === "cancelled") return "모임 취소";
  if (activity.status === "draft") return "작성 중";
  if (new Date(activity.starts_at).getTime() <= now) return "지난 모임";
  if (activity.status === "closed" || new Date(activity.closes_at).getTime() <= now) return "모집 마감";
  if (activity.reserved_count >= activity.capacity) return "정원 마감";
  return "모집 중";
}
