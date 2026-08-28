import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, NotebookPen } from "lucide-react";
import { currentMeeting } from "@/data/currentMeeting";
import { currentTheme } from "@/data/themes";

export const metadata: Metadata = {
  title: "모임 안내",
  description: "READ ME 1기 모집 정보와 8주 동안 함께 읽고 나눌 네 번의 이야기를 안내합니다."
};

const sessionFocus = [
  "쉬운 책과 가치관 질문으로 시작합니다. 가벼운 게임과 대화로 서로의 생각을 알아갑니다.",
  "조금 더 깊은 책과 질문을 만납니다. 지난 회차에 직접 실천해본 경험도 함께 나눕니다.",
  "익숙한 생각을 흔드는 책과 질문으로 대화합니다. 서로 다른 적용 방식에서 새로운 관점을 얻습니다.",
  "마지막 책의 깊은 질문과 함께 8주 동안 달라진 생각과 가치관을 돌아봅니다."
] as const;

export default function MeetingPage() {
  return (
    <main>
      <section className="meeting-hero section-shell">
        <div className="meeting-hero__label">
          <p className="eyebrow">CURRENT MEETING</p>
          {currentMeeting.recruiting && <span className="season-current__badge">{currentMeeting.recruitingLabel}</span>}
        </div>
        <h1>READ ME {currentMeeting.cohort}</h1>
        <p className="meeting-hero__theme">이번 기수의 주제 · {currentTheme.name}</p>
        <p className="meeting-hero__question">{currentTheme.subtitle}</p>
        <p className="meeting-hero__summary">{currentTheme.summary}</p>
        <Link href={currentMeeting.applyHref} className="button button--primary">{currentMeeting.applyLabel} <ArrowRight size={15} /></Link>
      </section>

      <section className="section section--paper">
        <div className="section-shell">
          <p className="eyebrow">RECRUITING</p>
          <h2 className="themes-section-title">모집 정보</h2>
          <dl className="meeting-facts">
            {currentMeeting.facts.map((fact) => (
              <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
            ))}
          </dl>
          <p className="meeting-facts__note">요일과 시간, 회차별 정확한 날짜는 인터뷰에서 함께 조율합니다.</p>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <div className="meeting-flow__heading">
            <div><p className="eyebrow">HOW IT WORKS</p><h2>2주에 한 권,<br />읽고 대화한 뒤 삶에 적용합니다.</h2></div>
            <div>
              <strong>왜 2주에 한 번인가요?</strong>
              <p>하나, 읽기에서 멈추지 않도록. 한 주는 읽고, 다음 주는 삶에 적용한 경험을 나눕니다.</p>
              <p>둘, 매주 한 권은 벅차니까. 2주에 한 권, 깊게 읽습니다.</p>
            </div>
          </div>
          <div className="meeting-flow__io">
            <article>
              <BookOpen size={22} strokeWidth={1.5} aria-hidden="true" />
              <small>INPUT · 오프라인</small>
              <h3>책을 읽고 질문을 나눕니다</h3>
              <p>책은 다양한 사람의 경험을 가장 값싸게 배울 수 있는 수단입니다.</p>
            </article>
            <article>
              <NotebookPen size={22} strokeWidth={1.5} aria-hidden="true" />
              <small>OUTPUT · 온라인</small>
              <h3>생각을 삶에 적용하고 기록합니다</h3>
              <p>배운 것은 실천해야 비로소 온전히 내 것이 됩니다.</p>
            </article>
          </div>
          <p className="meeting-flow__repeat">이 두 단계가 <strong>4회 반복</strong>되며 8주의 여정이 완성됩니다.</p>
        </div>
      </section>

      <section className="section section--paper">
        <div className="section-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">CURRICULUM</p><h2 className="themes-section-title">이번 기수에서 나눌 이야기</h2></div>
            <Link href={`/themes/${currentTheme.slug}`} className="text-link">{currentTheme.name} 주제 자세히 보기 <ArrowRight size={15} /></Link>
          </div>
          <ol className="meeting-curriculum">
            {currentMeeting.sessions.map((session, index) => (
              <li key={session.order}>
                <div className="meeting-curriculum__order">
                  <span>{session.order}회차</span>
                  <small>{session.order * 2 - 1}–{session.order * 2}주차</small>
                </div>
                <div className="meeting-curriculum__body">
                  <h3>{session.title}</h3>
                  <p className="meeting-curriculum__question">{session.question}</p>
                  <p className="meeting-curriculum__focus">{sessionFocus[index]}</p>
                </div>
                <div className="meeting-curriculum__meta">
                  <p className="meeting-curriculum__book">『{session.book}』 · {session.author}</p>
                  <p className="meeting-curriculum__io">오프라인 INPUT <ArrowRight size={13} aria-hidden="true" /> 온라인 OUTPUT</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <div className="meeting-cta">
            <div>
              <span>JOIN READ ME {currentMeeting.cohort}</span>
              <strong>함께 읽고 이야기하고 싶다면<br />인터뷰에서 먼저 만나요.</strong>
              <p>서로를 존중하며 깊이 대화할 수 있는지 가볍게 이야기를 나눕니다. 회비와 세부 일정도 이때 안내드립니다.</p>
            </div>
            <Link href={currentMeeting.applyHref} className="button button--primary">{currentMeeting.applyLabel} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
