import { formatSeoulDateTime } from "@/lib/admin/format";
import type { TalkGroup, TalkMeeting } from "@/lib/membership/talkDeadlines";
import type { AdminGuideRow } from "@/components/AdminGuideRoster";

export type CohortRosterMember = {
  person_key: string;
  group_id: string | null;
  name: string;
  display_name: string | null;
  registration_status: "joined" | "pending";
};

function Participants({ members }: { members: CohortRosterMember[] }) {
  if (!members.length) return <p className="mt-4 text-sm text-[var(--muted)]">아직 참여자가 없습니다.</p>;
  return <ul className="mt-4 divide-y divide-[var(--line)]">
    {members.map((member) => <li key={member.person_key} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0 break-words">
        <p className="font-semibold">{member.name}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">{member.display_name ? `닉네임 · ${member.display_name}` : member.registration_status === "pending" ? "회원가입 전" : "닉네임 설정 전"}</p>
      </div>
      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${member.registration_status === "joined" ? "bg-[var(--sage)]/30 text-[var(--forest)]" : "bg-[var(--sand)] text-[var(--ink)]"}`}>
        {member.registration_status === "joined" ? "가입 완료" : "가입 대기"}
      </span>
    </li>)}
  </ul>;
}

export function CohortGroupRoster({ cohort, groups, meetings, members, guides = [], guideError = false }: {
  cohort: string; groups: TalkGroup[]; meetings: TalkMeeting[]; members: CohortRosterMember[];
  guides?: AdminGuideRow[]; guideError?: boolean;
}) {
  const unassigned = members.filter((member) => !member.group_id);
  return <section className="mt-6 min-w-0" aria-label={`${cohort} 모임별 참여 명단`}>
    <h3 className="text-xl font-semibold">READ ME {cohort}</h3>
    <div className="mt-4 grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
      {groups.map((group) => {
        const guide = guides.find(item => item.group_id === group.id);
        const participants = members.filter((member) => member.group_id === group.id);
        const joined = participants.filter((member) => member.registration_status === "joined").length;
        const pending = participants.length - joined;
        const schedule = meetings.filter((meeting) => meeting.group_id === group.id).sort((a, b) => a.week_number - b.week_number);
        return <article key={group.id} className="min-w-0 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 max-[430px]:p-4">
          <header>
            <h4 className="break-words text-lg font-semibold">{group.name}</h4>
            <p className="mt-3 break-words text-sm leading-6"><span className="font-semibold">담당 가이드 :</span> {guideError ? "정보를 불러오지 못했습니다" : guide ? `${guide.name}${guide.nickname && guide.nickname !== guide.name ? ` (${guide.nickname})` : ""}` : "미배정"}</p>
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <strong className="text-[var(--forest)]">총 {joined}명</strong>
              <span className="text-[var(--muted)]">· 가입 대기 {pending}명</span>
            </p>
            <p className="mt-3 break-words text-sm"><span className="font-semibold">장소 :</span> {group.venue || "미정"}</p>
          </header>
          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <h5 className="text-sm font-semibold text-[var(--forest)]">회차 정보</h5>
            <ul className="mt-3 space-y-2 rounded-2xl bg-[var(--cream)] p-4 text-sm leading-6">
            {[1, 3, 5, 7].map((week, index) => {
              const meeting = schedule.find((item) => item.week_number === week);
              return <li key={week}>{index + 1}회차 · {meeting ? <time dateTime={meeting.starts_at}>{formatSeoulDateTime(meeting.starts_at)} ({new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", weekday: "short" }).format(new Date(meeting.starts_at))})</time> : "일정 미정"}</li>;
            })}
            </ul>
          </div>
          <div className="mt-6 border-t border-[var(--line)] pt-5">
            <h5 className="text-sm font-semibold text-[var(--forest)]">참여자 명단</h5>
            <Participants members={participants} />
          </div>
        </article>;
      })}
    </div>
    {!groups.length && <p className="mt-4 text-sm text-[var(--muted)]">등록된 모임이 없습니다.</p>}
    {unassigned.length > 0 && <article className="mt-4 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 max-[430px]:p-4">
      <h4 className="text-lg font-semibold">미배정 · {unassigned.length}명</h4>
      <p className="mt-2 text-sm text-[var(--muted)]">아직 연결된 모임이 없습니다. 아래 회원 배정에서 확인해 주세요.</p>
      <Participants members={unassigned} />
    </article>}
  </section>;
}
