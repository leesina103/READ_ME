import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  HeartHandshake,
  MessageCircleQuestion,
  Video,
  Wifi
} from "lucide-react";
import { PageContext } from "@/components/PageContext";

export const metadata: Metadata = {
  title: "인터뷰 안내",
  description: "READ ME에 참여하기 전 서로의 기대와 대화 방식을 맞춰보는 온라인 인터뷰를 안내합니다."
};

const purposes = [
  [MessageCircleQuestion, "기대를 나눠요", "어떤 책과 질문을 만나고 싶은지, 이번 모임에서 바라는 시간을 편하게 이야기합니다."],
  [HeartHandshake, "대화의 태도를 확인해요", "잘 말하는 능력보다 서로 다른 생각을 듣고 존중할 준비가 되어 있는지 살펴봅니다."],
  [CalendarCheck, "운영 방식을 맞춰요", "일정과 참여 방식, 기록에 관한 안내를 듣고 나에게 맞는 모임인지 함께 판단합니다."]
] as const;

const process = [
  ["01", "신청 내용 확인", "남겨주신 신청 내용과 참여 희망 기수를 운영진이 먼저 확인합니다."],
  ["02", "인터뷰 일정 조율", "가능한 시간을 확인한 뒤 온라인 미팅 링크를 보내드립니다."],
  ["03", "20–30분 대화", "정해진 답을 평가하지 않고, 독서와 대화에 대한 생각을 차분히 나눕니다."],
  ["04", "다음 단계 안내", "대화 후 참여 가능 여부와 첫 모임 준비 사항을 개별 안내합니다."]
] as const;

const questions = [
  "최근 읽은 문장 중 오래 마음에 남은 것은 무엇인가요?",
  "생각이 다른 사람을 만났을 때 어떤 방식으로 대화하나요?",
  "이번 모임에서 얻고 싶은 것과 보태고 싶은 것은 무엇인가요?"
];

const preparations = [
  [Video, "카메라와 마이크", "표정과 목소리를 나눌 수 있는 환경에서 접속해 주세요."],
  [Wifi, "안정적인 연결", "대화가 끊기지 않도록 조용하고 네트워크가 안정적인 장소를 권합니다."],
  [Clock3, "약속한 시간", "변경이 필요하다면 다른 신청자를 위해 가능한 한 미리 알려주세요."]
] as const;

const faqs = [
  ["인터뷰는 합격자를 가리는 시험인가요?", "아니요. READ ME가 지향하는 대화 방식과 참여자가 기대하는 경험이 서로 맞는지 확인하는 시간입니다."],
  ["책을 많이 읽어야 하나요?", "독서량은 기준이 아닙니다. 한 문장을 오래 생각하고 자신의 언어로 나눌 마음이 있다면 충분합니다."],
  ["무엇을 준비해야 하나요?", "별도의 답안이나 자기소개 자료는 필요하지 않습니다. 최근의 독서 경험과 모임에 기대하는 점만 가볍게 떠올려 주세요."],
  ["긴장해서 말을 잘 못하면 어떡하나요?", "운영진이 질문을 천천히 건넵니다. 잠시 생각한 뒤 답해도 되고, 답하기 어려운 질문은 건너뛸 수 있습니다."],
  ["인터뷰 결과는 언제 알 수 있나요?", "운영 일정에 따라 개별 안내합니다. 정확한 전달 시점은 인터뷰 일정을 조율할 때 함께 알려드립니다."]
] as const;

export default function InterviewPage() {
  return (
    <main>
      <PageContext title="인터뷰 안내" description="함께 읽기 전 나누는 사전 대화" />
      <section className="interview-hero">
        <div className="section-shell interview-hero__grid">
          <div>
            <p className="eyebrow">BEFORE WE READ TOGETHER</p>
            <h1>서로를 고르는 대신,<br /><span>대화를 준비합니다.</span></h1>
            <p className="interview-hero__lead">READ ME 인터뷰는 잘 준비된 답을 확인하는 자리가 아닙니다. 함께 읽고 말하는 방식이 서로에게 편안할지 알아보는 짧은 사전 대화입니다.</p>
            <div className="button-row">
              <a href="#process" className="button button--primary">진행 과정 보기 <ArrowRight size={15} /></a>
              <a href="#questions" className="button button--ghost">나누는 이야기</a>
            </div>
          </div>
          <aside className="interview-brief" aria-label="인터뷰 기본 안내">
            <p>INTERVIEW NOTE</p>
            <MessageCircleQuestion size={34} aria-hidden="true" />
            <blockquote>“어떤 답을 하는지보다,<br />어떻게 듣고 생각하는지 궁금해요.”</blockquote>
            <span>READ ME 운영진과 나누는 1:1 온라인 대화</span>
          </aside>
        </div>
      </section>

      <section className="proof-strip" aria-label="인터뷰 요약">
        <div className="section-shell proof-strip__inner">
          <article><strong>1:1</strong><span>운영진과 대화</span><small>여럿 앞에서 소개하지 않아요</small></article>
          <article><strong>20–30</strong><span>예상 소요 시간</span><small>충분히 생각하며 이야기해요</small></article>
          <article><strong>ONLINE</strong><span>화상 미팅</span><small>확정 링크는 개별 안내해요</small></article>
        </div>
      </section>

      <section className="section section--paper interview-purpose">
        <div className="section-shell">
          <div className="section-heading-row"><div><p className="eyebrow">WHY WE MEET</p><h2 className="interview-section-title">인터뷰에서 확인하는 세 가지</h2></div><p className="interview-section-copy">평가표보다 서로에게 맞는 시간을 만들기 위한 질문을 준비합니다.</p></div>
          <div className="step-grid">{purposes.map(([Icon, title, text], index) => <article key={title} className="step-card"><span>{String(index + 1).padStart(2, "0")}</span><Icon className="interview-card-icon" size={24} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section id="process" className="section promise-section">
        <div className="section-shell promise-grid">
          <div><p className="eyebrow">INTERVIEW FLOW</p><h2>신청부터<br />첫 안내까지</h2><p>인터뷰 일정은 신청 상황에 따라 개별 조율합니다. 안내 메시지를 놓치지 않도록 신청할 때 연락처를 정확히 남겨주세요.</p></div>
          <ol>{process.map(([number, title, text]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div>
      </section>

      <section id="questions" className="section">
        <div className="section-shell">
          <p className="eyebrow">A FEW QUESTIONS</p>
          <h2 className="interview-section-title">이런 이야기를 나눌 수 있어요</h2>
          <p className="interview-section-copy">외운 답은 필요하지 않습니다. 지금의 생각을 솔직한 문장으로 들려주세요.</p>
          <div className="interview-question-grid">{questions.map((question, index) => <article key={question}><span>Q{index + 1}</span><p>{question}</p></article>)}</div>
        </div>
      </section>

      <section className="section section--paper">
        <div className="section-shell">
          <p className="eyebrow">BEFORE THE CALL</p>
          <h2 className="interview-section-title">편안한 대화를 위한 준비</h2>
          <div className="interview-preparation-grid">{preparations.map(([Icon, title, text]) => <article key={title}><Icon size={23} aria-hidden="true"/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-shell faq-layout">
          <div><p className="eyebrow">FAQ</p><h2>인터뷰 전에<br />궁금한 것들</h2><p>정답을 준비하지 않아도 괜찮습니다. 궁금한 점이 남으면 문의 채널로 편하게 알려주세요.</p><a href="#contact" className="text-link">문의하기 <ArrowRight size={14}/></a></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="section-shell"><div className="cta-card"><HeartHandshake size={34}/><p className="eyebrow">READY TO TALK?</p><h2>한 권의 책보다 먼저,<br />서로의 태도를 만나요.</h2><p>다가오는 모임을 살펴보고 마음이 닿는다면 인터뷰 일정을 문의해 주세요.</p><div className="cta-actions"><Link href="/meeting" className="button button--light">모임 먼저 보기 <ArrowRight size={15}/></Link><a href="#contact" className="button button--outline-light">인터뷰 문의하기</a></div></div></div>
      </section>
    </main>
  );
}
