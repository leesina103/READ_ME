"use client";
import { formatSeoulDateTime, formatSeoulDayHeading, formatSeoulTime } from "@/lib/admin/format";

import { useActionState, useState } from "react";
import { manageGuide } from "@/app/admin/roles/actions";
import type { GuideOverview, GuideAudit, GuideAuditGroup } from "@/lib/guide/types";

const labels: Record<string, string> = { pending: "승인 대기", active: "가이드", rejected: "승인 거절", revoked: "역할 해제" };
function Invitation({ invitation, origin }: { invitation: GuideOverview["invitations"][number]; origin: string }) {
  const [state, action, pending] = useActionState(manageGuide, { message: "", token: undefined as string | undefined });
  const [expanded, setExpanded] = useState(false);
  return <form action={action} className="guide-divider">
    <input type="hidden" name="invitation" value={invitation.id} />
    <div className="guide-invitation-dates">
      {invitation.created_at && <span>발급: {formatSeoulDateTime(invitation.created_at)}</span>}
      <span>만료: {formatSeoulDateTime(invitation.expires_at)}</span>
    </div>
    <div className="guide-actions">
      {invitation.can_reveal && (expanded && state.token
        ? <button type="button" className="button" aria-expanded={true} onClick={() => setExpanded(false)}>링크 접기</button>
        : <button className="button" name="action" value="reveal_invite" aria-expanded={false} disabled={pending} onClick={() => setExpanded(true)}>링크 다시 보기</button>)}
      <button className="button button-secondary" name="action" value="cancel_invite" disabled={pending}>초대 취소</button>
    </div>
    {!invitation.can_reveal && <p>이전 방식으로 발급된 초대는 링크를 다시 볼 수 없어요. 원문이 없다면 취소 후 새 초대를 발급해 주세요.</p>}
    {state.message && (!state.token || expanded) && <p role="status">{state.message}</p>}
    {expanded && state.token && <label>초대 링크<input readOnly value={origin + "/guide/join/" + state.token} onFocus={e => e.target.select()} /></label>}
  </form>;
}
function AssignmentGroups({ groups }: { groups: GuideAuditGroup[] }) {
  return <ul>{groups.map(group => <li key={group.id}>
    <strong>{group.cohort} · {group.name}</strong>
    <p>{group.first_meeting_at ? "첫 모임: " + formatSeoulDayHeading(group.first_meeting_at) + " · " + formatSeoulTime(group.first_meeting_at) + "–" + formatSeoulTime(new Date(Date.parse(group.first_meeting_at) + group.duration_minutes * 60000).toISOString()) : "모임 시간 미정"}</p>
  </li>)}</ul>;
}
function AuditEntry({ entry }: { entry: GuideAudit }) {
  const labels: Record<string, string> = { invite: "초대 발급", cancel_invite: "초대 취소", approve: "가이드 지정·배정", reject: "승인 거절", revoke: "가이드 해제", save_group: "모임 수정" };
  const context = entry.context;
  return <article className="guide-divider">
    <p>{formatSeoulDateTime(entry.created_at)} · {entry.actor || "운영자"} · {labels[entry.action ?? ""] ?? entry.action}</p>
    {context?.name && <p><strong>가이드: {context.name}{context.nickname && context.nickname !== context.name ? " (" + context.nickname + ")" : ""}</strong></p>}
    {!!context?.before_groups?.length && <div><p>이전 담당 모임</p><AssignmentGroups groups={context.before_groups} /></div>}
    {!!context?.after_groups?.length && <div><p>배정한 모임</p><AssignmentGroups groups={context.after_groups} /></div>}
    {context?.historical_approx && context.name && <p className="text-xs text-[var(--muted)]">이전 기록의 이름·일정은 현재 정보를 기준으로 표시합니다.</p>}
  </article>;
}
function Person({ person, groups }: { person: GuideOverview["people"][number]; groups: GuideOverview["groups"] }) {
  const [state, action, pending] = useActionState(manageGuide, { message: "" });
  return <article className="guide-card guide-person"><header className="guide-person__header"><h3>{person.name} · {person.nickname}</h3><span className="guide-person__status">{labels[person.status ?? ""] ?? "회원"}</span></header><p className="guide-person__email">{person.email}</p>
    {!person.ready && <p className="guide-person__notice">이메일 인증 또는 닉네임 설정 대기</p>}
    <form action={action}><input type="hidden" name="user" value={person.id} />
      <fieldset disabled={pending || !person.ready}><legend>담당·참여 모임 하나 선택</legend><p className="guide-person__notice">저장하면 선택한 모임의 기수 회원으로도 자동 연결됩니다.</p><div className="guide-options">
        {groups.filter(g => !g.ended).map(g => <label key={g.id}><input type="radio" name="groups" value={g.id} defaultChecked={person.groups.includes(g.id)} disabled={Boolean(g.guide_id && g.guide_id !== person.id)} />{g.cohort} · {g.name}{g.guide_id && g.guide_id !== person.id ? " (다른 가이드 담당)" : ""}</label>)}
      </div><button className="button" name="action" value="approve">{person.status === "active" ? "담당 모임 저장" : person.status === "pending" ? "승인하고 배정" : "가이드로 지정"}</button></fieldset>
      {(person.status === "pending" || person.status === "active") && <div className="guide-actions">{person.status === "pending" && <button className="button button-secondary" name="action" value="reject" disabled={pending}>승인 거절</button>}
        {person.status === "active" && <button className="button button-secondary" name="action" value="revoke" disabled={pending} onClick={e => { if (!confirm("담당 모임 접근을 모두 해제할까요? 회원 자격과 기록은 유지됩니다.")) e.preventDefault(); }}>가이드 역할 해제</button>}</div>}
      {state.message && <p role="status">{state.message}</p>}
    </form></article>;
}
export function GuideRoleManager({ data, selectedMember, origin, initialTab }: { data: GuideOverview; selectedMember?: string; origin: string; initialTab?: "active" }) {
  const [state, action, pending] = useActionState(manageGuide, { message: "", token: undefined as string | undefined });
  const [clearState, clearAction, clearing] = useActionState(manageGuide, { message: "" });
  const selected = data.people.find(p => String(p.member_id) === selectedMember);
  const [tab, setTab] = useState(selected?.status === "active" ? "active" : selectedMember ? "members" : initialTab ?? "pending");
  const [query, setQuery] = useState("");
  const invitations = data.invitations.filter(inv => !inv.claimed && !inv.revoked && Date.parse(inv.expires_at) > Date.now());
  const completedInvitations = data.invitations.filter(inv => inv.claimed);
  const tabs = [["pending", "승인 대기"], ["active", "가이드 목록·배정"], ["members", "회원에서 지정"], ["invite", "가입 초대"]];
  const people = data.people.filter(p => tab === "members" ? p.status !== "pending" && p.status !== "active" : p.status === tab)
    .filter(p => `${p.name} ${p.email} ${p.nickname}`.includes(query))
    .sort((a, b) => Number(String(b.member_id) === selectedMember) - Number(String(a.member_id) === selectedMember));
  return <><p>가이드는 배정된 모임의 회원으로 함께 참여하고, 그 모임을 관리합니다. 가이드 역할을 해제해도 회원 자격과 기록은 유지됩니다.</p>
    <div className="guide-tabs" role="tablist" aria-label="가이드 관리">{tabs.map(([key, name]) => <button id={`tab-${key}`} aria-controls="guide-panel" role="tab" aria-selected={tab === key} key={key} onClick={() => setTab(key)}>{name}{key === "pending" ? ` ${data.people.filter(p => p.status === "pending").length}` : ""}</button>)}</div>
    <section id="guide-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === "invite" ? <div className="guide-card"><h2>이메일 없이 초대 링크 만들기</h2><p>상대방이 직접 가입 정보를 입력합니다. 승인하기 전에는 모임 정보가 열리지 않습니다. 이미 가입한 회원은 ‘회원에서 지정’을 이용하세요.</p>
        <form action={action}><button className="button" name="action" value="invite" disabled={pending}>초대 링크 만들기</button></form>
        <p role="status">{state.message}</p>
        <h3>사용 가능한 초대</h3>{invitations.length ? invitations.map(inv => <Invitation key={inv.id} invitation={inv} origin={origin} />) : <p>현재 사용 가능한 초대가 없어요.</p>}
        <section className="guide-divider" aria-label="사용 완료 초대">
          <h3>사용 완료 · {completedInvitations.length}개</h3>
          <p>초대 링크로 회원가입을 마친 기록입니다. 이메일 인증·닉네임 설정·운영자 승인은 별도로 진행됩니다.</p>
          {completedInvitations.length ? completedInvitations.map(inv => <article key={inv.id} className="guide-divider">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{inv.claimed_name || "가입자"}{inv.claimed_nickname && inv.claimed_nickname !== inv.claimed_name ? ` (${inv.claimed_nickname})` : ""}</strong>
              <span className="rounded-full bg-[var(--sage)] px-3 py-1 text-xs font-semibold text-[var(--forest)]">사용 완료</span>
            </div>
            {inv.created_at && <p>초대 발급: {formatSeoulDateTime(inv.created_at)}</p>}
          </article>) : <p>아직 사용 완료된 초대가 없어요.</p>}
        </section>
      </div> : <><label>이름·닉네임·이메일 검색<input value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="guide-grid">{people.map(p => <Person key={`${p.id}-${p.status}-${p.groups.join()}`} person={p} groups={data.groups} />)}</div>{!people.length && <p>해당하는 사람이 없습니다.</p>}</>}
    </section><details className="guide-card"><summary>최근 권한·모임 변경 기록</summary>
      <form action={clearAction}><button className="button button-secondary" name="action" value="clear_audit" disabled={clearing || !data.audit.length}>기록 비우기</button></form>
      {clearState.message && <p role="status">{clearState.message}</p>}
      {data.audit.length ? data.audit.map((entry, i) => <AuditEntry key={i} entry={entry} />) : <p>새로운 변경 기록이 없어요.</p>}
    </details>
  </>;
}
