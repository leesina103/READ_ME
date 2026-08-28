"use client";

import { useActionState } from "react";
import { Check, X } from "lucide-react";
import {
  archiveMembershipApplicationAction,
  reviewMembershipApplicationAction,
  type ApplicationReviewState
} from "@/app/admin/applications/actions";

export type MembershipApplication = {
  id: number;
  name: string;
  email: string;
  cohort: string;
  message: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  created_at: string;
  reviewed_at: string | null;
};

const initialState: ApplicationReviewState = { status: "idle", message: "" };

const statusLabel = {
  pending: "검토 대기",
  approved: "승인",
  rejected: "거절"
} as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function ApplicationReviewCard({ application }: { application: MembershipApplication }) {
  const [state, formAction, pending] = useActionState(reviewMembershipApplicationAction, initialState);
  const [archiveState, archiveAction, archivePending] = useActionState(archiveMembershipApplicationAction, initialState);
  const reviewed = application.status !== "pending" || state.status === "success";

  return (
    <article className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold">{application.name}</h2>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold text-[var(--forest)]">
              {statusLabel[application.status]}
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--muted)]">{application.email} · READ ME {application.cohort}</p>
        </div>
        <div className="flex items-center gap-3">
          <time className="text-xs text-[var(--muted)]" dateTime={application.created_at}>{formatDate(application.created_at)}</time>
          {application.status !== "pending" && (
            <form action={archiveAction}>
              <input type="hidden" name="applicationId" value={application.id} />
              <button
                type="submit"
                disabled={archivePending}
                aria-label={`${application.name} 신청 카드 닫기`}
                title="목록에서 닫기"
                className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition hover:border-[var(--forest)] hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-[var(--cream)] px-5 py-4">
        <span className="text-xs font-semibold text-[var(--forest)]">신청자가 남긴 말</span>
        <p className="mt-2 whitespace-pre-line text-sm leading-7 text-[var(--muted)]">
          {application.message || "남긴 말이 없습니다."}
        </p>
      </div>
      {reviewed ? (
        <div className="mt-5 border-t border-[var(--line)] pt-5 text-sm leading-6 text-[var(--muted)]">
          <p>{application.admin_note || state.message || "관리자 메모가 없습니다."}</p>
          {application.reviewed_at && <time className="mt-2 block text-xs" dateTime={application.reviewed_at}>처리: {formatDate(application.reviewed_at)}</time>}
          {archiveState.status === "error" && <p role="status" className="mt-3 text-[var(--ink)]">{archiveState.message}</p>}
        </div>
      ) : (
        <form action={formAction} className="mt-5 border-t border-[var(--line)] pt-5">
          <input type="hidden" name="applicationId" value={application.id} />
          <label className="block text-sm font-medium">
            관리자 메모 <span className="font-normal text-[var(--muted)]">(선택)</span>
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-2xl border border-[var(--line)] bg-[var(--cream)] px-4 py-3 leading-7 outline-none focus:border-[var(--forest)]"
              name="adminNote"
              maxLength={1000}
              placeholder="승인 또는 거절 사유를 남겨두세요."
            />
          </label>
          {state.message && <p role="status" className="mt-3 text-sm text-[var(--ink)]">{state.message}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="submit"
              name="decision"
              value="approved"
              disabled={pending}
              className="button button--primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check size={16} /> {pending ? "처리 중..." : "승인하고 가입 허용"}
            </button>
            <button
              type="submit"
              name="decision"
              value="rejected"
              disabled={pending}
              className="button button--ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X size={16} /> 거절
            </button>
          </div>
        </form>
      )}
    </article>
  );
}

export function ApplicationReviewList({ applications }: { applications: MembershipApplication[] }) {
  if (applications.length === 0) {
    return (
      <div className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8 text-center text-sm text-[var(--muted)]">
        아직 접수된 가입 신청이 없습니다.
      </div>
    );
  }

  return <div className="grid gap-4">{applications.map((application) => <ApplicationReviewCard key={application.id} application={application} />)}</div>;
}
