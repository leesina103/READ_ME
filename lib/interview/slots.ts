import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { readInterviewCalendar } from "@/lib/interview/calendar";

export type InterviewSlot = { id: number; startsAt: string; available: boolean };

export async function loadInterviewSlots() {
  if (!isSupabaseConfigured()) return { slots: [] as InterviewSlot[], loadFailed: true };
  const supabase = await createClient();
  try {
    const slots = await readInterviewCalendar(async (start, offset, size) => {
      return await supabase.rpc("list_interview_calendar_slots")
        .gte("starts_at", start)
        .order("starts_at").order("slot_id")
        .range(offset, offset + size - 1);
    });
    return { slots, loadFailed: false };
  } catch {
    // 일부 페이지만 받은 상태를 예약 마감으로 표시하지 않습니다.
    return { slots: [] as InterviewSlot[], loadFailed: true };
  }
}
