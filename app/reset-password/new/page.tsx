import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NewPasswordForm } from "@/components/NewPasswordForm";
import { resetLinkExpiredMessage } from "@/lib/auth/reset-password";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "새 비밀번호 설정",
  robots: { index: false, follow: false }
};

export default async function NewPasswordPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/reset-password?message=${encodeURIComponent(resetLinkExpiredMessage)}`);

  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8">
        <p className="eyebrow">NEW PASSWORD</p>
        <h1 className="mt-4 text-3xl font-semibold">새 비밀번호 설정</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">새로 사용할 비밀번호를 입력해 주세요. 저장하면 바로 나의 서재로 이동해요.</p>
        <NewPasswordForm />
      </div>
    </main>
  );
}
