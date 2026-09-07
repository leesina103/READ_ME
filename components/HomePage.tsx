import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Check, Clock3, HeartHandshake, MessageCircle, NotebookPen, Repeat, UsersRound } from "lucide-react";
import { MeetRemi } from "@/components/MeetRemi";
import { ReadingJourneyFlow } from "@/components/ReadingJourneyFlow";
import { SectionTitle } from "@/components/SectionTitle";
import { TalkRoomPreview } from "@/components/TalkRoomPreview";
import { currentMeeting } from "@/data/currentMeeting";
import { currentTheme } from "@/data/themes";
import { readingGroupStories, storyClosing, storySourceNote } from "@/data/stories";

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

const principles = [
  "가이드가 일방적으로 이야기하는 모임을 만들지 않습니다.",
  "한 번 만나고 끝나는 관계만을 만들고 싶지 않습니다.",
  "사람 수만 늘리는 것을 목표로 하지 않습니다.",
  "비싼 가격이 곧 좋은 경험이라고 생각하지 않습니다.",
  "가격보다 실제 경험과 남는 가치를 중요하게 생각합니다."
];

const differences = [
  { number: "01", keyword: "DEEP TALK", title: "질문에서 시작하는 깊은 대화", text: <>책을 얼마나 읽었는지보다, 한 문장이 내 삶에 남긴 질문에서 대화를 시작합니다.<br />가이드는 각자의 생각을 충분히 펼칠 수 있도록 회차별 질문을 설계합니다.</> },
  { number: "02", keyword: "PEOPLE", title: "누구와 이야기하는가", text: <>좋은 대화는 어떤 책을 읽는가만큼 누구와 함께하는가도 중요합니다.<br />READ ME는 인터뷰를 통해 서로 다른 생각을 존중하며 편안하게 대화할 수 있는 사람들과 만납니다.</> },
  { number: "03", keyword: "CONNECTED FLOW", title: "삶을 연결한 커리큘럼", text: <>관계, 나, 변화, 감정, 일과 건강은 서로 독립적인 주제가 아닙니다.<br />한 기수에서 하나의 주제만 탐구하는게 아닌 여러 회차를 따라 질문을 연결하며 삶을 입체적으로 탐색합니다.</> }
];

const faqs = [
  { question: "책을 꼭 완독해야 하나요?", answer: "깊은 대화를 위해 완독하는 걸 권장합니다. 하지만 시간이 안 된다면, 사전 질문에 대해 깊게 생각해오는 것만으로 충분합니다." },
  { question: "혼자 참여해도 괜찮나요?", answer: "네. 대부분 혼자 신청합니다. 처음 만난 사람도 편안히 이야기할 수 있도록 소규모로 진행합니다." },
  { question: "독서모임이 처음인데 괜찮나요?", answer: "물론입니다. 잘 말하는 능력보다 다른 사람의 이야기를 존중하며 듣는 마음이면 충분합니다." },
  { question: "인터뷰는 왜 하나요?", answer: "평가가 아니라 서로 기대하는 모임의 방식과 대화 태도가 잘 맞는지 확인하는 짧은 사전 대화입니다.", href: "/interview" },
  { question: "한 기수는 어떻게 진행되나요?", answer: "격주로 네 번 만나며, 매 회차 책 읽기와 사전 질문, 오프라인 대화, 기록의 순서로 이어집니다." }
];

const detailLinks = [
  { href: "/about", eyebrow: "ABOUT", title: "READ ME는 어떤 곳인가요?", text: "READ ME가 시작된 이유와 중요하게 생각하는 가치를 소개합니다.", icon: HeartHandshake },
  { href: "/meeting", eyebrow: "MEETING", title: "1기는 어떻게 진행되나요?", text: "모집 정보부터 8주의 진행 방식과 커리큘럼까지 확인합니다.", icon: CalendarDays },
  { href: `/themes/${currentTheme.slug}`, eyebrow: "CURRENT THEME", title: "어떤 책과 질문을 만나나요?", text: "1기 관계 주제에 담긴 네 번의 질문을 자세히 살펴봅니다.", icon: MessageCircle },
  { href: "/themes", eyebrow: "ALL THEMES", title: "다른 주제들도 보고 싶어요", text: "READ ME가 앞으로 함께 읽고 이야기할 주제를 둘러봅니다.", icon: Repeat },
  { href: "/story", eyebrow: "STORY", title: "함께 읽은 사람들의 이야기", text: "독서모임을 경험한 사람들이 발견한 함께 읽기의 가치를 만납니다.", icon: BookOpen }
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
            <Link href="/meeting" className="button button--primary">1기 모집 정보 보기 <ArrowRight size={16} /></Link>
            <Link href="/interview/apply" className="button button--ghost">인터뷰 신청하기</Link>
          </div>
          <Link href="/interview" className="text-link hero__interview-link">인터뷰가 궁금하다면? 인터뷰 안내 보기 <ArrowRight size={15} /></Link>
        </div>
        <blockquote className="hero__quote">“나를 읽다.<br />서로를 읽다.<br />삶을 읽다.”</blockquote>
      </section>

      <section className="section meeting-format-section"><div className="section-shell">
        <SectionTitle eyebrow="HOW IT WORKS" title={<>8주 동안,<br />함께 깊게 읽습니다.</>} />
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
        <div className="home-talk-preview"><div><div className="home-talk-preview__label"><p className="eyebrow">READ ME TALK ROOM</p><span>사전 질문 예시</span></div><h3>대화에서 얻은 생각을<br />웹에서 이어갑니다.</h3><p>책을 읽으며 떠오른 생각을 먼저 적고, 함께 나눈 대화를 삶에 적용해 기록합니다.</p></div><TalkRoomPreview /></div>
        <article className="season-current">
          <div className="season-current__label"><p className="eyebrow">CURRENT SEASON</p>{currentMeeting.recruiting && <span className="season-current__badge">{currentMeeting.recruitingLabel}</span>}</div>
          <h3>{currentMeeting.cohort} — {currentTheme.name}, {currentTheme.subtitle}</h3>
          <ol className="season-current__questions">{currentTheme.sessions.map((session, index) => <li key={session.title}><span className="season-current__num">{String(index + 1).padStart(2, "0")}</span><span className="season-current__topic">{session.title}</span><span className="season-current__q">{session.question}</span><span className="season-current__book">《{session.book}》</span></li>)}</ol>
          <div className="season-current__actions"><Link href={`/themes/${currentTheme.slug}`} className="button button--primary">{currentTheme.name} 주제 자세히 보기 <ArrowRight size={15} /></Link><Link href="/meeting" className="button button--ghost">1기 상세 안내 보기</Link></div>
          <p className="season-current__next">READ ME는 매 기수 새로운 주제와 질문으로 진행합니다.</p>
          <Link href="/themes" className="button button--ghost season-current__themes">전체 주제 보기 <ArrowRight size={15} /></Link>
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
          <div className="difference-list">{differences.map((item) => <article key={item.number}><span>{item.number}</span><div><small>{item.keyword}</small><h3>{item.title}</h3><p>{item.text}</p></div></article>)}</div>
          <Link href="/about" className="button button--ghost why-section__link">READ ME의 전체 이야기 보기 <ArrowRight size={15} /></Link>
        </div>
      </div></section>

      <section className="section connection-section"><div className="section-shell"><div className="season-guide"><p className="eyebrow">AFTER THE SEASON</p><h2>한 기수가 끝나도,<br />관계까지 끝나지는 않도록.</h2></div><ul className="season-cycle connection-cycle">
        <li><div className="season-cycle__text"><div className="season-cycle__head"><span>언제든 · 나의 서재</span><h3>기록 보관</h3></div><div className="season-cycle__body"><p>온라인에서 나눈 질문과 서로의 답변을 언제든 다시 꺼내볼 수 있도록 남깁니다.</p></div></div><figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-work.png" alt="책상에서 기록을 남기는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure></li>
        <li><div className="season-cycle__text"><div className="season-cycle__head"><span>기수가 끝난 뒤 · 오프라인</span><h3>READ ME 파티</h3></div><div className="season-cycle__body"><p>함께 읽은 사람들이 한자리에 모여, 못다 한 이야기를 얼굴 보며 나눕니다.<br />같은 기수여도 그룹이 달라 만나지 못했던 사람들과, 읽었던 책부터 책 너머의 다양한 이야기까지 대화를 이어갑니다.</p></div></div><figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-relationship.png" alt="컵을 들고 마주 앉아 이야기 나누는 리미들" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure></li>
        <li><div className="season-cycle__text"><div className="season-cycle__head"><span>한 기수 이후 · 멤버십</span><h3>READ ME 멤버십</h3></div><div className="season-cycle__body"><p>한 기수를 마친 뒤에도 전 기수의 멤버들과 다양한 활동으로 계속 만날 수 있도록 멤버십으로 연결합니다.</p></div></div><figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-emotion.png" alt="다양한 감정을 마주하며 자신을 살피는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure></li>
        <li><div className="season-cycle__text"><div className="season-cycle__head"><span>전 기수와 함께 · 온라인</span><h3>멤버십 커뮤니티</h3></div><div className="season-cycle__body"><p>함께한 기수가 달라도, 다음 질문과 일상을 나누며 서로의 생각과 변화를 이어갑니다.</p><p>인생책을 소개하거나 직접 쓴 글을 공유하는 등, 각자의 읽기와 쓰기를 편하게 나눌 수 있는 커뮤니티를 운영합니다.</p></div></div><figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-change.png" alt="징검다리를 건너며 새싹에 물을 주는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure></li>
        <li><div className="season-cycle__text"><div className="season-cycle__head"><span>원하는 책으로 · 멤버십 오프라인</span><h3>멤버십 북토의</h3></div><div className="season-cycle__body"><p>정해진 커리큘럼을 벗어나, 멤버들이 직접 고른 책으로 자유롭게 토의합니다.</p></div></div><figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-self.png" alt="책상에 앉아 원하는 책을 읽고 기록하는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure></li>
        <li><div className="season-cycle__text"><div className="season-cycle__head"><span>멤버가 만드는 · 온·오프라인</span><h3>자유로운 소모임</h3></div><div className="season-cycle__body"><p>전시, 영화, 산책부터 취향과 관심사를 나누는 모임까지, 멤버들이 자유롭게 제안하고 함께합니다.</p></div></div><figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-life.png" alt="나무 아래 돗자리에서 쉬는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" /></div></figure></li>
      </ul></div></section>

      <section className="section intro-section"><div className="section-shell"><SectionTitle eyebrow="ABOUT READ ME" title={<>책에서 시작해,<br />삶으로 돌아갑니다.</>} /><ReadingJourneyFlow className="reading-flow" /><div className="intro-note"><Link href="/about" className="text-link">READ ME의 전체 이야기 보기 <ArrowRight size={15} /></Link></div></div></section>

      <section className="section people-section"><div className="section-shell people-layout"><div><p className="eyebrow">PEOPLE WE WELCOME</p><h2>이런 사람들과<br />함께하고 싶어요.</h2><blockquote>정답을 가진 사람보다,<br />질문을 가진 사람을 환영합니다.</blockquote></div><ul>{people.map((person) => <li key={person}><Check size={17} /> {person}</li>)}</ul></div></section>

      <section className="section principle-section"><div className="section-shell principle-layout"><div><p className="eyebrow">WHAT WE BELIEVE</p><h2>우리가 만들지 않는 모임</h2><p>무엇을 하지 않을지 분명히 하는 것도 READ ME다운 경험을 만드는 방법이라고 믿습니다.</p></div><ol>{principles.map((principle, index) => <li key={principle}><span>{String(index + 1).padStart(2, "0")}</span><p>{principle}</p></li>)}</ol></div></section>

      <section className="section story-section"><div className="section-shell"><SectionTitle eyebrow="STORY" title="실제 사람들이 느낀 것" description={storySourceNote} /><div className="story-grid">{readingGroupStories.map((story, index) => <article key={story.name} className={story.longform ? "story-grid__item--featured" : undefined}><div className="story-grid__meta"><span>{String(index + 1).padStart(2, "0")}</span><strong>{story.name}</strong></div>{story.longform && <div className="story-grid__feature-heading"><h3>{story.longform.title}</h3><div>{story.longform.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div>}<blockquote>“{story.quote}”</blockquote>{story.text && <p className="story-grid__detail">{story.text}</p>}</article>)}</div><p className="story-closing">{storyClosing}</p><Link href="/story" className="button button--ghost story-link">전체 후기 보기 <ArrowRight size={16} /></Link></div></section>

      <section className="section detail-links-section"><div className="section-shell"><SectionTitle eyebrow="EXPLORE READ ME" title="궁금한 이야기부터 살펴보세요." /><div className="detail-link-grid">{detailLinks.map(({ icon: Icon, ...item }) => <Link key={item.href} href={item.href}><Icon size={22} strokeWidth={1.5} /><small>{item.eyebrow}</small><h3>{item.title}</h3><p>{item.text}</p><span>자세히 보기 <ArrowRight size={14} /></span></Link>)}</div></div></section>

      <section className="section faq-section"><div className="section-shell faq-layout"><div><p className="eyebrow">FAQ</p><h2>참여하기 전에<br />궁금한 것들</h2><p>처음이라도 편안하게 시작할 수 있도록 자주 묻는 내용을 정리했습니다.</p></div><div className="faq-list">{faqs.map((item, index) => <details key={item.question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}<i>+</i></summary><p>{item.answer}{item.href && <><br /><Link href={item.href} className="faq-answer-link">인터뷰 안내 자세히 보기 <ArrowRight size={14} /></Link></>}</p></details>)}</div></div></section>

      <section className="section cta-section"><div className="section-shell cta-card cta-card--compact-title"><NotebookPen size={30} strokeWidth={1.4}/><p className="eyebrow">AN INVITATION</p><h2>삶의 답은 내가 찾지만,<br />그 과정을 혼자 걸을 필요는 없으니까.</h2><p>우리는 정답을 알려드리지 않습니다. 대신 더 좋은 질문을 함께 찾고 싶습니다.</p><div className="cta-actions"><Link href="/meeting" className="button button--light">1기 모집 정보 보기 <ArrowRight size={16} /></Link><Link href="/interview/apply" className="button button--outline-light">인터뷰 신청하기</Link></div></div></section>
    </main>
  );
}
