"use client";

import { useId, useRef, useState, useTransition } from "react";
import { deletePendingMemberAction } from "@/app/admin/members/actions";

export function PendingMemberDeleteButton({ id, name, email, cohort }: { id: number; name: string; email: string; cohort: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function remove() {
    setError("");
    const data = new FormData();
    data.set("invitationId", String(id));
    data.set("email", email);
    data.set("cohort", cohort);
    startTransition(async () => {
      try {
        const result = await deletePendingMemberAction(data);
        if (result.error) setError(result.error);
        else dialog.current?.close();
      } catch {
        setError("삭제 결과를 확인하지 못했습니다. 명단을 새로고침해 주세요.");
      }
    });
  }

  return <>
    <button type="button" className="button whitespace-nowrap" onClick={() => { setError(""); dialog.current?.showModal(); }}>명단에서 삭제</button>
    <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={(event) => { if (pending) event.preventDefault(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--paper)] p-6 text-[var(--ink)] backdrop:bg-[var(--ink)]/40">
      <h2 id={titleId} className="text-xl font-semibold">명단에서 삭제할까요?</h2>
      <div className="my-5 rounded-xl bg-[var(--cream)] p-4">
        <p className="font-semibold break-words">{name} · {cohort}</p>
        <p className="mt-2 break-all text-sm">{email}</p>
      </div>
      <p id={descriptionId} className="text-sm leading-7">가입 승인을 취소하고 명단에서 삭제합니다. 이 승인으로는 회원가입할 수 없으며, 배정된 모임의 자리도 해제됩니다. 기존 신청 내역은 보관됩니다.</p>
      {error && <p role="alert" className="mt-4 text-sm font-semibold">{error}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button type="button" autoFocus disabled={pending} className="button disabled:opacity-50" onClick={() => dialog.current?.close()}>취소</button>
        <button type="button" disabled={pending} className="button disabled:opacity-50" onClick={remove}>{pending ? "삭제 중…" : "삭제"}</button>
      </div>
    </dialog>
  </>;
}
