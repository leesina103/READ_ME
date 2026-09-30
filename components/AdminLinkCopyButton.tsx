"use client";

import { useState } from "react";

export function AdminLinkCopyButton({ path, label }: { path: string; label: string }) {
  const [message, setMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [pending, setPending] = useState(false);

  async function copy() {
    setPending(true);
    const url = new URL(path, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(url);
      setManualUrl("");
      setMessage("복사했어요. 안내할 분에게 문자로 보내 주세요.");
    } catch {
      setManualUrl(url);
      setMessage("아래 주소를 선택해 직접 복사해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-0 max-w-full">
      <button type="button" onClick={copy} disabled={pending} className="button button--ghost disabled:opacity-50">{label}</button>
      {message && <p role="status" className="mt-2 text-sm leading-6 text-[var(--muted)]">{message}</p>}
      {manualUrl && <input aria-label={`${label} 주소`} readOnly value={manualUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full min-w-0 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-2 text-sm" />}
    </div>
  );
}
