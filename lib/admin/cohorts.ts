export type CohortSchedule = {
  name: string;
  starts_at: string;
  ends_at: string | null;
  application_open: boolean;
  member_count: number;
};

export type CohortPhase = { label: "마무리" | "시작 전" | "진행 중"; className: string };

// 종료일이 지났으면 마무리, 시작 전이면 시작 전, 나머지는 진행 중.
export function cohortPhase(cohort: CohortSchedule, now: number): CohortPhase {
  const startsAt = Date.parse(cohort.starts_at);
  const endsAt = cohort.ends_at ? Date.parse(cohort.ends_at) : null;
  if (endsAt !== null && endsAt <= now) return { label: "마무리", className: "border border-[var(--line)] text-[var(--muted)]" };
  if (startsAt > now) return { label: "시작 전", className: "bg-[var(--sand)]/50 text-[#8a6a2f]" };
  return { label: "진행 중", className: "bg-[var(--sage)]/50 text-[var(--forest)]" };
}
