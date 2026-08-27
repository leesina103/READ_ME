import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, NotebookPen, MapPin, UsersRound } from "lucide-react";
import { currentMeeting } from "@/data/currentMeeting";
import { currentTheme } from "@/data/themes";

const programSteps = [
  { icon: BookOpen, type: "INPUT", title: "첫 번째 토의", description: "쉬운 책과 가치관 질문으로 시작합니다. 가벼운 게임과 대화를 통해 서로의 생각을 알아갑니다." },
  { icon: NotebookPen, type: "OUTPUT · REST", title: "첫 번째 휴식 세션", description: "온라인으로 진행합니다. 책에서 발견한 생각 중 삶에 적용해보고 싶은 행동 하나를 정합니다." },
  { icon: BookOpen, type: "INPUT", title: "두 번째 토의", description: "조금 더 깊은 책과 질문을 만납니다. 지난주에 직접 실천해본 경험도 함께 나눕니다." },
  { icon: NotebookPen, type: "OUTPUT · REST", title: "두 번째 휴식 세션", description: "배운 내용을 나에게 맞는 습관이나 행동으로 옮기고, 과정과 변화를 온라인에 기록합니다." },
  { icon: BookOpen, type: "INPUT", title: "세 번째 토의", description: "익숙한 생각을 흔드는 책과 질문으로 대화합니다. 서로 다른 적용 방식에서 새로운 관점을 얻습니다." },
  { icon: NotebookPen, type: "OUTPUT · REST", title: "세 번째 휴식 세션", description: "개인 과제를 실천하며 책의 문장을 일상 속 선택으로 바꿔봅니다. 결과보다 시도한 과정을 남깁니다." },
  { icon: BookOpen, type: "INPUT", title: "네 번째 토의", description: "마지막 책의 깊은 질문과 함께 8주 동안 달라진 생각과 가치관을 돌아봅니다." },
  { icon: NotebookPen, type: "OUTPUT · REST", title: "네 번째 휴식 세션", description: "삶에 적용해본 경험을 발표하고, 모임이 끝난 뒤에도 이어갈 행동 하나를 정하며 마무리합니다." }
] as const;

export default function MeetingPage() {
  return <main className="mx-auto max-w-6xl px-6 py-20 md:py-28"><p className="eyebrow">CURRENT MEETING</p>
    <div className="mt-5 grid gap-10 md:grid-cols-[1.15fr_.85fr] md:items-end"><div><h1 className="text-[42px] leading-[1.08] font-semibold tracking-[-0.04em] break-keep sm:text-5xl md:text-7xl">READ ME {currentMeeting.cohort}<br /><span className="text-[var(--forest)]">{currentMeeting.title}</span></h1><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">하나의 기수는 8주 동안 네 번의 오프라인 토의와 네 번의 온라인 휴식 세션으로 이어집니다.</p></div><div className="rounded-[28px] bg-[var(--forest)] p-7 text-[var(--cream)]"><p className="text-xs tracking-[.18em] text-[var(--sand)]">APPLICATION</p><p className="mt-3 text-2xl font-semibold">{currentMeeting.cohort} {currentMeeting.application.status}</p><p className="mt-3 text-sm leading-6 text-white/70">{currentMeeting.application.description}</p><Link href={currentMeeting.application.href} className="button button--light mt-6">{currentMeeting.application.actionLabel} <ArrowRight size={15}/></Link></div></div>
    <div className="mt-14 flex flex-wrap gap-3 text-sm text-[var(--muted)]"><span className="rounded-full border border-[var(--line)] px-4 py-2"><CalendarDays className="mr-2 inline" size={15}/>{currentMeeting.schedule}</span><span className="rounded-full border border-[var(--line)] px-4 py-2"><UsersRound className="mr-2 inline" size={15}/>{currentMeeting.capacity}</span><span className="rounded-full border border-[var(--line)] px-4 py-2"><MapPin className="mr-2 inline" size={15}/>{currentMeeting.location}</span></div>
    <section className="mt-12 flex flex-col gap-7 rounded-[28px] bg-[var(--sage)] p-7 sm:p-9 md:flex-row md:items-center md:justify-between">
      <div><p className="eyebrow">CURRENT THEME</p><h2 className="mt-3 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{currentTheme.name} — {currentTheme.subtitle}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">{currentTheme.summary}</p></div>
      <Link href={`/themes/${currentTheme.slug}`} className="button button--primary shrink-0 self-start md:self-auto">{currentTheme.name} 주제 자세히 보기 <ArrowRight size={15}/></Link>
    </section>
    <section className="meeting-program">
      <div className="meeting-program__heading">
        <div><p className="eyebrow">8-WEEK CURRICULUM</p><h2>읽은 것을,<br />삶으로 가져갑니다.</h2></div>
        <div><strong>INPUT 4주 · OUTPUT 4주</strong><p>한 주는 책을 읽고 대화합니다. 다음 주는 배운 것을 직접 실천하고 나눕니다. 읽는 데서 멈추지 않고 삶에 적용해야 비로소 온전히 나의 것이 된다고 믿습니다.</p></div>
      </div>
      <ol className="meeting-program__steps">
        {programSteps.map((step, index) => (
          <li key={step.title}>
            <div><span>{index + 1}주차</span><step.icon size={21} aria-hidden="true" /></div>
            <small className={step.type === "INPUT" ? "meeting-program__type meeting-program__type--input" : "meeting-program__type meeting-program__type--output"}>{step.type}</small>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </li>
        ))}
      </ol>
    </section>
    <section className="mt-16 border-t border-[var(--line)]">{currentMeeting.sessions.map((session) => <article key={session.order} className="grid gap-4 border-b border-[var(--line)] py-8 md:grid-cols-[100px_1fr_auto] md:items-center"><span className="text-sm font-semibold text-[var(--forest)]">{session.order}회차</span><div><h2 className="text-2xl font-semibold">{session.title}</h2><p className="mt-2 text-[var(--muted)]">{session.question}</p></div><span className="font-serif text-4xl text-[var(--sand)]">{String(session.order).padStart(2, "0")}</span></article>)}</section>
  </main>;
}
