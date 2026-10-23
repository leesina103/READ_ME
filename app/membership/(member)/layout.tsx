import type { ReactNode } from "react";
import { MembershipNav } from "@/components/MembershipNav";
import { requireActiveMembership } from "@/lib/membership/access";
import { selectMembershipCohort } from "@/app/membership/scope-actions";
import Link from "next/link";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const member = await requireActiveMembership();
  return <><MembershipNav cohortNumber={member.cohortNumber} />{member.role !== "member" && <section className="membership-scope" aria-label="기수 선택과 모임 관리">
    <div className="membership-scope__header">
      <span className="membership-scope__role">{member.role === "admin" ? "운영자" : "가이드"}</span>
      <div className="membership-scope__links">
        <Link className="button button--ghost" href="/guide">모임 관리 <span aria-hidden="true">→</span></Link>
        {member.role === "admin" && <Link className="button button--ghost" href="/admin">운영자 공간</Link>}
      </div>
    </div>
    {member.selectableCohorts.length > 0 && <form action={selectMembershipCohort} className="membership-scope__form">
      <label htmlFor="membership-cohort">보고 있는 기수</label>
      <div className="membership-scope__controls">
        <select id="membership-cohort" key={member.cohort} name="cohort" defaultValue={member.cohort ?? member.selectableCohorts[0]}>{member.selectableCohorts.map(c => <option key={c} value={c}>{c}{c === member.ownCohort ? " · 내 참여 기수" : ""}</option>)}</select>
        <button className="button" type="submit">기수 전환</button>
      </div>
    </form>}
  </section>}{children}</>;
}
