import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarRange, CalendarClock, UsersRound } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";
import { CohortScheduleList } from "@/components/CohortScheduleList";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { cohortPhase, type CohortSchedule } from "@/lib/admin/cohorts";
import { TalkGroupManager } from "@/components/TalkGroupManager";
import { CohortGroupRoster, type CohortRosterMember } from "@/components/CohortGroupRoster";
import type { TalkGroup, TalkMeeting, TalkMember } from "@/lib/membership/talkDeadlines";
import type { AdminGuideRow } from "@/components/AdminGuideRoster";

export const metadata: Metadata = {
  title: "기수 일정 관리",
  robots: { index: false, follow: false }
};

export default async function AdminCohortsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const activeTab = tab === "groups" || tab === "roster" ? tab : "cohorts";
  const supabase = await requireAdmin(`/admin/cohorts?tab=${activeTab}`);
  let cohorts: CohortSchedule[] = [];
  let loadError = "";

  if (!supabase) {
    loadError = supabaseNotConfiguredMessage;
  } else {
    const { data, error } = await supabase.rpc("admin_list_cohorts");
    if (error) loadError = "기수 목록을 불러오지 못했습니다. 데이터베이스 마이그레이션 적용 여부를 확인해 주세요.";
    else cohorts = (data ?? []) as CohortSchedule[];
  }

  const now = Date.now();
  const guideRequest = activeTab === "roster" && supabase ? supabase.rpc("admin_guide_member_roster") : null;
  const ongoingCount = cohorts.filter((cohort) => cohortPhase(cohort, now).label === "진행 중").length;
  const groupData = await Promise.all((activeTab === "cohorts" ? [] : cohorts).map(async (cohort) => {
    if (!supabase) return null;
    const [groups, meetings, members, capacity, roster] = await Promise.all([
      supabase.from("talk_groups").select("id, cohort, name, host_name, host_style, venue, duration_minutes, application_open").eq("cohort", cohort.name).order("name"),
      supabase.from("talk_meetings").select("group_id, week_number, starts_at"),
      supabase.rpc("admin_talk_members", { p_cohort: cohort.name }),
      supabase.rpc("admin_talk_group_capacity", { p_cohort: cohort.name }),
      supabase.rpc("admin_cohort_roster", { p_cohort: cohort.name })
    ]);
    const reserved = new Map<string, number>((capacity.data ?? []).map((item: { group_id: string; reserved_count: number }) => [item.group_id, item.reserved_count]));
    return { cohort, rosterError: Boolean(groups.error || meetings.error || roster.error), roster: (roster.data ?? []) as CohortRosterMember[], error: Boolean(groups.error || meetings.error || members.error || capacity.error), groups: (groups.data ?? []).map((group) => ({ ...group, reserved_count: reserved.get(group.id) ?? 0 })) as TalkGroup[], meetings: (meetings.data ?? []) as TalkMeeting[], members: (members.data ?? []) as TalkMember[] };
  }));
  const guideResult = await guideRequest;
  const guides = (guideResult?.data ?? []) as AdminGuideRow[];

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={16} /> 운영자 공간으로 돌아가기
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">COHORT SCHEDULE</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">기수 일정 관리</h1>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">기수의 시작일과 종료일, 가입 신청 접수 여부를 관리합니다. 종료일이 지난 기수의 온라인 대화방은 읽기만 가능해지고, 새 기수를 추가하면 승인·회원 명단·대화방에서 바로 쓸 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4">
          <CalendarRange className="text-[var(--forest)]" size={20} />
          <span className="text-sm font-semibold">기수 {cohorts.length}개 · 진행 중 {ongoingCount}개</span>
        </div>
      </div>
      <div className="mt-8">
        <CategoryTabs ariaLabel="기수 관리 메뉴" activeKey={activeTab} tabs={[
          { key: "cohorts", label: "기수 관리", icon: CalendarRange, href: "/admin/cohorts?tab=cohorts" },
          { key: "groups", label: "모임·일정 관리", icon: CalendarClock, href: "/admin/cohorts?tab=groups" },
          { key: "roster", label: "모임별 명단", icon: UsersRound, href: "/admin/cohorts?tab=roster" }
        ]} />
      </div>
      {loadError && <p role="alert" className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm leading-6">{loadError}</p>}
      {!loadError && activeTab === "roster" && <section className="mt-8" aria-labelledby="cohort-roster-title">
        <h2 id="cohort-roster-title" className="text-2xl font-semibold">모임별 참여 명단</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">모임별 일정과 참여자를 확인하세요. 시간은 한국 기준이며, 가입 대기는 승인 후 아직 계정을 만들지 않은 참여자입니다.</p>
        {groupData.map((item) => item && (item.rosterError
          ? <p key={item.cohort.name} role="alert" className="mt-5 rounded-2xl border border-[var(--line)] p-5 text-sm">{item.cohort.name} 참여 명단을 불러오지 못했습니다. 새로고침 후 다시 확인해 주세요.</p>
          : <CohortGroupRoster key={item.cohort.name} cohort={item.cohort.name} groups={item.groups} meetings={item.meetings} members={item.roster} guides={guides} guideError={Boolean(guideResult?.error)} />))}
        {cohorts.length === 0 && <p className="mt-5 text-sm text-[var(--muted)]">등록된 기수가 없습니다.</p>}
      </section>}
      {!loadError && activeTab === "cohorts" && <section className="mt-8" aria-label="기수 관리">
        <h2 className="mb-5 text-2xl font-semibold">기수 일정·신청 접수 설정</h2>
        <CohortScheduleList cohorts={cohorts} now={now} />
      </section>}
      {!loadError && activeTab === "groups" && <section className="mt-8" aria-label="그룹과 작성 일정 관리">
        <h2 className="text-2xl font-semibold">그룹과 작성 일정 관리</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">작성 안내는 멤버십 홈과 온라인 대화 목록에 표시됩니다. 작성일 당일 오전 9시부터 미작성자에게 보이며 답변을 저장하면 사라집니다.</p>
        {cohorts.length === 0 && <p className="mt-5 text-sm text-[var(--muted)]">기수 관리 탭에서 먼저 기수를 추가해 주세요.</p>}
        {groupData.map((item) => item && (item.error
          ? <p key={item.cohort.name} role="alert" className="mt-5 rounded-2xl border border-[var(--line)] p-5 text-sm">{item.cohort.name} 그룹 정보를 불러오지 못했습니다. 그룹 일정 마이그레이션 적용 여부를 확인해주세요.</p>
          : <TalkGroupManager key={item.cohort.name} cohort={item.cohort.name} ended={Boolean(item.cohort.ends_at && Date.parse(item.cohort.ends_at) <= now)} groups={item.groups} meetings={item.meetings} members={item.members} />))}
      </section>}
    </main>
  );
}
