import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "로그인",
  description: "READ ME 회원 로그인 페이지입니다. 나의 서재와 멤버십 공간으로 들어갑니다.",
  alternates: { canonical: "/login" }
};

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
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">참여 중인 모임과 내가 남긴 답변을 확인하세요.</p>
        <AuthForm mode="login" configured={isSupabaseConfigured()} next={params.next} notice={params.message} />
        <p className="mt-6 text-center text-sm text-[var(--muted)]">아직 회원이 아니신가요? <Link href="/signup" className="font-medium text-[var(--forest)]">회원가입</Link></p>
        <p className="mt-2 text-center text-sm text-[var(--muted)]">비밀번호를 잊으셨나요? <Link href="/reset-password" className="font-medium text-[var(--forest)]">비밀번호 재설정</Link></p>
      </div>
    </main>
  );
}
