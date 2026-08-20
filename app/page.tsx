import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, Check, Compass, Library, MessageCircle, NotebookPen, Quote, UsersRound } from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";
import { RemiGuide } from "@/components/RemiGuide";

const steps = [
  { number: "01", title: "함께 읽기", text: "한 기수의 주제와 네 권의 책을 천천히 읽어요." },
  { number: "02", title: "질문 만들기", text: "정답 대신 내 삶에 오래 남을 질문을 가져와요." },
  { number: "03", title: "서로 사유하기", text: "다른 관점을 안전하게 듣고 나의 언어로 기록해요." }
];

const sessions = [
  { number: "1주", title: "관계를 읽다", description: "나는 사람을 어떻게 이해하고 있나요?" },
  { number: "2주", title: "나를 읽다", description: "내가 원하는 삶은 어떤 모습인가요?" },
  { number: "3주", title: "변화를 읽다", description: "변하고 싶은 마음은 어디에서 오나요?" },
  { number: "4주", title: "마음을 읽다", description: "지금의 감정을 어떻게 돌볼 수 있을까요?" }
];

const journey = [
  { icon: Compass, label: "PUBLIC", title: "모임을 발견해요", text: "READ ME의 철학과 이번 기수의 주제, 일정과 진행 방식을 먼저 살펴봐요.", href: "/meeting", link: "모임 둘러보기" },
  { icon: UsersRound, label: "MEMBER", title: "함께 읽기 시작해요", text: "계정을 만들고 참여 중인 모임, 공지와 이번 주 질문을 한곳에서 확인해요.", href: "/signup", link: "회원으로 시작하기" },
  { icon: Library, label: "MY LIBRARY", title: "생각을 이어가요", text: "모임이 끝난 뒤에도 문장과 질문을 나의 서재에 차곡차곡 남겨요.", href: "/my", link: "나의 서재 보기" }
];

const faqs = [
  ["책을 전부 읽어야 참여할 수 있나요?", "완독보다 한 문장에 머문 경험을 중요하게 생각해요. 읽은 만큼 솔직하게 질문을 가져오면 충분합니다."],
  ["혼자 신청해도 괜찮을까요?", "네. 대부분 각자의 호기심으로 찾아옵니다. 서로의 속도를 존중하는 대화 약속으로 안전하게 연결해요."],
  ["회원가입을 하면 무엇이 달라지나요?", "참여 중인 기수의 일정과 공지, 회차별 질문, 내가 남긴 문장을 ‘나의 서재’에서 이어볼 수 있어요."],
  ["모임은 회차별로 신청하나요?", "READ ME는 하나의 기수에 포함된 네 번의 여정을 함께하는 방식으로 설계하고 있어요."]
];

export default function Home() {
  return (
    <main>
      <section className="hero section-shell">
        <div className="hero__copy">
          <p className="eyebrow">READ ME · BOOK COMMUNITY</p>
          <h1>Read books.<br /><em>Read yourself.</em></h1>
          <p className="hero__lead">책을 읽고, 질문하고,<br className="mobile-break" /> 함께 사유하는 독서모임</p>
          <p className="hero__body">완독보다 중요한 건 책을 통해 발견한 나의 문장입니다. 한 권의 책에서 시작해 서로의 관점을 만나고, 내 삶을 더 선명하게 읽어보세요.</p>
          <div className="button-row">
            <Link href="/meeting" className="button button--primary">이번 모임 보기 <ArrowRight size={16} /></Link>
            <Link href="/about" className="button button--ghost">READ ME 이야기</Link>
          </div>
          <div className="hero__meta" aria-label="모임 특징">
            <span><Check size={14} /> 한 기수 4회</span><span><Check size={14} /> 소규모 대화</span><span><Check size={14} /> 질문 기록</span>
          </div>
        </div>
        <div className="hero__art"><RemiGuide /><span className="hero__note">“오늘의 문장은<br />당신을 어디로 데려갔나요?”</span></div>
      </section>

      <section className="proof-strip" aria-label="READ ME 운영 기준"><div className="section-shell proof-strip__inner"><article><strong>4</strong><span>한 기수의 대화</span><small>네 번의 연결된 질문</small></article><article><strong>8</strong><span>한 테이블의 사람</span><small>서로의 목소리가 닿는 규모</small></article><article><strong>1</strong><span>나만의 질문 기록</span><small>모임 뒤에도 이어지는 생각</small></article></div></section>

      <section className="manifesto"><div className="section-shell manifesto__inner"><Quote size={28} strokeWidth={1.4} /><p>책을 많이 읽는 사람보다,<br />한 문장을 오래 생각하는 사람이 모입니다.</p></div></section>

      <section className="section section--paper"><div className="section-shell">
        <SectionTitle eyebrow="HOW WE READ" title="읽고, 묻고, 함께 생각해요" description="리미가 안내하는 세 번의 움직임. 매 모임은 정답을 말하는 자리가 아니라 서로의 생각이 자라는 시간입니다." />
        <div className="step-grid">{steps.map((step) => <article key={step.number} className="step-card"><span>{step.number}</span><h3>{step.title}</h3><p>{step.text}</p></article>)}</div>
      </div></section>

      <section className="section journey-section"><div className="section-shell">
        <div className="journey-heading"><p className="eyebrow">YOUR READING JOURNEY</p><h2>처음 발견한 순간부터<br />나의 기록이 될 때까지</h2><p>페이지를 둘러보는 방문자, 모임에 참여하는 회원, 운영하는 관리자까지 역할은 나뉘지만 경험은 한 흐름으로 이어집니다.</p></div>
        <div className="journey-grid">{journey.map(({ icon: Icon, ...item }, index) => <article key={item.label} className="journey-card"><div className="journey-card__top"><span>0{index + 1}</span><Icon size={24} strokeWidth={1.5}/></div><p className="eyebrow">{item.label}</p><h3>{item.title}</h3><p>{item.text}</p><Link href={item.href}>{item.link} <ArrowUpRight size={15}/></Link></article>)}</div>
      </div></section>

      <section className="section"><div className="section-shell">
        <div className="section-heading-row"><SectionTitle eyebrow="CURRENT SEASON" title="한 기수, 네 번의 질문" description="하나의 기수 안에서 네 개의 질문을 이어갑니다. 개별 회차가 아니라 전체 여정에 신청해요." /><Link href="/meeting" className="text-link">전체 일정 보기 <ArrowRight size={15} /></Link></div>
        <div className="session-list">{sessions.map((session, index) => <article key={session.number}><span>{session.number}</span><div><h3>{session.title}</h3><p>{session.description}</p></div><span className="session-list__dot">0{index + 1}</span></article>)}</div>
      </div></section>

      <section className="section section--sage"><div className="section-shell remi-story">
        <RemiGuide compact />
        <div><p className="eyebrow">MEET REMI</p><h2>리미는 답을 알려주지 않아요.<br />대신, 좋은 질문을 건넵니다.</h2><p>읽는 리미는 책 속 문장을 발견하고, 질문하는 리미는 생각의 문을 열고, 나누는 리미는 서로의 다름을 이어줘요. 모임과 나의 서재 곳곳에서 리미를 만나보세요.</p><div className="remi-tags"><span><BookOpen size={15} /> 읽는 리미</span><span><MessageCircle size={15} /> 질문하는 리미</span><span><UsersRound size={15} /> 나누는 리미</span></div></div>
      </div></section>

      <section className="section promise-section"><div className="section-shell promise-grid"><div><p className="eyebrow">WHAT WE KEEP</p><h2>더 많이 말하는 모임보다,<br />더 잘 듣는 모임</h2><p>READ ME가 지키고 싶은 것은 화려한 네트워킹이 아니라 한 사람의 문장을 끝까지 듣는 태도입니다.</p></div><ol><li><span>01</span><div><strong>속도를 재촉하지 않아요.</strong><p>완독과 빠른 답보다 천천히 생각할 시간을 남겨요.</p></div></li><li><span>02</span><div><strong>정답으로 고치지 않아요.</strong><p>서로 다른 관점을 판단 대신 질문으로 만나요.</p></div></li><li><span>03</span><div><strong>대화로 끝내지 않아요.</strong><p>남은 문장과 질문을 나의 서재에서 다시 읽어요.</p></div></li></ol></div></section>

      <section className="section faq-section"><div className="section-shell faq-layout"><div><p className="eyebrow">FAQ</p><h2>처음 오셨나요?</h2><p>참여하기 전에 궁금할 만한 내용을 먼저 정리했어요.</p><Link href="/about" className="text-link">READ ME 더 알아보기 <ArrowRight size={15}/></Link></div><div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>0{index + 1}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div></div></section>

      <section className="section cta-section"><div className="section-shell cta-card"><NotebookPen size={30} strokeWidth={1.4}/><p className="eyebrow">YOUR NEXT QUESTION</p><h2>다음 책에서<br />나를 읽어볼까요?</h2><p>모임을 먼저 살펴보고, 마음이 닿는다면 나의 서재를 열어보세요.</p><div className="cta-actions"><Link href="/meeting" className="button button--light">다가오는 모임 보기 <ArrowRight size={16} /></Link><Link href="/signup" className="button button--outline-light">회원으로 시작하기</Link></div></div></section>
    </main>
  );
}
