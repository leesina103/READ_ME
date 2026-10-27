"use client";

import { useState, type ReactNode } from "react";

export function TalkExampleFrame({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [capture, setCapture] = useState(false);

  return <div className="group/talk" data-capture={enabled && capture}>
    {enabled && <div className="mt-4 flex justify-end">
      <button type="button" aria-pressed={capture} onClick={() => setCapture((value) => !value)} className="button min-h-11">
        {capture ? "캡처 모드 끝내기" : "캡처 모드"}
      </button>
    </div>}
    <div className="mt-6 overflow-hidden rounded-[28px] border border-[var(--line)] group-data-[capture=true]/talk:[&_[role=status]]:hidden">
      {children}
    </div>
  </div>;
}
