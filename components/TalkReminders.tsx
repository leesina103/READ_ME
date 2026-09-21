import Link from "next/link";
import { Bell } from "lucide-react";
import { talkReminder, type TalkSchedule } from "@/lib/membership/talkDeadlines";

export function TalkReminders({ schedule, cohortNumber, ended, now = Date.now() }: {
  schedule: TalkSchedule[]; cohortNumber: number; ended: boolean; now?: number;
}) {
  if (ended) return null;
  const reminders = schedule.map((item) => ({ item, status: talkReminder(item, now) })).filter(({ status }) => status);
  if (!reminders.length) return null;
  return (
    <section aria-label="작성 안내" className="mt-8 rounded-[28px] border border-[var(--line)] bg-[var(--sage)]/35 p-5">
      <h2 className="flex items-center gap-2 font-semibold text-[var(--forest)]"><Bell size={18} aria-hidden="true" /> 작성 안내</h2>
      <ul className="mt-4 grid gap-4">
        {reminders.map(({ item, status }) => <li key={item.week_number} className="flex items-center justify-between gap-4 max-[820px]:flex-col max-[820px]:items-start">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{item.week_number}주차 · {item.week_number % 2 ? "사전 질문" : "OUTPUT 질문"}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{status === "today" ? "오늘 밤 11:59까지 작성해주세요." : "아직 남기지 않은 답변이 있어요. 지금도 작성할 수 있어요."}</p>
          </div>
          <Link href={`/membership/talk/${cohortNumber}/${item.week_number}`} className="button button--primary shrink-0 text-sm max-[430px]:w-full">작성하러 가기</Link>
        </li>)}
      </ul>
    </section>
  );
}
