"use client";

import { useActionState, useState, type ReactNode } from "react";
import { manageTalkGroup } from "@/app/admin/cohorts/group-actions";
import type { TalkFormState } from "@/lib/membership/talkDeadlines";
import { inputClassName } from "@/components/FormField";
import { deadlineText, parseSeoulInput, seoulInput, talkDueAt, type TalkGroup, type TalkMeeting, type TalkMember } from "@/lib/membership/talkDeadlines";

const initial: TalkFormState = { status: "idle", message: "" };
const weeks = [1, 3, 5, 7];

function GroupForm({ cohort, operation, groupId = "", children, label, compact = false, disabled = false }: {
  cohort: string; operation: string; groupId?: string; children?: ReactNode; label: string; compact?: boolean; disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(manageTalkGroup, initial);
  return <form action={action} onSubmit={(event) => {
    if (operation === "delete" && !window.confirm("이 그룹과 등록된 모임 일정을 삭제할까요? 삭제한 일정은 복구할 수 없으며, 작성된 답변은 유지됩니다.")) event.preventDefault();
  }} className="grid min-w-0 gap-3">
    <input type="hidden" name="cohort" value={cohort} />
    <input type="hidden" name="operation" value={operation} />
    {operation !== "assign" && <input type="hidden" name="groupId" value={groupId} />}
    {children}
    <button className={compact ? "min-h-11 rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-40" : "button button--primary justify-self-start disabled:opacity-50 max-[430px]:w-full"} disabled={pending || disabled} title={disabled ? "회원을 다른 그룹으로 옮긴 뒤 삭제해주세요." : undefined}>{pending ? "처리 중..." : label}</button>
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="text-sm leading-6">{state.message}</p>}
  </form>;
}

function GroupSchedule({ group, meetings }: { group: TalkGroup; meetings: TalkMeeting[] }) {
  const [dates, setDates] = useState(() => weeks.map((week) => {
    const meeting = meetings.find((item) => item.group_id === group.id && item.week_number === week);
    return meeting ? seoulInput(meeting.starts_at) : "";
  }));
  function repeatFirst() {
    const first = parseSeoulInput(dates[0]);
    if (!first) return;
    setDates(weeks.map((_, index) => seoulInput(new Date(Date.parse(first) + index * 14 * 86_400_000).toISOString())));
  }
  return <GroupForm cohort={group.cohort} operation="schedule" groupId={group.id} label="모임 일정 저장">
    <div className="grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">
      {weeks.map((week, index) => {
        const meeting = parseSeoulInput(dates[index]);
        const due = talkDueAt(week, meeting);
        const outputDue = talkDueAt(week + 1, meeting);
        return <label key={week} className="min-w-0 text-sm font-medium">{week}주차 모임 · 한국 시간
          <input type="datetime-local" name={`week${week}`} required className={`${inputClassName()} min-w-0 max-w-full`} value={dates[index]}
            onChange={(event) => setDates((previous) => previous.map((value, i) => i === index ? event.target.value : value))} />
          <span className="mt-2 block text-xs font-normal leading-5 text-[var(--muted)]">{due ? `사전 질문: ${deadlineText(due)}` : "모임일을 정하면 작성 날짜가 표시됩니다."}</span>
          {outputDue && <span className="mt-1 block text-xs font-normal leading-5 text-[var(--muted)]">{week + 1}주차 실천 기록: {deadlineText(outputDue)}</span>}
        </label>;
      })}
    </div>
    <button type="button" className="min-h-11 justify-self-start text-sm font-semibold text-[var(--forest)] underline underline-offset-4" onClick={repeatFirst} disabled={!parseSeoulInput(dates[0])}>1주차 기준으로 2주 간격 채우기</button>
    <p className="text-xs leading-6 text-[var(--muted)]">자동으로 채운 뒤 특정 주차만 바꿀 수 있어요. 1주차 사전 질문은 기수 시작일, 3·5·7주차는 모임 7일 전에 열립니다. 실천 기록은 모임 다음 날 0시에 열립니다.</p>
  </GroupForm>;
}

export function TalkGroupManager({ cohort, groups, meetings, members, ended }: {
  cohort: string; groups: TalkGroup[]; meetings: TalkMeeting[]; members: TalkMember[]; ended: boolean;
}) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  return <section className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 max-[430px]:p-4">
    <h3 className="text-xl font-semibold">{cohort} 그룹과 작성 일정</h3>
    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">신청한 일정에 맞춰 4~6명씩 배정해주세요. 사전 질문은 모임 2일 전, 실천 기록은 모임 다음 주 일요일 밤 11:59까지 안내합니다. 그룹 이름은 운영자 화면에서만 표시합니다.</p>
    {ended ? <p className="mt-5 text-sm text-[var(--muted)]">종료된 기수의 그룹 배정과 일정은 변경할 수 없어요.</p> : <>
      <details className="mt-6 border-t border-[var(--line)] pt-5">
        <summary className="min-h-11 cursor-pointer font-semibold">+ 그룹 추가</summary>
        <GroupForm cohort={cohort} operation="create" label="그룹 만들기">
          <label className="text-sm">새 그룹 이름<input name="name" maxLength={40} required placeholder="예: 토요일 오후 그룹" className={inputClassName()} /></label>
        </GroupForm>
      </details>
      <details className="mt-7">
        <summary className="min-h-11 cursor-pointer font-semibold">회원 배정 · 미배정 {members.filter((member) => !member.group_id).length}명</summary>
        {members.length === 0 && <p className="mt-3 text-sm text-[var(--muted)]">가입을 완료한 현재 기수 회원이 없습니다.</p>}
        <div className="mt-4 grid grid-cols-2 gap-4 max-[820px]:grid-cols-1">{members.map((member) => <div key={member.user_id} className="min-w-0 rounded-2xl border border-[var(--line)] p-4">
          <GroupForm cohort={cohort} operation="assign" label="배정 저장">
            <input type="hidden" name="userId" value={member.user_id} />
            <p className="font-semibold">{member.display_name}</p>
            <label className="text-sm">배정 그룹<select name="groupId" className={inputClassName()} defaultValue={member.group_id ?? ""} key={member.group_id ?? "unassigned"}>
              <option value="">미배정</option>
              {groups.map((group) => <option value={group.id} key={group.id}>{group.name} ({members.filter((item) => item.group_id === group.id).length}/6명)</option>)}
            </select></label>
          </GroupForm>
        </div>)}</div>
      </details>
    </>}
    {groups.map((group) => {
      const memberCount = members.filter((member) => member.group_id === group.id).length;
      const expanded = Boolean(expandedGroups[group.id]);
      return <div key={group.id} className="mt-5 border-t border-[var(--line)] pt-5">
        <div className="flex items-start justify-between gap-3">
          <button type="button" aria-expanded={expanded} aria-controls={`group-panel-${group.id}`} className="min-h-11 min-w-0 flex-1 break-words text-left font-semibold" onClick={() => setExpandedGroups((previous) => ({ ...previous, [group.id]: !previous[group.id] }))}>
            <span aria-hidden="true">{expanded ? "▾" : "▸"} </span>{group.name} · {memberCount}/6명
          </button>
          {!ended && <div className="max-w-[45%] shrink-0"><GroupForm cohort={cohort} operation="delete" groupId={group.id} label="삭제" compact disabled={memberCount > 0} /></div>}
        </div>
        <div id={`group-panel-${group.id}`} hidden={!expanded}>
        {!ended && <div className="mt-4 grid gap-6">
          <GroupForm cohort={cohort} operation="rename" groupId={group.id} label="그룹 이름 저장">
            <label className="text-sm">그룹 이름<input key={group.name} name="name" defaultValue={group.name} required maxLength={40} className={inputClassName()} /></label>
          </GroupForm>
          <GroupSchedule key={JSON.stringify(meetings.filter((item) => item.group_id === group.id))} group={group} meetings={meetings} />
          {memberCount > 0 && <p className="text-sm leading-6 text-[var(--muted)]">그룹을 삭제하려면 회원 배정에서 모든 회원을 다른 그룹으로 옮겨주세요.</p>}
        </div>}
        </div>
      </div>;
    })}
  </section>;
}
