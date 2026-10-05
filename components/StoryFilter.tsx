"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function StoryFilter({ selected, cohorts }: { selected: string; cohorts: number[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="stories-filter-control">
      <label className="sr-only" htmlFor="story-cohort">후기 기수 선택</label>
      <div className="stories-filter-select">
      <select
        id="story-cohort"
        value={selected}
        disabled={pending}
        onChange={(event) => {
          const value = event.target.value;
          startTransition(() => router.push(value === "all" ? "/story" : `/story?cohort=${value}`, { scroll: false }));
        }}
      >
        <option value="all">전체</option>
        <option value="general">독서모임 이야기</option>
        {cohorts.map((cohort) => <option key={cohort} value={cohort}>{cohort}기</option>)}
      </select>
      <ChevronDown size={16} aria-hidden="true" />
      </div>
      {pending && <span className="sr-only" role="status">불러오는 중…</span>}
    </div>
  );
}
