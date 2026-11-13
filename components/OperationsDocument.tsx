import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./OperationsDocument.module.css";

const links = [
  { href: "/operations", label: "자동화 안내" },
  { href: "/operations/privacy", label: "개인정보 처리 안내" },
  { href: "/operations/terms", label: "이용 안내" }
];

export function OperationsDocument({ title, lead, path, children }: {
  title: string; lead: string; path: string; children: ReactNode;
}) {
  return (
    <main className={`section section-shell ${styles.document}`}>
      <header className={styles.header}>
        <p className="eyebrow">READ ME OPERATIONS</p>
        <h1>{title}</h1>
        <p className={styles.lead}>{lead}</p>
      </header>
      <nav className={styles.navigation} aria-label="운영 자동화 안내">
        {links.map(link => <Link key={link.href} href={link.href} aria-current={path === link.href ? "page" : undefined}>{link.label}</Link>)}
      </nav>
      <div className={styles.content}>{children}</div>
      <footer className={styles.footer}>
        <p>운영 및 문의: READ ME · <a href="mailto:readmebook.kr@gmail.com">readmebook.kr@gmail.com</a></p>
        <p>작성 기준일: 2026년 11월 13일</p>
        <Link href="/" className="button button--secondary">READ ME 홈으로</Link>
      </footer>
    </main>
  );
}
