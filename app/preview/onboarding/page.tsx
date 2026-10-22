import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnboardingScreen } from "@/components/OnboardingScreen";

export const metadata: Metadata = {
  title: "닉네임 설정 미리보기",
  robots: { index: false, follow: false }
};

export default function OnboardingPreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  return (
    <>
      <p role="status" className="mx-auto mt-6 max-w-2xl px-6 text-sm text-[var(--muted)]">
        로컬 미리보기 · 예시 회원 정보입니다. 입력한 닉네임은 저장되지 않아요.
      </p>
      <OnboardingScreen fullName="미리보기" cohort="1기" preview />
    </>
  );
}
