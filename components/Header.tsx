import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--background)]/90 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-[-0.02em]">
          <BookOpen size={21} className="text-[var(--accent-dark)]" />
          READ ME
        </Link>
        <nav className="flex items-center gap-5 text-sm text-[var(--muted)]">
          <Link href="/about" className="hover:text-[var(--foreground)]">소개</Link>
          <Link href="/meeting" className="hover:text-[var(--foreground)]">모임</Link>
          <Link href="/my" className="hover:text-[var(--foreground)]">MY</Link>
          <Link href="/login" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-[var(--foreground)]">로그인</Link>
        </nav>
      </div>
    </header>
  );
}
