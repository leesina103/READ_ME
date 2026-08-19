import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-[var(--line)] bg-white p-8">
        <p className="text-sm tracking-[0.2em] text-[var(--accent-dark)]">READ ME</p>
        <h1 className="mt-4 text-3xl font-semibold">로그인</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">내 모임과 독서 기록을 확인해보세요.</p>
        <div className="mt-8 space-y-3">
          <input className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]" type="email" placeholder="이메일" />
          <input className="w-full rounded-2xl border border-[var(--line)] px-4 py-3 outline-none focus:border-[var(--accent)]" type="password" placeholder="비밀번호" />
          <button className="w-full rounded-2xl bg-[var(--foreground)] px-4 py-3 font-medium text-white">로그인</button>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          아직 회원이 아니신가요? <Link href="/signup" className="font-medium text-[var(--accent-dark)]">회원가입</Link>
        </p>
      </div>
    </main>
  );
}
