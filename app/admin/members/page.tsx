import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UsersRound } from "lucide-react";
import { requireAdmin, supabaseNotConfiguredMessage } from "@/lib/admin/access";
import { formatSeoulDate } from "@/lib/admin/format";
import { PendingMemberDeleteButton } from "@/components/PendingMemberDeleteButton";
import { AdminGuideRoster, type AdminGuideRow } from "@/components/AdminGuideRoster";

export const metadata: Metadata = {
  title: "기수 회원 명단",
  robots: { index: false, follow: false }
};

// 가입 완료 회원은 참여한 기수마다 한 줄씩 온다. cohort와 current_cohort가 다르면 다른 기수로 옮겨간 이력 줄이다.
type MemberRow = {
  id: number;
  name: string;
  email: string;
  cohort: string;
  current_cohort: string | null;
  display_name: string | null;
  claimed_at: string | null;
  onboarding_completed_at: string | null;
  membership_status: string | null;
  is_admin: boolean | null;
};

type MemberState = { kind: "pending" | "moved" | "onboarding" | "active" | "inactive"; label: string; tone: "forest" | "sand" | "muted" };

const toneClassName: Record<MemberState["tone"], string> = {
  forest: "bg-[var(--sage)]/50 text-[var(--forest)]",
  sand: "bg-[var(--sand)]/50 text-[#8a6a2f]",
  muted: "border border-[var(--line)] text-[var(--muted)]"
};

// 명단 함수가 아직 예전 버전이면 current_cohort가 없으므로 그 줄의 기수를 현재 기수로 본다.
function currentCohortOf(member: MemberRow) {
  return member.current_cohort ?? member.cohort;
}

function memberState(member: MemberRow): MemberState {
  if (!member.claimed_at) return { kind: "pending", label: "승인됨 · 가입 대기", tone: "muted" };
  const currentCohort = currentCohortOf(member);
  if (member.cohort !== currentCohort) {
    const active = member.membership_status === "active";
    return { kind: "moved", label: active ? `현재 ${currentCohort} 참여 중` : `현재 ${currentCohort} 소속`, tone: "sand" };
  }
  if (!member.onboarding_completed_at) return { kind: "onboarding", label: "가입 완료 · 정보 작성 중", tone: "sand" };
  if (member.membership_status === "active") return { kind: "active", label: "활동 중", tone: "forest" };
  return { kind: "inactive", label: "멤버십 중지", tone: "muted" };
}

function cohortOrder(name: string) {
  return Number.parseInt(name, 10) || 0;
}

function countPeople(rows: MemberRow[]) {
  return new Set(rows.map((member) => member.id)).size;
}

// 같은 사람의 이력 줄을 하나로 합친다. 현재 기수 줄이 있으면 그 줄을 남긴다.
function onePerPerson(rows: MemberRow[]) {
  const byId = new Map<number, MemberRow>();
  rows.forEach((member) => {
    const existing = byId.get(member.id);
    if (!existing || member.cohort === currentCohortOf(member)) byId.set(member.id, member);
  });
  return Array.from(byId.values());
}

const cell = "px-3 py-2";
const head = "px-3 py-2 font-semibold";

function MemberTable({ rows, lastColumn }: { rows: MemberRow[]; lastColumn: "state" | "cohort" }) {
  return (
    <div className="overflow-x-auto">
      <table className="admin-member-table w-full min-w-[640px] text-left text-sm">
        <thead className="text-xs text-[var(--muted)]">
          <tr>
            <th className={`${head} pl-4`}>이름</th>
            <th className={head}>이메일</th>
            <th className={head}>닉네임</th>
            <th className={head}>{lastColumn === "state" ? "상태" : "소속 기수"}</th>
            <th className={`${head} pr-4`}>가입일</th>
            <th className={head}>관리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((member) => {
            const state = memberState(member);
            return (
              <tr key={`${member.id}-${member.cohort}`} className="border-t border-[var(--line)]">
                <td className={`${cell} pl-4 font-semibold`}>{member.name}</td>
                <td className={cell}><a href={`mailto:${member.email}`} className="text-[var(--forest)] underline-offset-4 hover:underline">{member.email}</a></td>
                <td className={cell}>{member.claimed_at && member.display_name ? member.display_name : <span className="text-[var(--muted)]">가입 전</span>}</td>
                <td className={cell}>
                  {lastColumn === "state"
                    ? <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${toneClassName[state.tone]}`}>{state.label}</span>
                    : <span className="text-[var(--muted)]">{currentCohortOf(member)}</span>}
                </td>
                <td className={`${cell} pr-4 text-[var(--muted)]`}>{member.claimed_at ? formatSeoulDate(member.claimed_at) : "미가입"}</td>
                <td className={cell}>
                  {!member.is_admin && state.kind === "pending" && <PendingMemberDeleteButton id={member.id} name={member.name} email={member.email} cohort={member.cohort} />}
                  {!member.is_admin && member.onboarding_completed_at && <Link className="button whitespace-nowrap" href={`/admin/roles?member=${member.id}`}>가이드 지정·관리</Link>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminMembersPage() {
  const supabase = await requireAdmin("/admin/members");
  let members: MemberRow[] = [];
  let loadError = "";
  let guides: AdminGuideRow[] = [];
  let guideError = "";

  if (!supabase) {
    loadError = supabaseNotConfiguredMessage;
  } else {
    const [{ data, error }, guideResult] = await Promise.all([
      supabase.rpc("admin_list_members"), supabase.rpc("admin_guide_member_roster")
    ]);
    if (guideResult.error) guideError = "가이드 연결 상태를 불러오지 못했습니다. 새로고침해 주세요.";
    else guides = (guideResult.data ?? []) as AdminGuideRow[];
    if (error) loadError = "회원 명단을 불러오지 못했습니다. 데이터베이스 마이그레이션 적용 여부를 확인해 주세요.";
    else members = (data ?? []) as MemberRow[];
  }

  const admins = onePerPerson(members.filter((member) => member.is_admin));
  const regularMembers = members.filter((member) => !member.is_admin);
  const cohorts = Array.from(new Set([...regularMembers.map((member) => member.cohort), ...guides.map(guide => guide.cohort)]))
    .sort((a, b) => cohortOrder(a) - cohortOrder(b) || a.localeCompare(b, "ko"));
  const peopleCount = countPeople(regularMembers);
  const activeCount = countPeople(regularMembers.filter((member) => memberState(member).kind === "active"));

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <Link href="/admin" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]">
        <ArrowLeft size={16} /> 운영자 공간으로 돌아가기
      </Link>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="eyebrow">MEMBER DIRECTORY</p>
          <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">기수 회원 명단</h1>
          <p className="mt-4 max-w-2xl text-[var(--muted)]">운영자와 가이드는 각각 따로 묶고, 회원은 참여한 기수마다 보여줍니다. 다른 기수로 옮겨간 회원은 이전 기수 목록에 현재 기수를 함께 표시합니다. 이메일을 누르면 바로 메일을 보낼 수 있습니다.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4">
          <UsersRound className="text-[var(--forest)]" size={20} />
          <span className="text-sm font-semibold">회원 {peopleCount}명 · 활동 중 {activeCount}명 · 운영자 {admins.length}명</span>
        </div>
      </div>
      <section className="mt-10 grid gap-6">
        {guideError && <p role="alert" className="rounded-2xl border border-[var(--line)] bg-[var(--sand)] p-4 text-sm">{guideError}</p>}
        {loadError ? (
          <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm leading-6 text-[var(--ink)]">{loadError}</div>
        ) : (
          <>
            {admins.length > 0 && (
              <article className="overflow-hidden rounded-[28px] border border-[var(--forest)]/40 bg-[var(--paper)]">
                <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                  <h2 className="inline-flex items-center gap-2 text-xl font-semibold"><ShieldCheck className="text-[var(--forest)]" size={20} /> 운영자</h2>
                  <span className="text-sm text-[var(--muted)]">{admins.length}명</span>
                </header>
                <MemberTable rows={admins} lastColumn="cohort" />
              </article>
            )}
            {guides.length > 0 && <AdminGuideRoster guides={guides} standalone />}
            {cohorts.length === 0 && (
              <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--muted)]">아직 승인된 회원이 없습니다.</div>
            )}
            {cohorts.map((cohort) => {
              const rows = regularMembers.filter((member) => member.cohort === cohort);
              const cohortGuides = guides.filter(guide => guide.cohort === cohort);
              const joined = rows.filter((member) => member.claimed_at);
              const pending = rows.filter((member) => !member.claimed_at);
              const states = rows.map(memberState);
              const active = states.filter((state) => state.kind === "active").length;
              const moved = states.filter((state) => state.kind === "moved").length;
              return (
                <article key={cohort} className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--paper)]">
                  <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
                    <h2 className="text-xl font-semibold">READ ME {cohort}</h2>
                    <span className="text-sm text-[var(--muted)]">{rows.length}명 · 활동 중 {active}명{moved > 0 ? ` · 다른 기수로 이동 ${moved}명` : ""}</span>
                  </header>
                  <div className="grid gap-4 bg-[var(--cream)] p-3 min-[430px]:p-4 min-[820px]:gap-5 min-[820px]:p-5">
                  {cohortGuides.length > 0 && <AdminGuideRoster guides={cohortGuides} />}
                  <section aria-label="가입 완료 명단" className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
                    <h3 className="border-b border-[var(--line)] bg-[var(--sage)]/30 px-4 py-3 font-semibold text-[var(--forest)]">가입 완료 · {joined.length}명</h3>
                    {joined.length > 0 ? (
                      <MemberTable rows={joined} lastColumn="state" />
                    ) : (
                      <p className="px-4 pb-3 text-sm text-[var(--muted)]">아직 가입을 완료한 회원이 없습니다.</p>
                    )}
                  </section>
                  {pending.length > 0 && (
                    <section aria-label="가입 대기 명단" className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--paper)]">
                      <h3 className="border-b border-[var(--line)] bg-[var(--sand)]/40 px-4 py-3 font-semibold">가입 대기 · {pending.length}명</h3>
                      <MemberTable rows={pending} lastColumn="state" />
                    </section>
                  )}
                  </div>
                </article>
              );
            })}
          </>
        )}
      </section>
    </main>
  );
}
