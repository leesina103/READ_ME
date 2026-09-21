import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { TalkSchedule } from "@/lib/membership/talkDeadlines";

export const getTalkSchedule = cache(async (cohort: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_talk_schedule", { p_cohort: cohort });
  return { schedule: (error ? [] : data ?? []) as TalkSchedule[], error: Boolean(error) };
});
