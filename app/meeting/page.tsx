import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, UsersRound } from "lucide-react";

const sessions = [
  ["1회차", "관계를 읽다", "나는 사람을 어떻게 이해하고 있나요?"], ["2회차", "나를 읽다", "내가 원하는 삶은 어떤 모습인가요?"],
  ["3회차", "변화를 읽다", "변하고 싶은 마음은 어디에서 오나요?"], ["4회차", "마음을 읽다", "지금의 감정을 어떻게 돌볼 수 있을까요?"]
];

export default function MeetingPage() {
  return <main className="mx-auto max-w-6xl px-6 py-20 md:py-28"><p className="eyebrow">CURRENT MEETING</p>
    <div className="mt-5 grid gap-10 md:grid-cols-[1.15fr_.85fr] md:items-end"><div><h1 className="text-5xl font-semibold tracking-[-0.04em] md:text-7xl">READ ME 01기<br /><span className="text-[var(--forest)]">나를 읽는 네 번의 밤</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">하나의 기수는 네 번의 모임으로 이어집니다. 참여자는 개별 회차가 아닌 전체 여정에 함께합니다.</p></div><div className="rounded-[28px] bg-[var(--forest)] p-7 text-[var(--cream)]"><p className="text-xs tracking-[.18em] text-[var(--sand)]">APPLICATION</p><p className="mt-3 text-2xl font-semibold">첫 기수 알림 신청 중</p><p className="mt-3 text-sm leading-6 text-white/70">구체적인 일정과 장소가 확정되면 가장 먼저 알려드려요.</p><Link href="/signup" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--cream)] px-5 py-3 text-sm font-semibold text-[var(--ink)]">알림 신청하기 <ArrowRight size={15}/></Link></div></div>
    <div className="mt-14 flex flex-wrap gap-3 text-sm text-[var(--muted)]"><span className="rounded-full border border-[var(--line)] px-4 py-2"><CalendarDays className="mr-2 inline" size={15}/>격주 4회</span><span className="rounded-full border border-[var(--line)] px-4 py-2"><UsersRound className="mr-2 inline" size={15}/>8명 안팎</span><span className="rounded-full border border-[var(--line)] px-4 py-2"><MapPin className="mr-2 inline" size={15}/>서울 오프라인</span></div>
    <section className="mt-16 border-t border-[var(--line)]">{sessions.map(([week,title,question],index) => <article key={week} className="grid gap-4 border-b border-[var(--line)] py-8 md:grid-cols-[100px_1fr_auto] md:items-center"><span className="text-sm font-semibold text-[var(--forest)]">{week}</span><div><h2 className="text-2xl font-semibold">{title}</h2><p className="mt-2 text-[var(--muted)]">{question}</p></div><span className="font-serif text-4xl text-[var(--sand)]">0{index+1}</span></article>)}</section>
  </main>;
}
