import Link from "next/link";
import { LockKeyhole, UserRound } from "lucide-react";

export default function MyPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm tracking-[0.2em] text-[var(--accent-dark)]">MY</p>
      <h1 className="mt-5 text-5xl font-semibold tracking-[-0.04em]">나의 READ ME</h1>
      <div className="mt-12 rounded-3xl border border-[var(--line)] bg-white p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eef3eb]">
            <UserRound size={24} className="text-[var(--accent-dark)]" />
          </div>
          <div>
            <p className="font-medium">로그인이 필요합니다.</p>
            <p className="mt-1 text-sm text-[var(--muted)]">로그인하면 나의 모임과 독서 기록을 볼 수 있어요.</p>
          </div>
        </div>
        <Link href="/login" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-5 py-3 text-sm font-medium text-white">
          <LockKeyhole size={16} /> 로그인하기
        </Link>
      </div>
    </main>
  );
}
