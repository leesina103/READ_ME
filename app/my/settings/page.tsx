import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { redirect } from "next/navigation";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) redirect("/my");
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my/settings");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
      <Link href="/my" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={16} /> 나의 서재로</Link>
      <p className="eyebrow mt-8">ACCOUNT SETTINGS</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">계정 설정</h1>
      <section className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
        <div className="flex items-start gap-4"><LockKeyhole className="mt-1 shrink-0 text-[var(--forest)]" /><div><h2 className="text-xl font-semibold">비밀번호 변경</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">현재 비밀번호로 본인 확인 후 새 비밀번호를 저장합니다.</p><p className="mt-1 text-sm text-[var(--muted)]">로그인 이메일 · {user.email}</p></div></div>
        <PasswordChangeForm />
      </section>
    </main>
  );
}
