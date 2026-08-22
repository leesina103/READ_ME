import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8">
        <p className="eyebrow">MEMBER LOGIN</p>
        <h1 className="mt-4 text-3xl font-semibold">나의 서재 열기</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">참여 중인 모임과 내가 남긴 질문을 확인하세요.</p>
        <AuthForm mode="login" configured={isSupabaseConfigured()} next={params.next} notice={params.message} />
        <p className="mt-6 text-center text-sm text-[var(--muted)]">아직 회원이 아니신가요? <Link href="/signup" className="font-medium text-[var(--forest)]">회원가입</Link></p>
      </div>
    </main>
  );
}
