import { formatSeoulDateTime } from "@/lib/admin/format";
import Link from "next/link";
import { notFound } from "next/navigation";
import { guideSession } from "@/lib/guide/access";
import type { GuideDetail, GuideDetails } from "@/lib/guide/types";
import { GuideShell } from "@/components/GuideShell";
import { GuideGroupEditor } from "@/components/GuideGroupEditor";
export const metadata = { title: "담당 모임 관리", robots: { index: false, follow: false } };
export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await guideSession(); const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data, error } = await supabase.rpc("guide_group_detail", { p_group: id });
  if (error || !data) notFound();
  const g = data as GuideDetail;
  const initial: GuideDetails = { host_name: g.host_name, host_style: g.host_style, venue: g.venue, duration_minutes: g.duration_minutes, meetings: g.meetings };
  return <GuideShell title={`${g.cohort} · ${g.name}`}><section className="guide-card"><h2>모임 정보</h2><p>장소: {g.venue || "미정"}</p>
    <div className="guide-divider"><h3>회차 정보</h3>{g.meetings.map((m,i) => <p key={m.week_number}>{i+1}회차 · {formatSeoulDateTime(m.starts_at)}</p>)}</div>
    <section className="guide-roster" aria-labelledby="guide-roster-title">
      <header><h2 id="guide-roster-title">담당 모임 명단</h2><p>총 {g.members.length}명 · 가입 대기 {g.pending}명</p></header>
      {g.members.map((m,i) => <div className="guide-roster__member" key={i}><strong>{m.name}</strong><p>닉네임 · {m.nickname}</p></div>)}{!g.members.length && <p>가입을 마친 참여자가 없습니다.</p>}
      <Link className="button" href={`/guide/groups/${id}/answers`}>공개된 주차 답변 보기</Link>
    </section></section>
    <GuideGroupEditor key={JSON.stringify(initial)} id={id} initial={initial} ended={g.ended} />
    <details className="guide-card"><summary>최근 모임 변경 기록</summary>{g.audit.map((a,i) => <div className="guide-divider" key={i}><p>{formatSeoulDateTime(a.created_at)} · {a.actor}</p><p>장소: {a.before_value?.venue} → {a.after_value?.venue}</p><p>소요 시간: {a.before_value?.duration_minutes}분 → {a.after_value?.duration_minutes}분</p>{a.after_value?.meetings.map((m,j) => <p key={m.week_number}>{j+1}회차: {a.before_value?.meetings.find(x=>x.week_number===m.week_number)?.starts_at ? formatSeoulDateTime(a.before_value.meetings.find(x=>x.week_number===m.week_number)!.starts_at) : "미정"} → {formatSeoulDateTime(m.starts_at)}</p>)}</div>)}</details>
  </GuideShell>;
}
