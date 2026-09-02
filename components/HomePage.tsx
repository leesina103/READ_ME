import Image from "next/image";
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
  UsersRound
} from "lucide-react";
import { SectionTitle } from "@/components/SectionTitle";
import { MeetRemi } from "@/components/MeetRemi";
import { ReadingJourneyFlow } from "@/components/ReadingJourneyFlow";
import { currentMeeting } from "@/data/currentMeeting";
import { currentTheme } from "@/data/themes";
import { readingGroupStories, storyClosing, storySourceNote } from "@/data/stories";

const values = [
  { icon: BookOpen, title: "사유", subtitle: "좋은 질문으로 나를 이해하는 시간", text: "책이 건넨 질문에 머물며 내 생각과 감정을 천천히 들여다봅니다." },
  { icon: MessageCircle, title: "대화", subtitle: "존중과 경청으로 생각을 넓히는 시간", text: "서로 다른 경험과 관점을 판단하지 않고 깊이 들으며, 나의 언어를 넓혀갑니다." },
  { icon: HeartHandshake, title: "관계", subtitle: "혼자가 아니라 함께 나아가는 힘", text: "깊은 대화가 한 번의 만남에 그치지 않도록, 서로의 변화와 다음 질문을 응원합니다." }
];

const meetingFacts = [
  { icon: CalendarDays, value: "4회", label: "한 기수" },
  { icon: UsersRound, value: "6명 안팎", label: "소규모" },
  { icon: CalendarDays, value: "격주", label: "진행 주기" },
  { icon: Clock3, value: "3시간", label: "회차별" },
  { icon: MapPin, value: "오프라인", label: "진행 방식" },
  { icon: NotebookPen, value: "온라인 OUTPUT", label: "격주 오프라인 모임 사이, 대화에서 얻은 생각을 일상에서 실천하고 기록합니다." }
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
  { number: "04", keyword: "ONE SPACE", title: "하나의 공간에서 이어지는 경험", text: "신청부터 일정, 질문, 기록, 기수 커뮤니티까지 여러 곳에 흩어지지 않고 하나의 웹 공간에서 자연스럽게 이어집니다." }
];

const faqs = [
  ["책을 꼭 완독해야 하나요?", "아니요. 완독보다 읽은 만큼 솔직하게 질문을 가져오는 태도를 중요하게 생각합니다."],
  ["혼자 참여해도 괜찮나요?", "네. 대부분 혼자 신청합니다. 처음 만난 사람도 편안히 이야기할 수 있도록 소규모로 진행합니다."],
  ["독서모임이 처음인데 괜찮나요?", "물론입니다. 잘 말하는 능력보다 다른 사람의 이야기를 존중하며 듣는 마음이면 충분합니다."],
  ["인터뷰는 왜 하나요?", "평가가 아니라 서로 기대하는 모임의 방식과 대화 태도가 잘 맞는지 확인하는 짧은 사전 대화입니다."],
  ["한 기수는 어떻게 진행되나요?", "격주로 네 번 만나며, 매 회차 책 읽기와 사전 질문, 오프라인 대화, 기록의 순서로 이어집니다."]
];

export function HomePage() {
  return (
    <main>
      <section className="hero section-shell">
        <div className="hero__copy">
          <p className="eyebrow">READ ME · BOOK COMMUNITY</p>
          <h1>Read Books.<br /><em>Read Yourself.</em></h1>
          <p className="hero__lead">책을 통해 나를 읽고,<br />결이 맞는 사람을 만나고,<br />삶의 방향을 찾아가는 독서 커뮤니티.</p>
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
        <SectionTitle eyebrow="OUR VALUES" context="READ ME가 중요하게 생각하는 3가지 가치" title="사유 · 대화 · 관계" />
        <div className="value-grid">{values.map(({ icon: Icon, ...value }) => <article key={value.title}><Icon size={24} strokeWidth={1.5} /><p>{value.title}</p><h3>{value.subtitle}</h3><span>{value.text}</span></article>)}</div>
      </div></section>

      <section className="section meeting-format-section"><div className="section-shell">
        <SectionTitle eyebrow="HOW IT WORKS" title="작고 깊게, 네 번의 만남" />
        <div className="meeting-facts">{meetingFacts.map(({ icon: Icon, ...fact }) => <article key={fact.label}><Icon size={20} strokeWidth={1.5} /><strong>{fact.value}</strong><span>{fact.label}</span></article>)}</div>
        <div className="participation-flow"><strong>참여 흐름</strong><p>책 읽기 <ArrowRight size={15} /> 사전 질문 <ArrowRight size={15} /> 오프라인 대화 <ArrowRight size={15} /> 기록 <ArrowRight size={15} /> 온라인 세션</p></div>
      </div></section>

      <section className="section why-section"><div className="section-shell">
        <SectionTitle eyebrow="WHY READ ME" title="질문에서 시작해, 삶에 남도록" description="좋은 책, 좋은 사람, 연결된 질문과 기록이 하나의 경험이 되도록 설계합니다." />
        <p className="why-section__origin">독서모임을 3년간 직접 해보고, 아쉬운 점은 바꾸고 좋은 점만 골라 만들었습니다</p>
        <div className="difference-grid">{differences.map((item) => <article key={item.number}><span>{item.number} — {item.keyword}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </div></section>

      <section className="section season-section"><div className="section-shell">
        <div className="season-guide">
          <p className="eyebrow">PROGRAM GUIDE</p>
          <h2>READ ME는<br />어떻게 진행되나요?</h2>
          <p>한 기수는 하나의 주제로 8주 동안 이어집니다.<br />격주 오프라인 토의에서 책과 질문으로 대화하고, 사이의 휴식 세션에서는 배운 것을 삶에 적용해봅니다.</p>
          <small>* 기수마다 주제가 바뀝니다.</small>
        </div>
        <ol className="season-cycle">
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>토의 전 · 사색</span>
                <h3>독서 <em className="is-input">INPUT</em></h3>
              </div>
              <div className="season-cycle__body">
                <p>다양한 사람의 경험을 가장 값싸게 배우는 방법, 책을 읽습니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-self.png" alt="혼자 책을 읽으며 기록하는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>토의 전 · 온라인</span>
                <h3>사전 질문</h3>
              </div>
              <div className="season-cycle__body">
                <p>책을 읽고 떠오른 생각을 사전 질문에 미리 적어둡니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--shot">
              <div className="season-cycle__frame">
              <svg viewBox="0 0 320 200" aria-hidden="true">
                <rect width="320" height="200" fill="var(--paper)" />
                <text x="16" y="20" className="shot-eyebrow">READ ME 1기 · 1주차 · 토의</text>
                <text x="16" y="38" className="shot-title">존중 토의</text>
                <text x="16" y="52" className="shot-meta">《관계의 언어》 문요한</text>
                <path d="M0 62h320" stroke="var(--line)" />
                <rect y="62" width="320" height="96" fill="var(--sage)" opacity=".38" />
                <circle cx="26" cy="82" r="10" fill="var(--forest)" />
                <text x="26" y="85" className="shot-avatar" textAnchor="middle">리미</text>
                <text x="42" y="76" className="shot-name">리미</text>
                <rect x="42" y="80" width="176" height="34" rx="8" fill="#fff" />
                <text x="52" y="94" className="shot-body">이번 주 질문이에요.</text>
                <text x="52" y="107" className="shot-body is-strong">우리는 서로를 어떻게 존중하는가?</text>
                <text x="304" y="128" className="shot-name" textAnchor="end">나</text>
                <rect x="136" y="132" width="168" height="20" rx="8" fill="var(--forest)" />
                <text x="146" y="145" className="shot-body is-mine">말을 끊지 않고 끝까지 듣는 것부터요.</text>
                <rect x="14" y="168" width="230" height="22" rx="8" fill="#fff" stroke="var(--line)" />
                <text x="26" y="182" className="shot-placeholder">나의 답변을 남겨보세요.</text>
                <rect x="252" y="168" width="54" height="22" rx="11" fill="var(--forest)" />
                <text x="273" y="182" className="shot-btn" textAnchor="middle">보내기</text>
                <path d="m288 179 7-3-2 3 2 3z" fill="var(--cream)" />
              </svg>
              </div>
              <figcaption>READ ME 웹의 실제 토크방 화면</figcaption>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>1주차 · 오프라인</span>
                <h3>토의</h3>
              </div>
              <div className="season-cycle__body">
                <p>발제문의 질문으로 대화하며, 서로 다른 관점에서 식견을 넓힙니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-relationship.png" alt="마주 앉아 대화하는 두 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>2주차 · 온라인</span>
                <h3>실천 <em className="is-output">OUTPUT</em></h3>
              </div>
              <div className="season-cycle__body">
                <p>토의에서 나눈 이야기로 생각을 다시 정리해 적습니다. 써봐야 생각이 정리되고, 서로의 답을 보며 시야가 넓어집니다.</p>
                <p>정리한 생각을 일상에 접목해 실천하고, 어떤 행동을 했는지 조원들과 공유합니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--shot">
              <div className="season-cycle__frame">
              <svg viewBox="0 0 320 200" aria-hidden="true">
                <rect width="320" height="200" fill="var(--paper)" />
                <text x="16" y="20" className="shot-eyebrow">READ ME 1기 · 2주차 · 휴식 &amp; OUTPUT</text>
                <text x="16" y="38" className="shot-title">존중 실천 기록</text>
                <text x="16" y="52" className="shot-meta">《관계의 언어》 문요한</text>
                <path d="M0 62h320" stroke="var(--line)" />
                <rect y="62" width="320" height="96" fill="var(--sage)" opacity=".38" />
                <circle cx="26" cy="82" r="10" fill="var(--forest)" />
                <text x="26" y="85" className="shot-avatar" textAnchor="middle">리미</text>
                <rect x="42" y="72" width="186" height="20" rx="8" fill="#fff" />
                <text x="52" y="85" className="shot-body is-strong">실천한 행동을 기록해 공유해 주세요.</text>
                <circle cx="26" cy="108" r="10" fill="var(--sand)" />
                <text x="26" y="111" className="shot-avatar is-dark" textAnchor="middle">주</text>
                <rect x="42" y="98" width="152" height="20" rx="8" fill="#fff" />
                <text x="52" y="111" className="shot-body">저는 하루 10분 통화를 해봤어요.</text>
                <rect x="120" y="128" width="184" height="20" rx="8" fill="var(--forest)" />
                <text x="130" y="141" className="shot-body is-mine">다섯 번 참았고, 두 번은 놀랐어요.</text>
                <rect x="14" y="168" width="230" height="22" rx="8" fill="#fff" stroke="var(--line)" />
                <text x="26" y="182" className="shot-placeholder">답변을 수정할 수 있어요.</text>
                <rect x="252" y="168" width="54" height="22" rx="11" fill="var(--forest)" />
                <text x="273" y="182" className="shot-btn" textAnchor="middle">수정하기</text>
              </svg>
              </div>
              <figcaption>READ ME 웹의 실제 토크방 화면</figcaption>
            </figure>
          </li>
        </ol>
        <p className="season-cycle__note">이 흐름이 2주마다 반복되며 8주의 여정이 완성됩니다.<br />온라인 세션은 READ ME 웹 안의 토크방에서 이뤄지고, 답변은 같은 기수끼리 공유됩니다.</p>
        <article className="season-current">
          <div className="season-current__label">
            <p className="eyebrow">CURRENT SEASON</p>
            {currentMeeting.recruiting && <span className="season-current__badge">{currentMeeting.recruitingLabel}</span>}
          </div>
          <h3>{currentMeeting.cohort} — {currentTheme.name}, {currentTheme.subtitle}</h3>
          <ol className="season-current__questions">
            {currentTheme.sessions.map((session, index) => (
              <li key={session.title}>
                <span className="season-current__num">{String(index + 1).padStart(2, "0")}</span>
                <span className="season-current__topic">{session.title}</span>
                <span className="season-current__q">{session.question}</span>
                <span className="season-current__book">《{session.book}》</span>
              </li>
            ))}
          </ol>
          <div className="season-current__actions">
            <Link href={`/themes/${currentTheme.slug}`} className="button button--primary">{currentTheme.name} 주제 자세히 보기 <ArrowRight size={15} /></Link>
            <Link href="/meeting" className="button button--ghost">{currentMeeting.cohort} 모임 안내</Link>
          </div>
        </article>
      </div></section>

      <section className="section connection-section"><div className="section-shell">
        <div className="season-guide">
          <p className="eyebrow">AFTER THE SEASON</p>
          <h2>한 기수가 끝나도,<br />관계까지 끝나지는 않도록.</h2>
        </div>
        <ul className="season-cycle connection-cycle">
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>언제든 · 나의 서재</span>
                <h3>기록 보관</h3>
              </div>
              <div className="season-cycle__body">
                <p>온라인에서 나눈 질문과 서로의 답변을 언제든 다시 꺼내볼 수 있도록 남깁니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-work.png" alt="책상에서 기록을 남기는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>기수가 끝난 뒤 · 오프라인</span>
                <h3>READ ME 파티</h3>
              </div>
              <div className="season-cycle__body">
                <p>함께 읽은 사람들이 한자리에 모여, 못다 한 이야기를 얼굴 보며 나눕니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-relationship.png" alt="컵을 들고 마주 앉아 이야기 나누는 리미들" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>한 기수 이후 · 멤버십</span>
                <h3>READ ME 멤버십</h3>
              </div>
              <div className="season-cycle__body">
                <p>한 기수를 마친 뒤에도 전 기수의 멤버들과 다양한 활동으로 계속 만날 수 있도록 멤버십으로 연결합니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-emotion.png" alt="다양한 감정을 마주하며 자신을 살피는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>전 기수와 함께 · 온라인</span>
                <h3>멤버십 커뮤니티</h3>
              </div>
              <div className="season-cycle__body">
                <p>함께한 기수가 달라도, 다음 질문과 일상을 나누며 서로의 생각과 변화를 이어갑니다.</p>
                <p>인생책을 소개하거나 직접 쓴 글을 공유하는 등, 각자의 읽기와 쓰기를 편하게 나눌 수 있는 커뮤니티를 운영합니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-change.png" alt="징검다리를 건너며 새싹에 물을 주는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>원하는 책으로 · 멤버십 오프라인</span>
                <h3>멤버십 북토의</h3>
              </div>
              <div className="season-cycle__body">
                <p>정해진 커리큘럼을 벗어나, 멤버들이 직접 고른 책으로 자유롭게 토의합니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-self.png" alt="책상에 앉아 원하는 책을 읽고 기록하는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
          <li>
            <div className="season-cycle__text">
              <div className="season-cycle__head">
                <span>멤버가 만드는 · 온·오프라인</span>
                <h3>자유로운 소모임</h3>
              </div>
              <div className="season-cycle__body">
                <p>전시, 영화, 산책부터 취향과 관심사를 나누는 모임까지, 멤버들이 자유롭게 제안하고 함께합니다.</p>
              </div>
            </div>
            <figure className="season-cycle__figure season-cycle__figure--art">
              <div className="season-cycle__frame">
                <Image src="/theme-remi-life.png" alt="나무 아래 돗자리에서 쉬는 리미" width={960} height={600} sizes="(max-width: 820px) 92vw, 470px" />
              </div>
            </figure>
          </li>
        </ul>
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
        <SectionTitle eyebrow="STORY" title="실제 사람들이 느낀 것" description={storySourceNote} />
        <div className="story-grid">
          {readingGroupStories.map((story, index) => (
            <article key={story.name} className={story.longform ? "story-grid__item--featured" : undefined}>
              <div className="story-grid__meta">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{story.name}</strong>
              </div>
              {story.longform && (
                <div className="story-grid__feature-heading">
                  <h3>{story.longform.title}</h3>
                  <div>{story.longform.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                </div>
              )}
              <blockquote>“{story.quote}”</blockquote>
              {story.text && <p className="story-grid__detail">{story.text}</p>}
            </article>
          ))}
        </div>
        <p className="story-closing">{storyClosing}</p>
        <Link href="/story" className="button button--ghost story-link">전체 후기 보기 <ArrowRight size={16} /></Link>
      </div></section>

      <section className="section faq-section"><div className="section-shell faq-layout">
        <div><p className="eyebrow">FAQ</p><h2>참여하기 전에<br />궁금한 것들</h2><p>처음이라도 편안하게 시작할 수 있도록 자주 묻는 내용을 정리했습니다.</p><Link href="/interview" className="text-link">인터뷰 안내 보기 <ArrowRight size={15}/></Link></div>
        <div className="faq-list">{faqs.map(([question, answer], index) => <details key={question}><summary><span>{String(index + 1).padStart(2, "0")}</span>{question}<i>+</i></summary><p>{answer}</p></details>)}</div>
      </div></section>

      <section className="section cta-section"><div className="section-shell cta-card"><NotebookPen size={30} strokeWidth={1.4}/><p className="eyebrow">AN INVITATION</p><h2>삶의 답은 내가 찾지만,<br />그 과정을 혼자 걸을 필요는 없으니까.</h2><p>우리는 정답을 알려드리지 않습니다. 대신 더 좋은 질문을 함께 찾고 싶습니다.</p><div className="cta-actions"><Link href="/meeting" className="button button--light">현재 모임 보기 <ArrowRight size={16} /></Link><Link href={currentMeeting.applyHref} className="button button--outline-light">{currentMeeting.applyLabel}</Link></div></div></section>
    </main>
  );
}
