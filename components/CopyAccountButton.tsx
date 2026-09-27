"use client";

import { useState } from "react";

export function CopyAccountButton({ account }: { account: string }) {
  const [message, setMessage] = useState("");
  async function copyAccount() {
    try {
      await navigator.clipboard.writeText(account);
      setMessage("계좌번호를 복사했어요.");
    } catch {
      setMessage("복사하지 못했어요. 위 계좌번호를 길게 누르거나 선택해 복사해 주세요.");
    }
  }
  return <div><button type="button" className="button button--ghost" onClick={copyAccount}>계좌번호 복사</button><p role="status">{message}</p></div>;
}
