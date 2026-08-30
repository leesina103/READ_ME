import type { Metadata } from "next";
import { ArrowLeft, MessageCircleMore } from "lucide-react";
import Link from "next/link";
import {
  InterviewApplicationForm,
  type InterviewSlot
} from "@/components/InterviewApplicationForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "인터뷰 신청",
  description: "READ ME 인터뷰 날짜와 시간을 선택하고 신청합니다."
};

type InterviewSlotRow = {
  slot_id: number | string;
  starts_at: string;
  is_available: boolean;
};

type AvailableInterviewSlotRow = Omit<InterviewSlotRow, "is_available">;

export default async function InterviewApplyPage() {
  let slots: InterviewSlot[] = [];

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_interview_calendar_slots");

    let calendarRows: InterviewSlotRow[] = (data ?? []) as InterviewSlotRow[];

    if (error) {
      const { data: availableData } = await supabase.rpc("list_available_interview_slots");
      calendarRows = ((availableData ?? []) as AvailableInterviewSlotRow[]).map((slot) => ({
        ...slot,
        is_available: true
      }));
    }

    slots = calendarRows.flatMap((slot) => {
      const id = Number(slot.slot_id);
      const startsAt = typeof slot.starts_at === "string" ? slot.starts_at : "";
      return Number.isInteger(id) && id > 0 && startsAt
        ? [{ id, startsAt, available: slot.is_available === true }]
        : [];
    });
  }

  return (
    <main className="interview-apply-page">
      <section className="section interview-apply-hero">
        <div className="section-shell">
          <Link href="/interview" className="text-link"><ArrowLeft size={15} /> 인터뷰 안내</Link>
          <div className="interview-apply-heading">
            <div>
              <p className="eyebrow">BOOK AN INTERVIEW</p>
              <h1>편한 날짜와 시간을<br />선택해 주세요.</h1>
            </div>
            <p>이름과 전화번호만 남기면 신청이 완료됩니다.<br />예약 시간과 안내 페이지는 카카오톡으로 보내드려요.</p>
          </div>
        </div>
      </section>

      <section className="section section--paper interview-apply-section">
        <div className="section-shell interview-apply-layout">
          <aside>
            <MessageCircleMore size={28} aria-hidden="true" />
            <p className="eyebrow">BEFORE YOU BOOK</p>
            <h2>답을 준비하지 않아도<br />괜찮습니다.</h2>
            <p>인터뷰는 1:1 온라인 대화로 진행하며 약 20–30분이 걸립니다. 서로의 대화 방식이 편안할지 가볍게 알아보는 시간이에요.</p>
          </aside>
          <InterviewApplicationForm slots={slots} />
        </div>
      </section>
    </main>
  );
}
