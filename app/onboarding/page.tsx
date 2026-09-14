import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/auth/actions";
import { OnboardingForm } from "@/components/OnboardingForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "첫 회원 정보 작성",
  robots: { index: false, follow: false }
};

export default async function OnboardingPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/onboarding");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, cohort, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-10">
          <p className="eyebrow">MEMBER SETUP</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">회원 정보를 불러오지 못했습니다</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">잠시 후 다시 로그인해 주세요. 계속 반복되면 운영진에게 문의해 주세요.</p>
          <form action={logoutAction} className="mt-8">
            <button type="submit" className="rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--cream)]">로그아웃</button>
          </form>
        </section>
      </main>
    );
  }
  if (profile.onboarding_completed_at) redirect("/my");

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-10">
        <p className="eyebrow">WELCOME TO READ ME</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">첫 회원 정보를 작성해 주세요</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {profile.full_name}님, <strong className="text-[var(--ink)]">{profile.cohort}</strong> 멤버로 승인되었어요.
          모임에서 사용할 정보를 작성하면 나의 서재가 열려요.
        </p>
        <OnboardingForm />
      </section>
    </main>
  );
}
