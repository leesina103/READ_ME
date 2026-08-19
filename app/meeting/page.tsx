import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

const programs = [
  { id: "01", title: "관계", status: "준비 중", books: "관계의 언어 · 비폭력대화 · 사랑의 기술" },
  { id: "02", title: "나", status: "준비 중", books: "욕망 · 루틴 · 불안 · 즐거움" },
  { id: "03", title: "변화", status: "준비 중", books: "변화에 관한 네 번의 이야기" },
  { id: "04", title: "마음", status: "준비 중", books: "감정과 마음을 들여다보는 네 번의 질문" }
];

export default function MeetingPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-20">
      <p className="text-sm tracking-[0.2em] text-[var(--accent-dark)]">MEETING</p>
      <div className="mt-5 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="text-5xl font-semibold tracking-[-0.04em]">READ ME 모임</h1>
          <p className="mt-5 max-w-xl leading-7 text-[var(--muted)]">
            하나의 주제를 네 번에 걸쳐 읽고, 생각하고, 이야기합니다.
          </p>
        </div>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {programs.map((program) => (
          <article key={program.id} className="rounded-3xl border border-[var(--line)] bg-white p-7">
            <div className="flex items-start justify-between">
              <span className="text-sm text-[var(--muted)]">{program.id}기</span>
              <span className="rounded-full bg-[#eef3eb] px-3 py-1 text-xs text-[var(--accent-dark)]">{program.status}</span>
            </div>
            <h2 className="mt-10 text-3xl font-semibold">{program.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{program.books}</p>
            <div className="mt-8 flex items-center gap-2 text-xs text-[var(--muted)]">
              <CalendarDays size={15} /> 4회 오프라인 모임
            </div>
            <Link href="/login" className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-[var(--accent-dark)]">
              참여 준비하기 <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </main>
  );
}
