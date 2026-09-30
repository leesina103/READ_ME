import type { Metadata } from "next";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
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
              <p className="eyebrow">BOOK AN INTERVIEW · {currentMeeting.cohort}</p>
              <h1>편한 날짜와 시간을<br />선택해 주세요.</h1>
            </div>
            <p>{currentMeeting.cohort} 참여를 위한 인터뷰입니다. 이름과 전화번호만 남기면 예약이 완료됩니다.<br />예약 시간과 안내 페이지는 문자로 보내드려요.</p>
          </div>
        </div>
      </section>

      <section className="section section--paper interview-apply-section">
        <div className="section-shell interview-apply-layout">
          <aside>
            <MessageCircleMore size={28} aria-hidden="true" />
            <p className="eyebrow">BEFORE YOU BOOK</p>
            <h2>답을 준비하지 않아도<br />괜찮습니다.</h2>
            <p>인터뷰는 1:1 온라인 대화로 진행하며 약 {currentMeeting.interview.duration}이 걸립니다. 서로의 대화 방식이 편안할지 가볍게 알아보는 시간이에요.</p>
            <p>이미 예약하셨나요? 예약 완료 화면이나 문자로 받은 ‘예약 변경·취소’ 링크로 접속해 주세요.</p>
          </aside>
          <InterviewApplicationForm slots={slots} loadFailed={loadFailed} />
        </div>
      </section>
    </main>
  );
}
