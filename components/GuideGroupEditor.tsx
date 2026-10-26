"use client";
import { formatSeoulDateTime } from "@/lib/admin/format";

import { useActionState, useState } from "react";
import { saveGuideGroup } from "@/app/guide/groups/actions";
import type { GuideDetails } from "@/lib/guide/types";

function localTime(iso: string) { return new Date(new Date(iso).getTime() + 9 * 3600000).toISOString().slice(0, 16); }
function show(value: string) { return formatSeoulDateTime(value); }
export function GuideGroupEditor({ id, initial, ended }: { id: string; initial: GuideDetails; ended: boolean }) {
  const [state, action, pending] = useActionState(saveGuideGroup, { message: "" });
  const [draft, setDraft] = useState(initial);
  const [review, setReview] = useState(false);
  const fields = [["host_name", "가이드 이름", 80], ["host_style", "가이드 소개", 600], ["venue", "장소", 200]] as const;
  const changes = fields.filter(([key]) => draft[key] !== initial[key]).map(([key, label]) => `${label}: ${initial[key] || "미입력"} → ${draft[key]}`);
  if (draft.duration_minutes !== initial.duration_minutes) changes.push(`소요 시간: ${initial.duration_minutes}분 → ${draft.duration_minutes}분`);
  draft.meetings.forEach((m, index) => { const old = initial.meetings.find(x => x.week_number === m.week_number); if (old?.starts_at !== m.starts_at) changes.push(`${index + 1}회차: ${old ? show(old.starts_at) : "미정"} → ${show(m.starts_at)}`); });
  return <section className="guide-card"><h2>모임 안내·일정 수정</h2><p>한국 시간 기준입니다. 지난 회차는 수정할 수 없으며, 일정 변경 시 주차별 질문의 공개 시각과 마감도 함께 바뀝니다.</p>
    {ended && <p>종료된 기수는 읽기 전용입니다.</p>}
    <form action={action} onChange={() => setReview(false)}>
      <input type="hidden" name="group" value={id} /><input type="hidden" name="before" value={JSON.stringify(initial)} /><input type="hidden" name="details" value={JSON.stringify(draft)} />
      <fieldset disabled={ended || pending}>
        {fields.map(([key, label, max]) => <label key={key}>{label}<input required maxLength={max} value={draft[key]} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}
        <label>소요 시간 (분)<input required type="number" min={30} max={480} value={draft.duration_minutes} onChange={e => setDraft({ ...draft, duration_minutes: Number(e.target.value) })} /></label>
        {[1,3,5,7].map((week, index) => { const meeting = draft.meetings.find(m => m.week_number === week); const old = initial.meetings.find(m => m.week_number === week); return <label key={week}>{index + 1}회차<input type="datetime-local" required value={meeting ? localTime(meeting.starts_at) : ""} disabled={Boolean(old && new Date(old.starts_at).getTime() <= Date.now())} onChange={e => { if (!e.target.value) return; const starts_at = new Date(`${e.target.value}:00+09:00`).toISOString(); setDraft({ ...draft, meetings: [...draft.meetings.filter(m => m.week_number !== week), { week_number: week, starts_at }].sort((a,b) => a.week_number-b.week_number) }); }} /></label>; })}
        {!review ? <button type="button" className="button" disabled={!changes.length || draft.meetings.length !== 4} onClick={() => setReview(true)}>변경 내용 확인</button> : <div className="guide-divider"><h3>저장할 변경 내용</h3><ul>{changes.map(c => <li key={c}>{c}</li>)}</ul><p>저장 후 일정·장소 변경은 참여자에게 직접 안내해 주세요. 안내 문자가 자동으로 발송되지는 않습니다.</p><button className="button" disabled={pending}>확인하고 저장</button></div>}
      </fieldset><p role="status">{state.message}</p>
    </form>
  </section>;
}
