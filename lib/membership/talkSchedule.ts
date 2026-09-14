import { formatSeoulDayHeading } from "@/lib/admin/format";

const weekInMs = 7 * 24 * 60 * 60 * 1000;

// 대화방 주차 공개 시각. 기수 시작 시각(cohorts.starts_at)을 1주차 공개 시각으로 보고
// 매주 같은 요일·시각에 다음 주차를 연다. 시작 시각을 모르면(null) 공개 제한 없이 전부 연다.
// DB의 talk_week_opens_at 함수와 같은 규칙을 유지해야 한다.
export function talkWeekOpensAt(startsAt: string | null | undefined, week: number): Date | null {
  if (!startsAt) return null;
  const base = new Date(startsAt).getTime();
  if (Number.isNaN(base)) return null;
  return new Date(base + (week - 1) * weekInMs);
}

export function isTalkWeekOpen(startsAt: string | null | undefined, week: number, now = Date.now()) {
  const opensAt = talkWeekOpensAt(startsAt, week);
  return opensAt === null || opensAt.getTime() <= now;
}

// "10월 12일 (월)" 형식. 서울 시간 기준으로 표시한다.
export function formatTalkWeekOpenDate(opensAt: Date) {
  return formatSeoulDayHeading(opensAt.toISOString());
}
