import type { ReactNode } from "react";
import { MembershipNav } from "@/components/MembershipNav";
import { requireActiveMembership } from "@/lib/membership/access";
import { selectMembershipCohort } from "@/app/membership/scope-actions";
import Link from "next/link";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const member = await requireActiveMembership();
  return <><MembershipNav cohortNumber={member.cohortNumber} />{member.role !== "member" && <form action={selectMembershipCohort} className="membership-scope">
    <span>{member.role === "admin" ? "운영자 · 전체 기수" : "가이드 · 담당 기수"}</span>
    {member.selectableCohorts.length > 0 && <><label>조회 기수 <select key={member.cohort} name="cohort" defaultValue={member.cohort ?? member.selectableCohorts[0]}>{member.selectableCohorts.map(c => <option key={c} value={c}>{c}{c === member.ownCohort ? " · 내 참여 기수" : ""}</option>)}</select></label><button>기수 보기</button></>}
    <Link href="/guide">가이드 모임 관리</Link>{member.role === "admin" && <Link href="/admin">운영자 공간</Link>}
  </form>}{children}</>;
}
