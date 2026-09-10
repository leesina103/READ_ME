import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock3, HeartHandshake, MessageCircle, NotebookPen, Repeat, UsersRound } from "lucide-react";
import { AfterSeasonCarousel } from "@/components/AfterSeasonCarousel";
import { MeetRemi } from "@/components/MeetRemi";
import { SectionTitle } from "@/components/SectionTitle";
import { StoryCarousel } from "@/components/StoryCarousel";
import { TalkRoomPreview } from "@/components/TalkRoomPreview";
import { currentMeeting } from "@/data/currentMeeting";
import { currentTheme } from "@/data/themes";
import { coreDifferences } from "@/data/differences";
import { MultilineText } from "@/components/MultilineText";
import { storyClosing, storySourceNote } from "@/data/stories";

const meetingFacts = [
  { icon: CalendarDays, value: currentMeeting.schedule.duration, label: "한 기수" },
  { icon: Repeat, value: currentMeeting.schedule.cadence, label: "진행 주기" },
  { icon: Clock3, value: currentMeeting.schedule.sessionDuration, label: "오프라인 회차별" },
  { icon: UsersRound, value: currentMeeting.schedule.groupSize, label: "한 그룹 · 소규모" }
];

const people = [
  "자신의 생각을 더 깊게 들여다보고 싶은 사람",
  "다른 사람의 생각과 삶이 궁금한 사람",
  "나와 다른 생각도 존중하며 들을 수 있는 사람",
  "반복되는 일상에 새로운 질문과 만남이 필요한 사람",
  "자신의 삶을 조금 더 잘 살아보고 싶은 사람"
];

const faqs = [
  { question: "독서모임이 처음인데 괜찮나요?", answer: "물론입니다. 잘 말하는 능력보다 다른 사람의 이야기를 존중하며 듣는 마음이면 충분합니다." },
  { question: "책을 꼭 완독해야 하나요?", answer: "깊은 대화를 위해 완독하는 걸 권장합니다. 하지만 시간이 안 된다면, 사전 질문에 대해 깊게 생각해오는 것만으로 충분합니다." },
  { question: "혼자 참여해도 괜찮나요?", answer: "네. 대부분 혼자 신청합니다. 처음 만난 사람도 편안히 이야기할 수 있도록 소규모로 진행합니다." },
  { question: "인터뷰는 왜 하나요?", answer: "평가가 아니라 서로 기대하는 모임의 방식과 대화 태도가 잘 맞는지 확인하는 짧은 사전 대화입니다.", href: "/interview" },
  { question: "한 기수는 어떻게 진행되나요?", answer: "격주로 네 번 만나며, 매 회차 책 읽기와 사전 질문, 오프라인 대화, 기록의 순서로 이어집니다." }
];

const detailLinks = [
  { href: "/about", eyebrow: "ABOUT", title: "READ ME는 어떤 곳인가요?", text: "READ ME가 시작된 이유와 중요하게 생각하는 가치를 소개합니다.", icon: HeartHandshake },
  { href: "/meeting", eyebrow: "MEETING", title: `${currentMeeting.cohort}는 어떻게 진행되나요?`, text: `모집 정보부터 ${currentMeeting.schedule.duration}의 진행 방식과 커리큘럼까지 확인합니다.`, icon: CalendarDays },
  { href: `/themes/${currentTheme.slug}`, eyebrow: "CURRENT THEME", title: "어떤 책과 질문을 만나나요?", text: `${currentMeeting.cohort} ${currentTheme.name} 주제에 담긴 네 번의 질문을 자세히 살펴봅니다.`, icon: MessageCircle },
  { href: "/themes#themes", eyebrow: "ALL THEMES", title: "다른 주제들도 보고 싶어요", text: "READ ME가 앞으로 함께 읽고 이야기할 주제를 둘러봅니다.", icon: Repeat },
];

export function HomePage() {
  return (
    <main>
      <section className="hero section-shell">
        <div className="hero__copy">
          <p className="eyebrow">READ ME · BOOK COMMUNITY</p>
          <h1>Read Books.<br /><em>Read Yourself.</em></h1>
          <p className="hero__lead">책을 통해 나를 읽고,<br />결이 맞는 사람을 만나고,<br />삶의 방향을 찾아가는 독서 커뮤니티.</p>
          <div className="button-row hero__actions">
            <Link href="/meeting" className="button button--primary">{currentMeeting.meetingLabel} <ArrowRight size={16} /></Link>
            <Link href={currentMeeting.applyHref} className="button button--ghost">{currentMeeting.applyLabel}</Link>
          </div>
          <Link href="/interview" className="text-link hero__interview-link">인터뷰가 궁금하다면? 인터뷰 안내 보기 <ArrowRight size={15} /></Link>
        </div>
        <blockquote className="hero__quote">“나를 읽다.<br />서로를 읽다.<br />삶을 읽다.”</blockquote>
      </section>

      <section className="section meeting-format-section"><div className="section-shell">
        <SectionTitle eyebrow="HOW IT WORKS" title={<>{currentMeeting.schedule.duration} 동안,<br />함께 깊게 읽습니다.</>} />
        <div className="meeting-overview">
          <div className="meeting-facts">{meetingFacts.map(({ icon: Icon, ...fact }) => <article key={fact.label}><Icon size={20} strokeWidth={1.5} /><strong>{fact.value}</strong><span>{fact.label}</span></article>)}</div>
          <div className="meeting-rhythm">
            <div className="meeting-rhythm__step"><span>1주차 · INPUT</span><strong>오프라인 토의</strong><p>책과 질문으로 깊게 대화합니다.</p></div>
            <ArrowRight className="meeting-rhythm__arrow" size={22} aria-hidden="true" />
            <div className="meeting-rhythm__step"><span>2주차 · OUTPUT</span><strong>온라인 실천과 기록</strong><p>대화에서 얻은 생각을 삶에 가져와 적용하고 기록합니다.</p></div>
            <div className="meeting-rhythm__repeat"><Repeat size={17} aria-hidden="true" /><strong>이 흐름을 4번 반복</strong></div>
          </div>
        </div>
        <div className="participation-flow"><strong>참여 흐름</strong><p>책 읽기 <ArrowRight size={15} /> 사전 질문 <ArrowRight size={15} /> 오프라인 대화 <ArrowRight size={15} /> 기록 <ArrowRight size={15} /> 온라인 세션</p></div>
        <div className="home-talk-preview"><div><div className="home-talk-preview__label"><p className="eyebrow">READ ME TALK ROOM</p><span>사전 질문 예시</span></div><h3>대화에서 얻은 생각을<br />온라인에서 이어갑니다.</h3><p>책을 읽으며 떠오른 생각을 먼저 적고, 함께 나눈 대화를 삶에 적용해 기록합니다.</p></div><TalkRoomPreview /></div>
        <article className="season-current">
          <div className="season-current__label"><p className="eyebrow">CURRENT SEASON</p>{currentMeeting.recruiting && <span className="season-current__badge">{currentMeeting.recruitingLabel}</span>}</div>
          <h3>{currentMeeting.cohort} — {currentTheme.name}, {currentTheme.subtitle}</h3>
          <ol className="season-current__questions">{currentTheme.sessions.map((session, index) => <li key={session.title}><span className="season-current__num">{String(index + 1).padStart(2, "0")}</span><span className="season-current__topic">{session.title}</span><span className="season-current__q">{session.question}</span><span className="season-current__book">『{session.book}』</span></li>)}</ol>
          <div className="season-current__actions"><Link href={`/themes/${currentTheme.slug}`} className="button button--primary">{currentTheme.name} 주제 자세히 보기 <ArrowRight size={15} /></Link><Link href="/meeting" className="button button--ghost">{currentMeeting.cohort} 상세 안내 보기</Link></div>
          <p className="season-current__next">READ ME는 매 기수 새로운 주제와 질문으로 진행합니다.</p>
          <Link href="/themes#themes" className="button button--ghost season-current__themes">전체 주제 보기 <ArrowRight size={15} /></Link>
        </article>
      </div></section>

      <section className="section section--paper intro-remi-section"><div className="section-shell"><MeetRemi priority /></div></section>

      <section className="section why-section"><div className="section-shell why-layout">
        <div className="why-section__intro">
          <p className="eyebrow">WHY READ ME</p>
          <h2>READ ME가<br />다르게 생각하는 것</h2>
          <p className="why-section__origin">독서모임을 3년간 직접 해보며, 깊은 대화를 위해 필요한 3가지를 남겼습니다.</p>
        </div>
        <div className="why-section__details">
          <div className="difference-list">{coreDifferences.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.keyword}</small><h3>{item.title}</h3><MultilineText lines={item.lines} /></div></article>)}</div>
          <Link href="/about" className="button button--ghost why-section__link">READ ME의 전체 이야기 보기 <ArrowRight size={15} /></Link>
        </div>
      </div></section>

      <section id="after-season" className="section connection-section"><div className="section-shell"><div className="season-guide"><p className="eyebrow">AFTER THE SEASON</p><h2>한 기수가 끝나도,<br />관계까지 끝나지는 않도록.</h2></div><AfterSeasonCarousel /></div></section>

      <section className="section people-section"><div className="section-shell people-layout"><div><p className="eyebrow">RECOMMENDED FOR</p><h2>이런 사람에게<br />READ ME를 추천해요.</h2><blockquote>정답을 가진 사람보다,<br />질문을 가진 사람을 위한 모임입니다.</blockquote></div><ul>{people.map((person) => <li key={person}><Check size={17} /> {person}</li>)}</ul></div></section>

      <section className="section story-section"><div className="section-shell"><SectionTitle eyebrow="STORY" title="실제 사람들이 느낀 것" description={storySourceNote} /><StoryCarousel /><p className="story-closing">{storyClosing}</p><Link href="/story" className="button button--ghost story-link">전체 후기 보기 <ArrowRight size={16} /></Link></div></section>

      <section className="section detail-links-section"><div className="section-shell"><SectionTitle eyebrow="EXPLORE READ ME" title="궁금한 이야기부터 살펴보세요." /><div className="detail-link-grid">{detailLinks.map(({ icon: Icon, ...item }) => <Link key={item.href} href={item.href}><Icon size={22} strokeWidth={1.5} /><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.text}</p><span>자세히 보기 <ArrowRight size={14} /></span></Link>)}</div></div></section>

      <section className="section faq-section"><div className="section-shell faq-layout"><div><p className="eyebrow">FAQ</p><h2>참여하기 전에<br />궁금한 것들</h2><p>처음이라도 편안하게 시작할 수 있도록 자주 묻는 내용을 정리했습니다.</p></div><div className="faq-list">{faqs.map((item, index) => <details key={item.question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}<i>+</i></summary><p>{item.answer}{item.href && <><br /><Link href={item.href} className="faq-answer-link">인터뷰 안내 자세히 보기 <ArrowRight size={14} /></Link></>}</p></details>)}</div></div></section>

      <section className="section cta-section"><div className="section-shell cta-card cta-card--compact-title"><NotebookPen size={30} strokeWidth={1.4}/><p className="eyebrow">AN INVITATION</p><h2>삶의 답은 내가 찾지만,<br />그 과정을 혼자 걸을 필요는 없으니까.</h2><p>READ ME와 함께하는 첫걸음,<br />편안한 인터뷰로 시작해요.</p><div className="cta-actions"><Link href={currentMeeting.applyHref} className="button button--light">{currentMeeting.applyLabel} <ArrowRight size={16} /></Link><Link href="/meeting" className="button button--outline-light">{currentMeeting.meetingLabel}</Link></div></div></section>
    </main>
  );
}
