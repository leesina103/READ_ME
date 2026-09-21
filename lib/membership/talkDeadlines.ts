export type TalkSchedule = {
  week_number: number;
  group_name: string | null;
  meeting_at: string | null;
  due_at: string | null;
  opens_at: string | null;
  answered: boolean;
};

export type TalkGroup = { id: string; cohort: string; name: string };
export type TalkFormState = { status: "idle" | "success" | "error"; message: string };
export type TalkMeeting = { group_id: string; week_number: number; starts_at: string };
export type TalkMember = { user_id: string; display_name: string; weekday: number | null; group_id: string | null };
export const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
const day = 86_400_000;
const seoulOffset = 9 * 60 * 60 * 1000;

export function seoulInput(value: string) {
  return new Date(Date.parse(value) + seoulOffset).toISOString().slice(0, 16);
}

export function parseSeoulInput(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}:00+09:00`);
  if (!Number.isFinite(parsed.getTime()) || seoulInput(parsed.toISOString()) !== value) return null;
  return parsed.toISOString();
}

// 운영자 미리보기용. DB의 talk_due_at과 같은 한국 시간 날짜 계산이다.
export function talkDueAt(week: number, meetingAt: string | null): string | null {
  const source = meetingAt;
  if (!source || !Number.isFinite(Date.parse(source))) return null;
  const local = new Date(Date.parse(source) + seoulOffset);
  const shift = week % 2 === 1 ? -2 : 7 + (7 - local.getUTCDay()) % 7;
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
    + shift * day + (23 * 60 + 59) * 60_000 - seoulOffset).toISOString();
}

export function talkMeetingTime(value: string) {
  const local = new Date(Date.parse(value) + seoulOffset);
  const hour = local.getUTCHours(), minute = local.getUTCMinutes();
  return `${weekdays[local.getUTCDay()]} ${hour < 12 ? "오전" : "오후"} ${hour % 12 || 12}시${minute ? ` ${minute}분` : ""}`;
}

export function deadlineText(value: string) {
  const date = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short" }).format(new Date(value));
  return `${date} 밤 11:59까지 작성해주세요.`;
}

export function talkReminder(schedule: TalkSchedule, now: number): "today" | "overdue" | null {
  if (schedule.answered || !schedule.due_at || !schedule.opens_at || Date.parse(schedule.opens_at) > now) return null;
  const due = Date.parse(schedule.due_at);
  // 안내일 오전 9시부터 표시하고, 날짜가 지나도 기수 종료 전까지 작성 링크를 유지한다.
  if (now < due - (14 * 60 + 59) * 60_000) return null;
  return now < due + 60_000 ? "today" : "overdue";
}
