import { formatSeoulDayHeading } from "@/lib/admin/format";

// "10월 12일 (월)" 형식. 서울 시간 기준으로 표시한다.
export function formatTalkWeekOpenDate(opensAt: Date) {
  return formatSeoulDayHeading(opensAt.toISOString());
}
