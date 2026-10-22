import { OnboardingForm } from "@/components/OnboardingForm";

export function OnboardingScreen({ fullName, cohort, preview = false }: { fullName: string; cohort: string; preview?: boolean }) {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-16 md:py-24">
      <section className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-10">
        <p className="eyebrow">WELCOME TO READ ME</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em]">모임에서 사용할 닉네임을 정해 주세요</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {fullName}님, <strong className="text-[var(--ink)]">{cohort}</strong> 멤버로 승인되었어요.
          닉네임을 정하면 나의 서재가 열려요. 자기소개는 첫 모임 전, 온라인 대화의 ‘첫 만남’에서 작성해 주세요.
        </p>
        <OnboardingForm preview={preview} />
      </section>
    </main>
  );
}
