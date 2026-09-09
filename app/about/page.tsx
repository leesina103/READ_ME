import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CircleDot,
  HeartHandshake,
  MessageCircle,
  Quote,
  Sparkles
} from "lucide-react";
import { currentMeeting } from "@/data/currentMeeting";
import { RemiGuide } from "@/components/RemiGuide";
import { MeetRemi } from "@/components/MeetRemi";
import { ReadingJourneyFlow } from "@/components/ReadingJourneyFlow";

export const metadata: Metadata = {
  title: "READ ME 소개",
  description: "책을 통해 나를 읽고, 서로를 만나며, 삶의 방향을 찾아가는 READ ME의 이야기와 철학을 소개합니다.",
  alternates: { canonical: "/about" }
};

const nameMeanings = [
  {
    number: "01",
    title: "READ ME",
    subtitle: "나를 읽어주세요",
    text: "책이 먼저 ‘나를 읽어주세요’라고 말을 건넵니다. READ ME의 안내자 리미도 책 곁에서 질문을 건네며, 한 권의 책과 독자가 만나는 여정을 함께 시작합니다."
  },
  {
    number: "02",
    title: "Read Yourself",
    subtitle: "책을 통해 나를 알아가다",
    text: "책을 읽는 이유도, 다른 사람과 이야기하는 이유도 결국은 나를 조금 더 이해하기 위해서입니다. Read Books에서 시작해 Read Yourself로 나아갑니다."
  },
  {
    number: "03",
    title: "README.md",
    subtitle: "각자의 삶에 대한 설명서를 쓰다",
    text: "개발에서 README.md는 프로젝트가 무엇이고 왜 만들어졌는지 알려주는 설명서입니다. 하지만 삶에는 정해진 README가 없습니다. 내가 어떤 사람이고 어떤 삶을 원하는지는 책과 사람을 만나며 스스로 써 내려가야 합니다."
  }
] as const;

const values = [
  {
    icon: BookOpen,
    title: "사유",
    subtitle: "좋은 질문으로 나를 이해하는 시간",
    text: "몇 권을 읽었는지보다, 한 권의 책이 남긴 질문 앞에 머물며 무엇을 생각하게 되었는지를 중요하게 여깁니다. 타인의 답이 아닌 나의 답을 자신의 언어로 찾아가는 힘을 중요하게 생각합니다."
  },
  {
    icon: MessageCircle,
    title: "대화",
    subtitle: "존중과 경청으로 생각을 넓히는 시간",
    text: "대화는 정답을 맞히는 토론이 아닙니다. 누구의 생각도 쉽게 평가하지 않고 서로 다른 경험과 가치관을 끝까지 들으며, 내가 미처 보지 못한 세계를 만나는 과정입니다."
  },
  {
    icon: HeartHandshake,
    title: "관계",
    subtitle: "혼자가 아니라 함께 나아가는 힘",
    text: "무엇을 읽는지만큼 누구와 이야기하는지가 중요합니다. READ ME는 존중과 경청 속에서 좋은 사람들과 깊은 대화를 나눕니다. 한 번의 만남으로 끝내지 않고, 함께 나눈 생각과 관계가 기수 이후에도 이어지는 경험을 만듭니다."
  }
] as const;

const cultureWords = ["존중", "경청", "수용", "솔직함", "따뜻함", "성장하려는 마음"] as const;

const differences = [
  {
    title: "질문에서 시작하는 깊은 대화",
    text: <>책을 얼마나 읽었는지보다, 한 문장이 내 삶에 남긴 질문에서 대화를 시작합니다.<br />가이드가 일방적으로 이야기하는 모임이 아니라, 각자의 생각을 충분히 펼칠 수 있도록 회차별 질문을 설계합니다.</>
  },
  {
    title: "누구와 이야기하는가",
    text: <>좋은 대화는 어떤 책을 읽는가만큼 누구와 함께하는가도 중요합니다.<br />READ ME는 인터뷰를 통해 서로 다른 생각을 존중하며 편안하게 대화할 수 있는 사람들과 만납니다.</>
  },
  {
    title: "삶을 연결한 커리큘럼",
    text: <>관계, 나, 변화, 감정, 일과 건강은 서로 독립적인 주제가 아닙니다.<br />한 기수에서 하나의 주제만 탐구하는 게 아니라 여러 회차를 따라 질문을 연결하며 삶을 입체적으로 탐색합니다.</>
  },
  {
    title: "하나의 공간에서 이어지는 경험",
    text: <>신청부터 일정, 질문, 기록, 기수 커뮤니티까지 여러 곳에 흩어지지 않고 하나의 웹 공간에서 자연스럽게 이어집니다.</>
  },
  {
    title: "한 번으로 끝나지 않는 연결",
    text: <>읽고, 생각하고, 이야기하고, 기록한 경험이 한 기수 뒤에도 사람과 커뮤니티로 이어질 수 있도록 만듭니다.</>
  },
  {
    title: "납득할 수 있는 가격",
    text: <>비싼 모임이 반드시 좋은 경험을 만든다고 생각하지 않습니다.<br />가격보다 실제 경험과 남는 가치를 중요하게 생각합니다.</>
  }
] as const;

export default function AboutPage() {
  return (
    <main className="about-page">
      <section className="about-hero section-shell">
        <div className="about-hero__copy">
          <p className="eyebrow">ABOUT READ ME</p>
          <h1>왜 우리는<br /><em>함께 읽을까요?</em></h1>
          <p className="about-hero__lead">책을 읽는 것을 넘어 나를 읽고,<br />서로의 이야기를 통해 다시 삶으로 나아가는 곳.</p>
        </div>
        <div className="about-hero__visual">
          <span className="about-hero__remi-label">READ ME의 안내자, 리미</span>
          <RemiGuide compact />
          <p>나를 읽다.<br />서로를 읽다.<br />삶을 읽다.</p>
        </div>
      </section>

      <section id="about-identity" className="about-section about-identity">
        <div className="section-shell about-story-grid">
          <div className="about-section-heading">
            <span>01</span>
            <p className="eyebrow">WHAT IS READ ME</p>
            <h2>책을 읽는 것을 넘어,<br />나를 읽는 독서모임.</h2>
          </div>
          <div className="about-prose">
            <p className="about-prose__lead">READ ME는 책 속의 정답을 배우는 곳이 아닙니다.</p>
            <p>책을 통해 질문하고, 자신의 생각을 발견하고, 다른 사람의 삶과 관점을 만나며 각자의 삶의 방향을 찾아가는 독서 커뮤니티입니다.</p>
            <p>빠르게 변하는 세상 속에서 우리는 남과 비교하고 타인의 시선을 살피느라 정작 <strong>“나는 어떻게 살고 싶은가?”</strong>를 묻는 시간을 자주 놓칩니다. READ ME는 잠시 멈춰 나를 들여다보고, 비슷한 질문을 품은 사람들과 함께 생각할 수 있는 시간을 만듭니다.</p>
            <div className="about-definition"><CircleDot size={17} /><span>책을 많이 읽는 것보다, 책을 통해 나와 서로를 더 깊이 이해하는 것.</span></div>
          </div>
        </div>
      </section>

      <section className="about-section about-why">
        <div className="section-shell about-why__grid">
          <div className="about-section-heading about-section-heading--light">
            <span>02</span>
            <p className="eyebrow">WHY WE STARTED</p>
            <h2>왜 READ ME를<br />만들었나요?</h2>
          </div>
          <div className="about-why__story">
            <Quote size={30} strokeWidth={1.4} />
            <blockquote>혼자 고민하고 방황할 때보다,<br />비슷한 고민을 가진 사람들과 이야기하고 나면<br />머리가 맑아지고 다시 나아갈 힘이 생겼습니다.</blockquote>
            <div>
              <p>누군가가 대신 삶의 답을 알려준 것은 아니었습니다. 다만 내 이야기를 꺼내고, 다른 사람의 경험을 들으며 내가 진짜 고민하던 것이 무엇인지 조금 더 선명하게 볼 수 있었습니다.</p>
              <p>그 경험에서 READ ME가 시작되었습니다.</p>
            </div>
            <strong>삶의 답은 결국 내가 찾아야 합니다.<br />하지만 그 과정을 혼자 걸을 필요는 없습니다.</strong>
          </div>
        </div>
      </section>

      <section className="about-section about-process">
        <div className="section-shell">
          <div className="about-process__heading">
            <div className="about-section-heading about-section-heading--light">
              <span>03</span>
              <p className="eyebrow">HOW IT FLOWS</p>
              <h2>책에서 시작해,<br />삶으로 돌아갑니다.</h2>
            </div>
            <p>READ ME의 목적은 책을 많이 읽게 만드는 데 있지 않습니다. 한 권의 책을 매개로 나를 이해하고, 다른 사람을 이해하며, 삶을 조금 더 잘 살아가는 데 있습니다.</p>
          </div>
          <ReadingJourneyFlow className="about-process-flow" />
          <Link href="/meeting#program-guide" className="about-process__link">실제 1기 진행 방식 자세히 보기 <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="about-section about-values">
        <div className="section-shell">
          <div className="about-section-heading">
            <span>04</span>
            <p className="eyebrow">OUR VALUES</p>
            <p className="about-section-heading__context">READ ME가 중요하게 생각하는 3가지 가치</p>
            <h2>사유 · 대화 · 관계</h2>
          </div>
          <div className="about-value-grid">
            {values.map(({ icon: Icon, ...value }) => (
              <article key={value.title}>
                <div className="about-value-grid__icon"><Icon size={24} strokeWidth={1.5} /></div>
                <p>{value.title}</p>
                <h3>{value.subtitle}</h3>
                <span>{value.text}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section about-difference">
        <div className="section-shell about-difference__grid">
          <div className="about-section-heading">
            <span>05</span>
            <p className="eyebrow">WHY DIFFERENT</p>
            <h2>READ ME가<br />다르게 생각하는 것</h2>
            <p className="about-section-heading__lead">좋은 책, 좋은 사람, 연결된 질문과 기록이 하나의 경험이 되도록 설계합니다.<br />독서모임을 3년간 직접 운영하며, 운영의 편의보다 멤버가 실제로 느끼고 얻어가는 경험을 먼저 생각해 필요한 방식을 다듬었습니다.</p>
          </div>
          <ol>
            {differences.map((difference, index) => (
              <li key={difference.title}>
                <span>0{index + 1}</span>
                <div><h3>{difference.title}</h3><p>{difference.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="about-section about-name">
        <div className="section-shell">
          <div className="about-section-heading about-section-heading--center">
            <span>06</span>
            <p className="eyebrow">THE NAME</p>
            <h2>READ ME라는 이름에<br />담긴 세 가지 이야기</h2>
          </div>
          <div className="about-name-grid">
            {nameMeanings.map((meaning) => (
              <article key={meaning.number}>
                <span>{meaning.number}</span>
                <p>{meaning.title}</p>
                <h3>{meaning.subtitle}</h3>
                <div />
                <small>{meaning.text}</small>
              </article>
            ))}
          </div>
          <MeetRemi />
        </div>
      </section>

      <section className="about-section about-culture">
        <div className="section-shell about-culture__grid">
          <div>
            <div className="about-section-heading">
              <span>07</span>
              <p className="eyebrow">PEOPLE & CULTURE</p>
              <h2>잘난 사람이 아니라,<br />잘 대화할 수 있는 사람.</h2>
            </div>
            <div className="about-culture__copy">
              <p>같은 책을 읽어도 누구와 함께 읽느냐에 따라 모임은 전혀 달랐습니다. 결국 오래 남은 것은 책의 내용만이 아니라, 서로의 생각을 편하게 꺼내고 받아준 사람들이었습니다.</p>
              <p>READ ME가 말하는 좋은 사람은 답을 많이 아는 사람이 아닙니다. 자신의 생각을 솔직하게 말하면서도 다른 사람의 이야기를 끝까지 듣고, 다름을 틀림으로 단정하지 않는 사람입니다. 지적인 이야기를 잘하는 것만큼 서로의 삶과 고민을 편하게 꺼낼 수 있는 따뜻한 분위기를 중요하게 생각합니다.</p>
            </div>
            <div className="about-culture__words">{cultureWords.map((word) => <span key={word}>{word}</span>)}</div>
          </div>
          <aside className="about-interview-card">
            <Sparkles size={25} strokeWidth={1.5} />
            <p className="eyebrow">WHY INTERVIEW</p>
            <h3>인터뷰는 사람을 걸러내기 위한 면접이 아닙니다.</h3>
            <p>서로가 기대하는 모임의 방식과 대화 태도를 나누고, READ ME가 중요하게 생각하는 문화를 함께 만들 수 있을지 알아가는 짧은 대화입니다.</p>
            <Link href="/interview">인터뷰 안내 보기 <ArrowRight size={16} /></Link>
          </aside>
        </div>
      </section>

      <section className="about-finale">
        <div className="section-shell about-finale__inner">
          <p className="eyebrow">READ BOOKS. READ YOURSELF.</p>
          <h2>나를 읽다.<br />서로를 읽다.<br />삶을 읽다.</h2>
          <p>당신의 다음 질문을 READ ME에서 만나보세요.<br />첫걸음은 편안한 인터뷰로 시작해요.</p>
          <div className="cta-actions">
            <Link href={currentMeeting.applyHref} className="button button--light">{currentMeeting.applyLabel} <ArrowRight size={16} /></Link>
            <Link href="/meeting" className="button button--outline-light">{currentMeeting.meetingLabel}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
