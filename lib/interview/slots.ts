import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type InterviewSlot = { id: number; startsAt: string; available: boolean };

export async function loadInterviewSlots() {
  if (!isSupabaseConfigured()) return { slots: [] as InterviewSlot[], loadFailed: true };
  const supabase = await createClient();
  const calendar = await supabase.rpc("list_interview_calendar_slots");
  const result = calendar.error ? await supabase.rpc("list_available_interview_slots") : calendar;
  const slots: InterviewSlot[] = (result.data ?? []).flatMap((slot: { slot_id: number | string; starts_at: string; is_available?: boolean }) => {
    const id = Number(slot.slot_id);
    return Number.isSafeInteger(id) && id > 0 && typeof slot.starts_at === "string"
      ? [{ id, startsAt: slot.starts_at, available: calendar.error ? true : slot.is_available === true }]
      : [];
  });
  return { slots, loadFailed: Boolean(result.error) };
}
