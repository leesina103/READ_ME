import Link from "next/link";
import type { ReactNode } from "react";

export function GuideShell({ title, children, back = "/guide", backLabel = "가이드 모임 관리" }: { title: string; children: ReactNode; back?: string; backLabel?: string }) {
  return <main className="section"><div className="section-shell guide-shell">
    <Link href={back} className="guide-back">← {backLabel}</Link>
    <h1>{title}</h1>{children}
  </div></main>;
}
