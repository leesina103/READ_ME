import Link from "next/link";
import { guideSession } from "@/lib/guide/access";
import { GuideShell } from "@/components/GuideShell";
import { logoutAction } from "@/app/auth/actions";
import type { GuideGroup } from "@/lib/guide/types";
import { formatSeoulDateTime } from "@/lib/admin/format";
export const metadata = { title: "가이드 모임 관리", robots: { index: false, follow: false } };
export default async function GuidePage() {
  const { supabase, status, isMember, isAdmin } = await guideSession(false);
  const allowed = isAdmin || status === "active";
  const result = allowed ? await supabase.rpc("guide_groups") : null;
  return <GuideShell title={isAdmin ? "가이드 모임 관리 · 운영자" : "가이드 모임 관리"} back={isAdmin ? "/admin" : isMember ? "/my" : "/"} backLabel={isAdmin ? "운영자 공간" : isMember ? "나의 서재" : "READ ME 홈"}>
    {allowed ? <><p>{isAdmin ? "운영자는 전체 모임의 명단·공개된 답변을 확인하고 모임 안내를 수정할 수 있습니다." : "담당 모임의 명단과 공개된 주차 답변을 확인하고 모임 안내를 수정할 수 있습니다."}</p><div className="guide-actions"><Link className="button" href="/guide/resources">가이드 자료 보기</Link><Link className="button button-secondary" href="/membership">회원 공간으로 가기</Link></div>
      {result?.error ? <p>모임을 불러오지 못했습니다. 새로고침해 주세요.</p> : <div className="guide-grid">{(result?.data as GuideGroup[] ?? []).map(g => <Link className="guide-card" key={g.id} href={`/guide/groups/${g.id}`} aria-label={`${g.cohort} ${g.name} 모임 관리${g.ended ? " · 종료, 읽기 전용" : ""}`}><h2>{g.cohort} · {g.name}</h2><div><p>1주차: {g.first_meeting_at ? formatSeoulDateTime(g.first_meeting_at) : "일정 미정"}</p><p>장소: {g.venue || "미정"}</p></div><p>{g.ended ? "종료 · 읽기 전용" : "모임 관리 →"}</p></Link>)}</div>}
      {!result?.error && !result?.data?.length && <p>{isAdmin ? "등록된 모임이 없습니다." : "담당 모임이 없습니다. 운영자에게 배정을 요청해 주세요."}</p>}</> : <div className="guide-card"><h2>{status === "pending" ? "가이드 승인 대기 중입니다" : status === "rejected" ? "가이드 승인이 거절되었습니다" : status === "revoked" ? "가이드 역할이 해제되었습니다" : "가이드로 지정되지 않았습니다"}</h2><p>{status === "pending" ? "운영자가 이름·이메일·닉네임을 확인하고 담당 모임을 배정하면 이 화면에서 확인할 수 있습니다." : "가이드 역할이 필요하면 운영자에게 문의해 주세요."}</p><Link className="button button-secondary" href="/guide">상태 새로 확인</Link></div>}
    <form action={logoutAction}><button className="button button-secondary">로그아웃</button></form>
  </GuideShell>;
}
