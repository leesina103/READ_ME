export type GroupMeeting = { week_number: number; starts_at: string };
export type MembershipGroupOption = {
  id: string;
  host_name: string;
  host_style: string;
  venue: string;
  duration_minutes: number;
  meetings: GroupMeeting[];
};

export function groupMeetingTime(startsAt: string, durationMinutes: number, weekdayOnly = false) {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const date = new Intl.DateTimeFormat("ko-KR", weekdayOnly
    ? { timeZone: "Asia/Seoul", weekday: "long" }
    : { timeZone: "Asia/Seoul", month: "long", day: "numeric", weekday: "short" });
  const time = new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  return `${date.format(start)} ${time.format(start)}–${date.format(start) === date.format(end) ? "" : `${date.format(end)} `}${time.format(end)}`;
}
