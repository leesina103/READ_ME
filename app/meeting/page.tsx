import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProgramGuide } from "@/components/ProgramGuide";
import { FaqList } from "@/components/FaqList";
import { currentMeeting } from "@/data/currentMeeting";
import { currentTheme } from "@/data/themes";

export const metadata: Metadata = {
  title: currentMeeting.recruiting ? "모집 안내" : "모임 안내",
  description: `READ ME ${currentMeeting.cohort} ${currentMeeting.recruiting ? "모집 정보" : "진행 방식"}와 ${currentMeeting.schedule.duration} 동안 함께 읽고 나눌 네 번의 이야기를 안내합니다.`,
  alternates: { canonical: "/meeting" }
};

const sessionFocus = [
  "쉬운 책과 가치관 질문으로 시작합니다. 가벼운 게임과 대화로 서로의 생각을 알아갑니다.",
  "조금 더 깊은 책과 질문을 만납니다. 지난 회차에 직접 실천해본 경험도 함께 나눕니다.",
  "익숙한 생각을 흔드는 책과 질문으로 대화합니다. 서로 다른 적용 방식에서 새로운 관점을 얻습니다.",
  `마지막 책의 깊은 질문과 함께 ${currentMeeting.schedule.duration} 동안 달라진 생각과 가치관을 돌아봅니다.`
] as const;

const faqs = [
  {
    question: "한 기수에는 몇 명이 함께하나요?",
    answer: `한 기수에는 약 ${currentMeeting.schedule.cohortSize}이 함께합니다. 오프라인 토의는 ${currentMeeting.schedule.groupSize}씩 소규모 그룹으로 진행합니다.`
  },
  {
    question: "한 기수 동안 같은 사람들과 토의하나요?",
    answer: <>네. 한 기수 동안 같은 멤버들과 정해진 요일과 시간에 만납니다. 여러 번 만나며 서로 익숙해지고, 자신의 생각도 조금 더 편하게 이야기할 수 있도록 하기 위해서입니다.<br />온라인 토크방에서는 다른 그룹을 포함해 같은 기수 멤버들의 생각도 함께 읽고 나눕니다.</>
  },
  {
    question: "모임 요일과 시간은 어떻게 정하나요? 매주 신청해야 하나요?",
    answer: "인터뷰 후 안내드리는 후보 요일과 시간 중 참여하기 편한 일정을 선택합니다. 한 번 정한 요일과 시간으로 기수 동안 격주로 만나므로, 매주 다시 신청하지 않아도 됩니다."
  },
  {
    question: "온라인 프로그램은 어떻게 진행되나요?",
    answer: <>READ ME 웹사이트의 토크방에서 진행됩니다. 모임 전에는 책을 읽고 떠오른 생각을 사전 질문에 적습니다.<br />오프라인 토의 후에는 READ ME에서 제공하는 질문을 따라 생각을 정리하고, 토의에서 만난 새로운 관점을 일상에 적용해 본 경험을 남깁니다. 같은 기수 멤버들의 답변도 함께 읽으며 생각을 나눕니다.</>,
    href: "/meeting#program-guide",
    linkLabel: "모임 진행 방식 자세히 보기"
  }
];

export default function MeetingPage() {
  return (
    <main>
      <section className="meeting-hero section-shell">
        <div className="meeting-hero__label">
          <p className="eyebrow">CURRENT MEETING</p>
          {currentMeeting.recruiting && <span className="season-current__badge">{currentMeeting.recruitingLabel}</span>}
        </div>
        <h1>READ ME {currentMeeting.cohort}</h1>
        <p className="meeting-hero__theme">이번 기수의 주제: {currentTheme.name}</p>
        <p className="meeting-hero__question">{currentTheme.subtitle}</p>
        <p className="meeting-hero__summary">{currentTheme.summary}</p>
        <Link href={currentMeeting.applyHref} className="button button--primary">{currentMeeting.applyLabel} <ArrowRight size={15} /></Link>
        <div><Link href="/interview" className="text-link">인터뷰 안내 보기 <ArrowRight size={15} /></Link></div>
      </section>

      <section className="section section--paper">
        <div className="section-shell">
          <p className="eyebrow">RECRUITING</p>
          <h2 className="themes-section-title">모집 정보</h2>
          <dl className="meeting-recruiting-facts">
            {currentMeeting.facts.map((fact) => (
              <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>
            ))}
          </dl>
          <p className="meeting-facts__note">한 기수에는 약 {currentMeeting.schedule.cohortSize}이 함께합니다.<br />인터뷰 후 안내드리는 후보 요일과 시간 중 참여하기 편한 일정을 선택하고, 기수 동안 같은 요일과 시간에 격주로 만납니다.<br />인터뷰는 {currentMeeting.interview.duration} 동안 진행되며, 결과는 {currentMeeting.interview.resultTiming} 안에 개별 안내합니다.</p>
        </div>
      </section>

      <ProgramGuide />

      <section className="section section--paper">
        <div className="section-shell">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">CURRICULUM</p>
              <h2 className="themes-section-title">이번 기수에서 나눌 이야기</h2>
              <p className="section-heading-row__lead">한 가지 질문만 반복하면 대화도 비슷해집니다.<br />삶은 여러 주제가 맞물려 있기에, 서로 맞닿은 네 개의 질문을 따라가며 회차마다 다른 이야기를 나눕니다.</p>
            </div>
            <div className="meeting-curriculum__theme">
              <Link href={`/themes/${currentTheme.slug}`} className="text-link">{currentTheme.name} 주제 자세히 보기 <ArrowRight size={15} /></Link>
              <small>* 기수마다 주제가 바뀝니다.</small>
            </div>
          </div>
          <ol className="meeting-curriculum">
            {currentMeeting.sessions.map((session, index) => (
              <li key={session.order}>
                <div className="meeting-curriculum__order">
                  <span>{session.order}회차</span>
                  <small>{session.order * 2 - 1}~{session.order * 2}주차</small>
                </div>
                <div className="meeting-curriculum__body">
                  <h3>{session.title}</h3>
                  <p className="meeting-curriculum__question">{session.question}</p>
                  <p className="meeting-curriculum__focus">{sessionFocus[index]}</p>
                </div>
                <div className="meeting-curriculum__meta">
                  <p className="meeting-curriculum__book">『{session.book}』 · {session.author}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="meeting-after-section">
        <div className="section-shell">
          <div className="meeting-after-note">
            <p className="eyebrow">AFTER THE SEASON</p>
            <p>기수가 끝난 뒤에도 나의 서재에 기록이 남고, READ ME 파티와 멤버십 활동을 통해 사람과 관계를 이어갑니다.</p>
            <Link href="/#after-season" className="text-link">이어지는 활동 자세히 보기 <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section id="faq" className="section faq-section">
        <div className="section-shell faq-layout">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>참여하기 전에<br />궁금한 것들</h2>
            <p>함께하는 인원부터 모임 일정과 온라인 활동까지, 참여 전에 궁금한 내용을 안내합니다.</p>
          </div>
          <FaqList items={faqs} />
        </div>
      </section>

      <section className="section">
        <div className="section-shell">
          <div className="meeting-cta">
            <div>
              <span>JOIN READ ME {currentMeeting.cohort}</span>
              <strong>함께 읽고 이야기하고 싶다면<br />인터뷰에서 먼저 만나요.</strong>
              <p>서로를 존중하며 깊이 대화할 수 있는지 가볍게 이야기를 나눕니다.</p>
            </div>
            <Link href={currentMeeting.applyHref} className="button button--primary">{currentMeeting.applyLabel} <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>
    </main>
  );
}
