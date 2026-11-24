import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "이메일 인증",
  referrer: "no-referrer",
  robots: { index: false, follow: false }
};

async function confirmEmail(form: FormData) {
  "use server";
  const tokenHash = form.get("token_hash");
  if (typeof tokenHash === "string" && tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
    if (!error) redirect("/onboarding");
  }
  redirect("/auth/confirm");
}

export default async function ConfirmEmailPage({ searchParams }: {
  searchParams: Promise<{ token_hash?: string | string[] }>;
}) {
  const { token_hash: tokenHash } = await searchParams;
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center justify-center px-6 py-16">
      <section className="auth-confirm-card w-full max-w-[600px] rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-12 max-[820px]:p-9 max-[430px]:p-6">
        <h1 className="border-t-2 border-[var(--sage)] pt-7 font-serif text-4xl font-semibold max-[430px]:text-3xl">이메일 인증</h1>
        {typeof tokenHash === "string" && tokenHash ? (
          <form action={confirmEmail}>
            <p className="mt-5 mb-8 max-w-[26em] text-[17px] leading-relaxed break-keep text-[var(--muted)]">아래 버튼을 누르면 이메일 인증이 완료되고 모임에서 쓸 닉네임을 정할 수 있어요.</p>
            <input type="hidden" name="token_hash" value={tokenHash} />
            <button className="button bg-[var(--forest)] text-[var(--paper)] max-[430px]:w-full" type="submit">이메일 인증 완료하기</button>
            <p className="mt-6 text-sm leading-relaxed text-[var(--muted)]">이미 인증하셨나요? <Link className="font-medium text-[var(--forest)] underline underline-offset-4" href="/login">로그인하고 이어가기</Link></p>
          </form>
        ) : (
          <>
            <p className="my-6 text-[var(--muted)]">이미 사용했거나 유효기간이 지난 링크일 수 있어요. 가입할 때 사용한 이메일로 로그인하면 이어갈 수 있어요. 아직 인증 전이라면 로그인 화면에서 인증 메일을 다시 받을 수 있어요.</p>
            <Link className="button button--primary" href="/login">로그인하고 이어가기</Link>
          </>
        )}
      </section>
    </main>
  );
}
