import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function SignupPage() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8">
        <p className="eyebrow">JOIN READ ME</p>
        <h1 className="mt-4 text-3xl font-semibold">함께 읽을 준비</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">운영자가 사전 등록한 이름과 이메일로 계정을 만들어 주세요.</p>
        <AuthForm mode="signup" configured={isSupabaseConfigured()} />
        <p className="mt-6 text-center text-sm text-[var(--muted)]">이미 회원이신가요? <Link href="/login" className="font-medium text-[var(--forest)]">로그인</Link></p>
      </div>
    </main>
  );
}
