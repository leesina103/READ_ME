import Link from "next/link";
import { BookOpenCheck, Footprints } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { ActivityCard, ActivityDataError } from "@/components/activities/ActivityContent";
import { ActivityProposalForm } from "@/components/activities/ActivityForms";
import { requireActiveMembership } from "@/lib/membership/access";
import { createClient } from "@/lib/supabase/server";
import { registrationLabel, type Activity, type ActivityRegistration } from "@/lib/membership/activities";

export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const member = await requireActiveMembership();
  const activeTab = (await searchParams).tab === "gatherings" ? "gatherings" : "book-club";
  const db = await createClient();
  const [activitiesResult, mineResult] = await Promise.all([
    db.from("activities").select("*").neq("status", "draft").order("starts_at", { ascending: false }),
    db.from("activity_registrations").select("*").eq("user_id", member.user.id).order("created_at", { ascending: false })
  ]);
  const activities = (activitiesResult.data ?? []) as Activity[];
  const mine = (mineResult.data ?? []) as ActivityRegistration[];
  const now = Date.now();
  const upcoming = activities.filter(a => a.kind === activeTab && new Date(a.starts_at).getTime() > now && a.status !== "cancelled").sort((a,b) => a.starts_at.localeCompare(b.starts_at));
  const past = activities.filter(a => a.kind === activeTab && (new Date(a.starts_at).getTime() <= now || a.status === "cancelled"));
  return <main className="activity-page">
    <p className="eyebrow">MEMBERSHIP ACTIVITIES</p><h1>책 밖에서도 이어지는 만남</h1>
    <p className="activity-lead">발제문과 함께 깊이 읽는 북토의, 산책·영화·전시로 만나는 소모임. 가이드가 준비한 모임에 참여해 보세요.</p>
    {member.user.app_metadata?.role === "admin" && <div className="activity-row"><Link href="/admin/activities" className="button button--ghost">모임 운영 관리</Link></div>}
    <section className="activity-section" aria-labelledby="my-activities"><h2 id="my-activities">내 신청</h2>
      {mineResult.error ? <ActivityDataError /> : mine.length ? <div className="activity-stack">{mine.map(r => <Link key={r.id} className="activity-card activity-row" href={`/membership/activities/${r.activity_id}`}><span>{activities.find(a => a.id === r.activity_id)?.title ?? "모임 상세 확인"}</span><span className="activity-badge">{registrationLabel[r.status]}</span></Link>)}</div> : <p>아직 신청한 모임이 없어요.</p>}
    </section>
    <section className="activity-section" aria-label="모임 목록">
      <CategoryTabs ariaLabel="멤버 활동 분류" activeKey={activeTab} tabs={[{ key: "book-club", label: "북토의", icon: BookOpenCheck, href: "/membership/activities?tab=book-club" }, { key: "gatherings", label: "소모임", icon: Footprints, href: "/membership/activities?tab=gatherings" }]} />
      {activitiesResult.error ? <ActivityDataError /> : <><div className="activity-grid">{upcoming.map(a => <ActivityCard key={a.id} activity={a} now={now} />)}</div>{!upcoming.length && <p className="activity-card">예정된 {activeTab === "book-club" ? "북토의" : "소모임"}가 없어요. 원하는 모임을 제안해 주세요.</p>}{past.length > 0 && <details className="activity-section"><summary>지난 모임·취소된 모임 ({past.length})</summary><div className="activity-grid">{past.map(a => <ActivityCard key={a.id} activity={a} now={now} />)}</div></details>}</>}
    </section>
    <section id="propose" className="activity-card activity-section"><h2>이런 모임 하고 싶어요</h2><p>함께하고 싶은 모임을 자유롭게 알려 주세요. 제안만으로 모임이 개설되거나 참가비가 발생하지는 않아요.</p><ActivityProposalForm />
    </section>
  </main>;
}
