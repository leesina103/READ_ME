export const bookingTokenPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function bookingManagementPath(token: string) {
  return `/interview/apply/manage/${encodeURIComponent(token)}`;
}

export function formatInterviewTime(startsAt: string) {
  // 서버와 브라우저의 언어 데이터 차이 없이 같은 한국어 시각을 표시합니다.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul", hourCycle: "h23", year: "numeric", month: "numeric",
    day: "numeric", hour: "numeric", minute: "2-digit"
  }).formatToParts(new Date(startsAt));
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  const year = read("year"), month = read("month"), day = read("day"), hour = read("hour");
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${year}년 ${month}월 ${day}일 (${weekday}) ${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}:${String(read("minute")).padStart(2, "0")}`;
}
