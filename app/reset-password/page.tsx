import type { Metadata } from "next";
import Link from "next/link";
import { PasswordResetRequestForm } from "@/components/PasswordResetRequestForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "비밀번호 재설정",
  description: "가입한 이메일로 비밀번호 재설정 링크를 받습니다.",
  alternates: { canonical: "/reset-password" }
};

type ResetPasswordPageProps = { searchParams: Promise<{ message?: string }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { message } = await searchParams;

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8">
        <p className="eyebrow">PASSWORD RESET</p>
        <h1 className="mt-4 text-3xl font-semibold">비밀번호 재설정</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">가입한 이메일을 입력하면 새 비밀번호를 정할 수 있는 링크를 보내 드려요.</p>
        <PasswordResetRequestForm configured={isSupabaseConfigured()} notice={message} />
        <p className="mt-6 text-center text-sm text-[var(--muted)]"><Link href="/login" className="font-medium text-[var(--forest)]">로그인으로 돌아가기</Link></p>
      </div>
    </main>
  );
}
