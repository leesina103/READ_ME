"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

export function createClient() {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return createBrowserClient(config.url, config.key);
}
