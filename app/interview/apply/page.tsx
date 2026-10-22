import { CohortLabel } from "@/components/CohortLabel";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { InterviewApplicationForm } from "@/components/InterviewApplicationForm";
import { currentMeeting } from "@/data/currentMeeting";
import { loadInterviewSlots } from "@/lib/interview/slots";

export const metadata: Metadata = {
  title: "인터뷰 예약",
  description: "READ ME 인터뷰 날짜와 시간을 선택하고 예약합니다.",
  alternates: { canonical: "/interview/apply" }
};

export default async function InterviewApplyPage() {
  const { slots, loadFailed } = await loadInterviewSlots();

  return (
    <main className="interview-apply-page">
      <section className="section interview-apply-hero">
        <div className="section-shell">
          <Link href="/interview" className="text-link"><ArrowLeft size={15} /> 인터뷰 안내</Link>
          <div className="interview-apply-heading">
            <div>
              <p className="eyebrow">BOOK AN INTERVIEW · <CohortLabel>{currentMeeting.cohort}</CohortLabel></p>
              <h1>인터뷰 예약</h1>
            </div>
          </div>
          <aside className="interview-apply-note" aria-label="인터뷰 예약 및 변경 안내">
              <h2>1:1 온라인 · {currentMeeting.interview.duration}</h2>
              <p>편한 날짜와 시간을 선택해 주세요.<br />예약 시간과 안내 페이지는 문자로 보내드려요.</p>
              <p className="interview-apply-note__manage"><strong>이미 예약하셨나요?</strong><br />예약 완료 화면이나 문자로 받은<br />‘예약 변경·취소’ 링크로 접속해 주세요.</p>
          </aside>
        </div>
      </section>

      <section className="section section--paper interview-apply-section">
        <div className="section-shell interview-apply-layout">
          <InterviewApplicationForm slots={slots} loadFailed={loadFailed} />
        </div>
      </section>
    </main>
  );
}
