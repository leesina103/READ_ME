import { groupMeetingTime, type GroupMeeting } from "@/lib/membership/groupSelection";

export function MembershipGroupDetails({ hostName, hostStyle, venue, durationMinutes, meetings, compact = false }: {
  hostName: string; hostStyle?: string; venue: string; durationMinutes: number; meetings: GroupMeeting[]; compact?: boolean;
}) {
  const times = [...new Set(meetings.map((meeting) => groupMeetingTime(meeting.starts_at, durationMinutes, true)))];
  return <div className="min-w-0 break-words">
    <p className="font-semibold text-[var(--ink)]">가이드 {hostName || "안내 준비 중"}</p>
    {hostStyle && <div className="mt-3 border-l-2 border-[var(--line)] pl-3">
      <p className="text-xs font-semibold text-[var(--forest)]">가이드 소개</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">{hostStyle}</p>
    </div>}
    <p className="mt-4 text-sm leading-6">장소 : {venue || "안내 준비 중"}</p>
    {compact ? <div className="mt-1 grid gap-1 text-sm leading-6">{times.map((time) => <p key={time}>시간 : {time}</p>)}</div> : <ol className="mt-3 grid gap-2 text-sm leading-6" aria-label="전체 모임 일정">
      {meetings.map((meeting, index) => <li key={meeting.week_number}>
        <span className="mr-2 font-semibold text-[var(--forest)]">{index + 1}회차</span>
        <time dateTime={meeting.starts_at}>{groupMeetingTime(meeting.starts_at, durationMinutes)}</time>
      </li>)}
    </ol>}
  </div>;
}
