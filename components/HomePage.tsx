import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Clock3,
  HeartHandshake,
  MapPin,
  MessageCircle,
  NotebookPen,
  Quote,
  UsersRound
} from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";
import { MeetRemi } from "@/components/MeetRemi";
import { ReadingJourneyFlow } from "@/components/ReadingJourneyFlow";

const values = [
  { icon: BookOpen, title: "사유", subtitle: "좋은 질문을 통해 나를 이해하는 시간", text: "책이 건넨 질문에 머물며 내 생각과 감정을 천천히 들여다봅니다." },
  { icon: MessageCircle, title: "대화", subtitle: "존중과 경청으로 생각의 경계를 넓히는 시간", text: "서로 다른 경험과 관점을 판단하지 않고 깊이 들으며, 나의 언어를 넓혀갑니다." },
  { icon: HeartHandshake, title: "관계", subtitle: "혼자가 아니라 함께 나아가는 것", text: "깊은 대화가 한 번의 만남에 그치지 않도록, 서로의 변화와 다음 질문을 응원합니다." }
];

const meetingFacts = [
  { icon: CalendarDays, value: "4회", label: "한 기수" },
  { icon: UsersRound, value: "최대 6명", label: "소규모" },
  { icon: CalendarDays, value: "격주", label: "진행 주기" },
  { icon: Clock3, value: "3시간", label: "회차별" },
  { icon: MapPin, value: "오프라인", label: "진행 방식" }
];

const people = [
  "자신의 생각을 더 깊게 들여다보고 싶은 사람",
  "다른 사람의 생각과 삶이 궁금한 사람",
  "나와 다른 생각도 존중하며 들을 수 있는 사람",
  "반복되는 일상에 새로운 질문과 만남이 필요한 사람",
  "자신의 삶을 조금 더 잘 살아보고 싶은 사람"
];

const principles = [
  "운영자가 일방적으로 이야기하는 모임을 만들지 않습니다.",
  "한 번 만나고 끝나는 관계만을 만들고 싶지 않습니다.",
  "사람 수만 늘리는 것을 목표로 하지 않습니다.",
  "비싼 가격이 곧 좋은 경험이라고 생각하지 않습니다.",
  "가격보다 실제 경험과 남는 가치를 중요하게 생각합니다."
];

const differences = [
  { number: "01", keyword: "DEEP TALK", title: "질문에서 시작하는 깊은 대화", text: "책을 얼마나 읽었는지보다, 한 문장이 내 삶에 남긴 질문에서 대화를 시작합니다. 운영진은 각자의 생각을 충분히 펼칠 수 있도록 회차별 질문을 설계합니다." },
  { number: "02", keyword: "PEOPLE", title: "누구와 이야기하는가", text: "좋은 대화는 어떤 책을 읽는가만큼 누구와 함께하는가도 중요합니다. READ ME는 인터뷰를 통해 서로 다른 생각을 존중하며 편안하게 대화할 수 있는 사람들과 만납니다." },
  { number: "03", keyword: "CONNECTED FLOW", title: "연결된 커리큘럼", text: "관계, 나, 변화, 감정, 일과 건강은 서로 독립적인 주제가 아닙니다. 한 기수의 여러 회차를 따라 질문을 연결하며 삶을 입체적으로 탐색합니다." },
  { number: "04", keyword: "ONE SPACE", title: "하나로 이어지는 경험", text: "신청부터 일정, 질문, 기록, 기수 커뮤니티까지 여러 곳에 흩어지지 않고 하나의 웹 공간에서 자연스럽게 이어집니다." }
];

const storyPlaceholders = [
  { theme: "나를 발견한 문장", text: "모임에서 발견한 나의 생각과 변화를 담을 자리입니다." },
  { theme: "다른 관점과의 만남", text: "누군가의 이야기가 내 생각을 넓힌 순간을 담을 자리입니다." },
  { theme: "모임 이후의 변화", text: "대화가 일상에 남긴 작은 움직임을 담을 자리입니다." }
];

const seasonSessions = [
  { order: 1, title: "존중", question: "우리는 서로를 어떻게 존중하는가?" },
  { order: 2, title: "인정", question: "모두에게 좋은 사람이어야 할까?" },
  { order: 3, title: "대화", question: "왜 우리는 자꾸 오해하는가?" },
  { order: 4, title: "사랑", question: "가까워진다는 것은 무엇인가?" }
];

const faqs = [
  ["책을 꼭 완독해야 하나요?", "아니요. 완독보다 읽은 만큼 솔직하게 질문을 가져오는 태도를 중요하게 생각합니다."],
  ["혼자 참여해도 괜찮나요?", "네. 대부분 혼자 신청합니다. 처음 만난 사람도 편안히 이야기할 수 있도록 소규모로 진행합니다."],
  ["독서모임이 처음인데 괜찮나요?", "물론입니다. 잘 말하는 능력보다 다른 사람의 이야기를 존중하며 듣는 마음이면 충분합니다."],
  ["인터뷰는 왜 하나요?", "평가가 아니라 서로 기대하는 모임의 방식과 대화 태도가 잘 맞는지 확인하는 짧은 사전 대화입니다."],
  ["한 기수는 어떻게 진행되나요?", "격주로 네 번 만나며, 매 회차 책 읽기와 사전 질문, 오프라인 대화, 기록의 순서로 이어집니다."],
  ["모임에 참석하지 못하면 어떻게 되나요?", "참석이 어려운 경우 가능한 한 미리 알려주세요. 세부 보강 및 환불 기준은 모집 안내에서 확인할 수 있습니다."],
  ["회비에는 무엇이 포함되나요?", "공간과 운영, 회차별 질문 설계, 모임 진행, 기수 기록 및 커뮤니티 경험이 포함됩니다. 도서는 별도입니다."]
];

export function HomePage() {
  return (
    <main>
      <section className="hero section-shell">
        <div className="hero__copy">
          <p className="eyebrow">READ ME · BOOK COMMUNITY</p>
          <h1>Read Books.<br /><em>Read Yourself.</em></h1>
          <p className="hero__lead">책을 통해 나를 읽고,<br />결이 맞는 사람을 만나고,<br />삶의 방향을 찾아가는 독서 커뮤니티.</p>
          <div className="button-row">
            <Link href="/meeting" className="button button--primary">현재 모임 보기 <ArrowRight size={16} /></Link>
            <Link href="/interview" className="button button--ghost">인터뷰 신청하기</Link>
          </div>
        </div>
        <blockquote className="hero__quote">“나를 읽다.<br />서로를 읽다.<br />삶을 읽다.”</blockquote>
      </section>

      <section className="section intro-section">
        <div className="section-shell">
          <SectionTitle eyebrow="ABOUT READ ME" title={<>책에서 시작해,<br />삶으로 돌아갑니다.</>} />
          <ReadingJourneyFlow className="reading-flow" />
          <div className="intro-note">
            <Link href="/about" className="text-link">READ ME의 전체 이야기 보기 <ArrowRight size={15} /></Link>
          </div>
        </div>
      </section>

      <section className="section section--paper intro-remi-section">
        <div className="section-shell">
          <MeetRemi priority />
        </div>
      </section>

      <section className="section values-section"><div className="section-shell">
        <SectionTitle eyebrow="OUR VALUES" title="사유 · 대화 · 관계" description="읽는 시간은 결국 나와 서로를 더 잘 이해하는 방향으로 이어집니다." />
        <div className="value-grid">{values.map(({ icon: Icon, ...value }) => <article key={value.title}><Icon size={24} strokeWidth={1.5} /><p>{value.title}</p><h3>{value.subtitle}</h3><span>{value.text}</span></article>)}</div>
      </div></section>

      <section className="section meeting-format-section"><div className="section-shell">
        <SectionTitle eyebrow="HOW IT WORKS" title="작고 깊게, 네 번의 만남" description="참여하기 전에 필요한 정보를 빠르게 확인해보세요." />
        <div className="meeting-facts">{meetingFacts.map(({ icon: Icon, ...fact }) => <article key={fact.label}><Icon size={20} strokeWidth={1.5} /><strong>{fact.value}</strong><span>{fact.label}</span></article>)}</div>
        <div className="participation-flow"><strong>참여 흐름</strong><p>책 읽기 <ArrowRight size={15} /> 사전 질문 <ArrowRight size={15} /> 오프라인 대화 <ArrowRight size={15} /> 기록 <ArrowRight size={15} /> 온라인 세션</p></div>
      </div></section>

      <section className="section why-section"><div className="section-shell">
        <SectionTitle eyebrow="WHY READ ME" title="질문에서 시작해, 삶에 남도록" description="좋은 책, 좋은 사람, 연결된 질문과 기록이 하나의 경험이 되도록 설계합니다." />
        <div className="difference-grid">{differences.map((item) => <article key={item.number}><span>{item.number} — {item.keyword}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </div></section>

      <section className="section season-section"><div className="section-shell">
        <div className="section-heading-row"><SectionTitle eyebrow="CURRENT SEASON" title="01기 — 관계, 함께 살아가는 법" description="존중·인정·대화·사랑이라는 네 가지 질문을 통해, 다른 사람과 함께 살아가는 방식을 탐구합니다." /><Link href="/meeting" className="text-link">커리큘럼 자세히 보기 <ArrowRight size={15} /></Link></div>
        <div className="session-list">{seasonSessions.map((session) => <article key={session.order}><span>{session.order}회</span><div><h3>{session.title}</h3><p>{session.question}</p></div><span className="session-list__dot">{String(session.order).padStart(2, "0")}</span></article>)}</div>
      </div></section>

      <section className="section connection-section"><div className="section-shell connection-layout">
        <div><p className="eyebrow">AFTER THE SEASON</p><h2>한 기수가 끝나도,<br />관계까지 끝나지는 않도록.</h2><p>읽기 → 생각하기 → 이야기하기 → 기록하기 → 다시 연결되기</p></div>
        <div className="connection-grid"><article><strong>기수별 커뮤니티</strong><p>함께 읽은 사람들과 다음 질문과 일상을 나눕니다.</p></article><article><strong>기록 보관</strong><p>마음에 남은 문장과 질문을 다시 꺼내볼 수 있게 남깁니다.</p></article><article><strong>작은 소모임</strong><p>전시, 영화, 산책, 독서 등 관심사를 따라 다시 만납니다.</p></article></div>
      </div></section>

      <section className="section people-section"><div className="section-shell people-layout">
        <div><p className="eyebrow">PEOPLE WE WELCOME</p><h2>이런 사람들과<br />함께하고 싶어요.</h2><blockquote>정답을 가진 사람보다,<br />질문을 가진 사람을 환영합니다.</blockquote></div>
        <ul>{people.map((person) => <li key={person}><Check size={17} /> {person}</li>)}</ul>
      </div></section>

      <section className="section principle-section"><div className="section-shell principle-layout">
        <div><p className="eyebrow">WHAT WE BELIEVE</p><h2>우리가 만들지 않는 모임</h2><p>무엇을 하지 않을지 분명히 하는 것도 READ ME다운 경험을 만드는 방법이라고 믿습니다.</p></div>
        <ol>{principles.map((principle, index) => <li key={principle}><span>{String(index + 1).padStart(2, "0")}</span><p>{principle}</p></li>)}</ol>
      </div></section>

      <section className="section story-section"><div className="section-shell">
        <SectionTitle eyebrow="STORY" title="대화가 남긴 이야기를 기록합니다." description="아직 실제 참여 후기가 쌓이기 전이라, 아래에는 앞으로 담길 이야기의 자리를 먼저 보여드립니다." />
        <div className="story-grid">{storyPlaceholders.map((story) => <article key={story.theme}><Quote size={23} strokeWidth={1.4} /><small>후기 자리 · 실제 참여 후기가 아닙니다</small><h3>{story.theme}</h3><p>{story.text}</p></article>)}</div>
      </div></section>

      <section className="section faq-section"><div className="section-shell faq-layout">
        <div><p className="eyebrow">FAQ</p><h2>참여하기 전에<br />궁금한 것들</h2><p>처음이라도 편안하게 시작할 수 있도록 자주 묻는 내용을 정리했습니다.</p><Link href="/interview" className="text-link">인터뷰 안내 보기 <ArrowRight size={15}/></Link></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
      </div></section>

      <section className="section cta-section"><div className="section-shell cta-card"><NotebookPen size={30} strokeWidth={1.4}/><p className="eyebrow">AN INVITATION</p><h2>삶의 답은 내가 찾지만,<br />그 과정을 혼자 걸을 필요는 없으니까.</h2><p>우리는 정답을 알려드리지 않습니다. 대신 더 좋은 질문을 함께 찾고 싶습니다.</p><div className="cta-actions"><Link href="/interview" className="button button--light">인터뷰 신청하기 <ArrowRight size={16} /></Link></div></div></section>
    </main>
  );
}
