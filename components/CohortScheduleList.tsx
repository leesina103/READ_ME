"use client";

import { useActionState } from "react";
import { CalendarRange, Plus, Save } from "lucide-react";
import { saveCohortScheduleAction, type CohortScheduleState } from "@/app/admin/cohorts/actions";
import { FormField, FormMessage, inputClassName } from "@/components/FormField";
import { cohortPhase, type CohortSchedule } from "@/lib/admin/cohorts";
import { formatSeoulDate, seoulDateKey } from "@/lib/admin/format";

const initialState: CohortScheduleState = { status: "idle", message: "" };

function CohortScheduleCard({ cohort, now }: { cohort?: CohortSchedule; now: number }) {
  const [state, formAction, pending] = useActionState(saveCohortScheduleAction, initialState);
  const isNew = !cohort;
  const phase = cohort ? cohortPhase(cohort, now) : null;

  return (
    <form action={formAction} className={`rounded-[28px] border bg-[var(--paper)] p-6 sm:p-7 ${isNew ? "border-dashed border-[var(--forest)]/40" : "border-[var(--line)]"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        {cohort ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">READ ME {cohort.name}</h2>
              {phase && <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${phase.className}`}>{phase.label}</span>}
              {cohort.application_open && <span className="inline-flex rounded-full bg-[var(--forest)] px-2.5 py-1 text-[11px] font-bold tracking-wide text-[var(--cream)]">신청 접수 중</span>}
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {formatSeoulDate(cohort.starts_at)} 시작{cohort.ends_at ? ` · ${formatSeoulDate(cohort.ends_at)} 종료` : " · 종료일 미정"} · 참여 회원 {cohort.member_count}명
            </p>
            <input type="hidden" name="name" value={cohort.name} />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-[var(--sage)]/60 text-[var(--forest)]"><Plus size={18} aria-hidden="true" /></span>
            <div>
              <h2 className="text-xl font-semibold">새 기수 추가</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">기수 이름과 시작일을 정하면 회원 명단과 대화방에서 바로 쓸 수 있어요.</p>
            </div>
          </div>
        )}
      </div>

      <div className={`mt-5 grid gap-4 ${isNew ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {isNew && (
          <FormField label="기수 이름" hint="예: 2기">
            <input className={inputClassName()} name="name" required pattern="\d+\s*기" placeholder="2기" autoComplete="off" />
          </FormField>
        )}
        <FormField label="시작일" hint="시작일이 지나면 회원 닉네임이 잠깁니다.">
          <input className={inputClassName()} type="date" name="startDate" required defaultValue={cohort ? seoulDateKey(cohort.starts_at) : ""} />
        </FormField>
        <FormField label="종료일" hint="비워두면 진행 중으로 봅니다. 종료일 당일까지 답변을 남길 수 있어요.">
          <input className={inputClassName()} type="date" name="endDate" defaultValue={cohort?.ends_at ? seoulDateKey(cohort.ends_at) : ""} />
        </FormField>
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm">
        <input type="checkbox" name="applicationOpen" defaultChecked={cohort?.application_open ?? false} className="mt-1 size-4 accent-[var(--forest)]" />
        <span>
          <span className="font-medium">가입 신청 접수 중</span>
          <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">체크한 기수만 가입 신청서를 받습니다. 사이트에 공개된 신청서의 기수는 코드에서 정하므로 함께 맞춰야 합니다.</span>
        </span>
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {state.message ? <FormMessage tone={state.status === "success" ? "success" : "error"}>{state.message}</FormMessage> : <span />}
        <button type="submit" disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-semibold text-[var(--cream)] disabled:cursor-not-allowed disabled:opacity-50">
          {isNew ? <Plus size={15} aria-hidden="true" /> : <Save size={15} aria-hidden="true" />} {pending ? "저장 중..." : isNew ? "기수 추가" : "일정 저장"}
        </button>
      </div>
    </form>
  );
}

export function CohortScheduleList({ cohorts, now }: { cohorts: CohortSchedule[]; now: number }) {
  return (
    <div className="grid gap-5">
      {cohorts.length === 0 && (
        <div className="flex items-center gap-4 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 text-sm text-[var(--muted)]">
          <CalendarRange className="shrink-0 text-[var(--forest)]" /> 아직 등록된 기수가 없습니다. 아래에서 첫 기수를 추가해 주세요.
        </div>
      )}
      {cohorts.map((cohort) => <CohortScheduleCard key={cohort.name} cohort={cohort} now={now} />)}
      <CohortScheduleCard now={now} />
    </div>
  );
}
