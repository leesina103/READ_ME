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

export const metadata: Metadata = {
  title: "인터뷰 안내",
  description: "READ ME에 참여하기 전 서로의 기대와 대화 방식을 맞춰보는 온라인 인터뷰를 안내합니다."
};

const benefits = [
  [MessageCircleQuestion, "말하다 보면 내가 보여요", "답을 잘 만들기보다 생각을 천천히 꺼내는 동안, 내가 중요하게 여기는 기준이 자연스럽게 드러납니다."],
  [CalendarCheck, "지금 필요한 질문을 발견해요", "요즘 마음에 머무는 고민을 함께 짚어보며, 지금의 나에게 필요한 질문을 발견합니다."],
  [HeartHandshake, "모임의 대화를 먼저 느껴봐요", "서로의 말을 서두르지 않고 듣는 시간을 통해, READ ME의 대화가 나와 잘 맞는지 미리 느껴봅니다."]
] as const;

const process = [
  ["01", "날짜와 시간 선택", "예약 가능한 날짜를 고른 뒤, 편안하게 참여할 수 있는 시간을 선택합니다."],
  ["02", "이름과 연락처 입력", "신청자 확인과 일정 안내에 필요한 이름과 전화번호만 남깁니다."],
  ["03", "신청 완료 안내", "선택한 인터뷰 시간과 안내 페이지를 카카오톡 메시지로 보내드립니다."],
  ["04", "20–30분 대화", "정해진 답을 평가하지 않고, 독서와 대화에 대한 생각을 차분히 나눕니다."]
] as const;

const questions = [
  "최근 읽은 문장 중 오래 마음에 남은 것은 무엇이며, 왜 그런가요?",
  "나와 다른 생각을 만났을 때, 어떤 태도로 대화하려 하나요?",
  "요즘 조금 어렵더라도 계속 시도해보고 있는 일이 있나요?"
];

const preparations = [
  [Video, "카메라와 마이크", "표정과 목소리를 나눌 수 있는 환경에서 접속해 주세요."],
  [Wifi, "안정적인 연결", "대화가 끊기지 않도록 조용하고 네트워크가 안정적인 장소를 권합니다."],
  [Clock3, "약속한 시간", "변경이 필요하다면 다른 신청자를 위해 가능한 한 미리 알려주세요."]
] as const;

const notices = [
  {
    title: "진행 형태와 시간",
    items: [
      "인터뷰는 온라인 구글 화상 미팅으로 약 30분간 진행되며, 예약된 정각에 시작합니다.",
      "별도 연락 없이 5분 이상 접속이 늦어지면 다음 인터뷰 일정에 영향을 줄 수 있어 인터뷰가 취소될 수 있습니다."
    ]
  },
  {
    title: "일정 변경 및 참여 매너",
    items: [
      "일정 변경이 필요하다면 인터뷰 시작 전에 카카오톡 채널로 알려주세요.",
      "별도 연락 없이 인터뷰에 불참한 경우, 다른 신청자의 기회를 보호하기 위해 불참일로부터 3개월간 READ ME 참여 신청이 제한됩니다.",
      "인터뷰 전에 카카오톡 또는 문자로 예약 시간과 접속 링크를 다시 안내합니다.",
      "인터뷰 결과는 운영진 논의 후 3일 안으로 개별적으로 전달합니다."
    ]
  }
] as const;

const membershipBenefits = [
  ["질문에서 시작하는 깊은 대화", "같은 책을 읽고도 서로 다르게 느낀 지점과 삶의 경험을 나눕니다."],
  ["오프라인과 온라인으로 이어지는 8주", "2주에 한 권씩, 오프라인 대화와 온라인 실천·기록을 네 번 반복합니다."],
  ["나의 생각을 발견하고 넓히는 시간", "타인의 관점을 만나며 내 생각을 자신의 언어로 정리하고, 일상에 작은 변화를 만들어갑니다."]
] as const;

const faqs = [
  ["인터뷰는 합격자를 가리는 시험인가요?", "아니요. READ ME가 지향하는 대화 방식과 참여자가 기대하는 경험이 서로 맞는지 확인하는 시간입니다."],
  ["책을 많이 읽어야 하나요?", "독서량은 기준이 아닙니다. 한 문장을 오래 생각하고 자신의 언어로 나눌 마음이 있다면 충분합니다."],
  ["무엇을 준비해야 하나요?", "별도의 답안이나 자기소개 자료는 필요하지 않습니다. 최근의 독서 경험과 모임에 기대하는 점만 가볍게 떠올려 주세요."],
  ["긴장해서 말을 잘 못하면 어떡하나요?", "운영진이 질문을 천천히 건넵니다. 잠시 생각한 뒤 답해도 되고, 답하기 어려운 질문은 건너뛸 수 있습니다."],
  ["인터뷰 결과는 언제 알 수 있나요?", "운영진 논의 후 3일 안으로 개별적으로 전달합니다."]
] as const;

export default function InterviewPage() {
  return (
    <main>
      <section className="interview-hero">
        <div className="section-shell interview-hero__grid">
          <div>
            <p className="eyebrow">BEFORE WE READ TOGETHER</p>
            <h1>서로를 고르는 대신,<br /><span>대화를 준비합니다.</span></h1>
            <p className="interview-hero__lead">READ ME 인터뷰는 잘 준비된 답을 확인하는 자리가 아닙니다.<br />함께 읽고 말하는 방식이 서로에게 편안할지 알아보는 짧은 사전 대화입니다.</p>
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
          <article><strong className="proof-strip__online">ONLINE</strong><span>화상 미팅</span><small>확정 링크는 개별 안내해요</small></article>
        </div>
      </section>

      <section className="section section--paper interview-purpose">
        <div className="section-shell">
          <div>
            <p className="eyebrow">WHY WE MEET</p>
            <h2 className="interview-section-title">짧은 대화가 남기는 것</h2>
            <p className="interview-section-copy">천천히 말하고 듣는 동안, 지금의 나와 앞으로 나누고 싶은 대화가 조금 더 또렷해집니다.</p>
          </div>
          <div className="step-grid">{benefits.map(([Icon, title, text], index) => <article key={title} className="step-card"><span>{String(index + 1).padStart(2, "0")}</span><Icon className="interview-card-icon" size={24} aria-hidden="true"/><h3>{title}</h3><p>{text}</p></article>)}</div>
        </div>
      </section>

      <section id="process" className="section promise-section">
        <div className="section-shell promise-grid">
          <div><p className="eyebrow">INTERVIEW FLOW</p><h2>신청부터<br />첫 안내까지</h2><p>안내 메시지를 놓치지 않도록 신청할 때 연락처를 정확히 남겨주세요.</p></div>
          <ol>{process.map(([number, title, text]) => <li key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div></li>)}</ol>
        </div>
      </section>

      <section id="questions" className="section">
        <div className="section-shell">
          <p className="eyebrow">A FEW QUESTIONS</p>
          <h2 className="interview-section-title">이런 이야기를 나눌 수 있어요</h2>
          <p className="interview-section-copy">외운 답은 필요하지 않습니다.<br />지금의 생각을 솔직한 문장으로 들려주세요.</p>
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

      <section className="section interview-notice-section">
        <div className="section-shell">
          <p className="eyebrow">INTERVIEW NOTICE</p>
          <h2 className="interview-section-title">인터뷰 주의사항</h2>
          <p className="interview-section-copy">모두의 시간을 존중하며 편안하게 대화할 수 있도록 아래 내용을 확인해 주세요.</p>
          <div className="interview-notice-grid">
            {notices.map(({ title, items }) => (
              <article key={title}>
                <h3>{title}</h3>
                <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--paper interview-membership">
        <div className="section-shell">
          <p className="eyebrow">READ ME JOURNEY</p>
          <h2 className="interview-section-title">인터뷰를 지나,<br />함께 읽게 된다면</h2>
          <p className="interview-section-copy">READ ME 회원이 된 뒤에는 책과 질문, 사람을 따라가는 8주의 시간이 기다리고 있습니다.</p>
          <div className="step-grid">
            {membershipBenefits.map(([title, text], index) => (
              <article key={title} className="step-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <div className="button-row">
            <Link href="/meeting" className="button button--primary">모임 진행 방식 자세히 보기 <ArrowRight size={15}/></Link>
          </div>
        </div>
      </section>

      <section className="section faq-section">
        <div className="section-shell faq-layout">
          <div><p className="eyebrow">FAQ</p><h2>인터뷰 전에<br />궁금한 것들</h2><p>정답을 준비하지 않아도 괜찮습니다.<br />궁금한 점이 남으면 문의 채널로 편하게 알려주세요.</p><a href="#contact" className="text-link">문의하기 <ArrowRight size={14}/></a></div>
          <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
        </div>
      </section>

      <section className="section cta-section">
        <div className="section-shell"><div className="cta-card"><HeartHandshake size={34}/><p className="eyebrow">READY TO TALK?</p><h2>한 권의 책보다 먼저,<br />서로의 태도를 만나요.</h2><p>다가오는 모임을 살펴보고 마음이 닿는다면 편한 인터뷰 일정을 선택해 주세요.</p><div className="cta-actions"><Link href="/meeting" className="button button--light">모임 먼저 보기 <ArrowRight size={15}/></Link><Link href="/interview/apply" className="button button--outline-light">인터뷰 신청하기</Link></div></div></div>
      </section>
    </main>
  );
}
