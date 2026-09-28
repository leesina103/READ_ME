"use client";

import { useState } from "react";
import { getInterviewManagementLink } from "@/app/admin/interviews/actions";

export function InterviewManagementLinkButton({ applicationId, name }: { applicationId: string; name: string }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("");
  const [manualCopy, setManualCopy] = useState(false);
  async function copy() {
    setPending(true);
    setMessage("");
    try {
      let managementUrl = url;
      if (!managementUrl) {
        const result = await getInterviewManagementLink(applicationId);
        if (!result.path) { setMessage(result.error ?? "링크를 불러오지 못했어요."); return; }
        managementUrl = new URL(result.path, window.location.origin).href;
        setUrl(managementUrl);
      }
      try {
        await navigator.clipboard.writeText(managementUrl);
        setManualCopy(false);
        setMessage("복사했어요. 예약자에게 카톡으로 보내주세요.");
      } catch {
        setManualCopy(true);
        setMessage("아래 주소를 선택해 직접 복사해 주세요.");
      }
    } catch {
      setMessage("관리 링크를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
    } finally { setPending(false); }
  }
  return <div className="min-w-36 max-w-56">
    <button type="button" onClick={copy} disabled={pending} aria-label={`${name}님 관리 링크 복사`} className="min-h-11 rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-semibold text-[var(--forest)] disabled:opacity-50">{pending ? "불러오는 중…" : "관리 링크 복사"}</button>
    {message && <p role="status" className="mt-2 text-xs leading-5 text-[var(--muted)]">{message}</p>}
    {manualCopy && <input aria-label={`${name}님 예약 관리 주소`} readOnly value={url} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-[var(--line)] p-2 text-xs" />}
  </div>;
}
