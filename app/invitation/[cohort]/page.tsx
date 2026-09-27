import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { notFound } from "next/navigation";
import { bookCovers } from "@/data/bookCovers";
import { membershipInvitations } from "@/data/membershipInvitation";
import { CopyAccountButton } from "@/components/CopyAccountButton";
import { FaqList } from "@/components/FaqList";
import { TalkRoomPreview } from "@/components/TalkRoomPreview";
import styles from "../page.module.css";

export const metadata: Metadata = {
  title: "당신을 READ ME에 초대합니다",
  description: "함께 읽고, 대화하고, 일상에 작은 변화를 남길 시간. READ ME의 초대장을 전합니다.",
  robots: { index: false, follow: false },
  openGraph: { title: "당신을 READ ME에 초대합니다", description: "책에서 시작해, 우리의 이야기로 이어질 8주." }
};

const journey = [
  { title: "책 읽기와 사전 질문", text: "2주에 한 권을 읽어요. 마음에 남은 문장과 내 경험을 떠올리며, 토크방의 사전 질문에 생각을 적습니다." },
  { title: "오프라인 토의", text: "격주로 만나 같은 책을 읽은 동료들과 이야기해요. 서로의 경험을 듣고, 혼자 읽을 때는 떠올리지 못했던 질문을 나눕니다." },
  { title: "일상에서 실천하고 기록하기", text: "대화에서 발견한 생각을 작은 행동으로 옮겨봐요. 다음 만남까지 실천한 경험을 토크방에 남기며 이야기를 이어갑니다." }
];

export default async function InvitationPage({ params }: { params: Promise<{ cohort: string }> }) {
  const { cohort } = await params;
  const invitation = Object.prototype.hasOwnProperty.call(membershipInvitations, cohort) ? membershipInvitations[cohort] : undefined;
  if (!invitation) notFound();
  const currentMeeting = invitation.meeting;
  const currentTheme = invitation.theme;
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={`section-shell ${styles.heroGrid}`}>
          <div>
            <p className="eyebrow">A LETTER FOR YOU · READ ME {currentMeeting.cohort}</p>
            <h1>다음 이야기는,<br />우리 함께 나눠요.</h1>
            <p className={styles.lead}>READ ME {currentMeeting.cohort}에 초대합니다.</p>
            <p className={styles.intro}>인터뷰에서 들려주신 이야기, 고맙습니다.<br />{" "}책 한 권을 사이에 두고 조금 더 오래 이야기하고 싶어요.<br />{" "}서로를 읽으며 나를 알아가는 시간에 함께해 주세요.</p>
          </div>
          <figure className={styles.art}>
            <span className={styles.seal}>READ ME<br /><small>함께 읽는 사이</small></span>
            <Image src="/theme-remi-relationship.png" alt="책을 사이에 두고 마주 앉아 이야기를 나누는 리미" width={960} height={600} priority sizes="(max-width: 820px) 92vw, 540px" />
            <figcaption>책에서 시작해, 우리의 이야기로.</figcaption>
          </figure>
        </div>
      </section>

      <section className={`section ${styles.books}`}>
        <div className="section-shell">
          <div className={styles.sectionHead}><div><p className="eyebrow">READ ME {currentMeeting.cohort} · 함께 읽을 주제</p><h2 className={styles.themeTitle}>{currentTheme.name}</h2><p className={styles.themeQuestion}>{currentTheme.coreQuestion}</p></div><p>{currentTheme.introduction}</p></div>
          <div className={styles.bookGrid}>{currentTheme.sessions.map((session, index) => <article className={styles.book} key={session.title}>
            <div className={styles.bookHeading}><span>0{index + 1}</span><h3>{session.title}</h3></div>
            <div className={styles.bookImage}><Image src={bookCovers[session.book]} alt={`${session.book} 표지`} width={180} height={260} sizes="(max-width: 430px) 140px, 180px" /></div>
            <p className={styles.bookQuestion}>{session.question}</p><p className={styles.bookCaption}><strong>{session.book}</strong><br /><small>{session.author}</small></p>
          </article>)}</div>
        </div>
      </section>

      <section id="invitation-program" className="section season-section">
        <div className="section-shell">
          <div className="season-guide">
          <p className="eyebrow">OUR NEXT CHAPTER</p>
          <h2>8주를 함께 보내는 방식</h2>
          <p>격주로 만나고, 그 사이에는 각자의 일상에서 실천하고 기록해요.<br />{" "}이 흐름을 네 번 반복하며 8주를 함께합니다.</p>
          </div>
          <ol className="season-cycle">{journey.map((step, index) => <li key={step.title}>
            <div className="season-cycle__text"><div className="season-cycle__head"><span>{["토의 전 · 온라인", "격주 · 오프라인", "만남 사이 · 온라인"][index]}</span><h3>{step.title}</h3></div><div className="season-cycle__body"><p>{step.text}</p></div></div>
            {index === 1 ? <figure className="season-cycle__figure season-cycle__figure--art"><div className="season-cycle__frame"><Image src="/theme-remi-relationship.png" alt="마주 앉아 이야기를 나누는 리미" width={960} height={600} sizes="(max-width: 820px) 90vw, 470px" /></div></figure> : <TalkRoomPreview variant={index === 0 ? "question" : "output"} cohortLabel={currentMeeting.cohort} caption="진행 방식을 보여주는 토크방 예시" />}
          </li>)}</ol>
          <p className="season-cycle__note">사전 질문과 실천 기록은 READ ME 웹사이트의 토크방에서 작성합니다. 같은 기수 동료들의 답변도 함께 읽으며 생각을 나눕니다.</p>
        </div>
      </section>

      <section className="section section--paper">
        <div className="section-shell">
          <div className="season-guide"><p className="eyebrow">SAVE THE DATE</p><h2>우리의 만남을<br />준비해 주세요.</h2><p>인터뷰 후 안내받은 후보 일정 중 참여하기 편한 요일과 시간을 선택해요. 한 번 정한 일정으로 기수 동안 격주로 만납니다.</p></div>
          <dl className="meeting-recruiting-facts">{currentMeeting.facts.filter((fact) => fact.label !== "회비").map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
          <p className="meeting-facts__note">첫 만남 날짜와 네 번의 모임 일정, 정확한 장소는 초대장을 보내드린 대화에서 안내합니다.<br />입금 전에 참석 가능한 일정인지 확인해 주세요.</p>
        </div>
      </section>

      <section className={`section ${styles.program}`}>
        <div className="section-shell">
          <div className="season-guide"><p className="eyebrow">INCLUDED</p><h2>참가비로 함께하는 것</h2></div>
          <div className="step-grid">
            <article className="step-card"><span>01</span><h3>네 번의 오프라인 토의</h3><p>4~6명의 동료들과 회차별 책과 질문을 중심으로 대화합니다. 토의에 사용할 발제문과 기록 자료를 제공합니다.</p></article>
            <article className="step-card"><span>02</span><h3>온라인 실천과 기록</h3><p>사전 질문부터 토의 후 실천까지, READ ME 토크방에서 생각을 적고 같은 기수 동료들과 나눕니다.</p></article>
            <article className="step-card"><span>03</span><h3>기수 이후에도 남는 기록</h3><p>기수가 끝난 뒤에도 나의 서재와 지난 기수 대화방에서 기록을 돌아볼 수 있어요. 멤버십 공간에서 북토의·소모임 소식도 만납니다.</p></article>
          </div>
        </div>
      </section>

      <section className="section faq-section"><div className="section-shell faq-layout"><div><p className="eyebrow">FAQ</p><h2>등록 전에<br />궁금한 점</h2><p>첫 만남과 등록에 관해 자주 묻는 내용을 정리했어요.</p></div><FaqList items={[
        { question: "책을 다 읽지 못해도 참여할 수 있나요?", answer: "깊은 대화를 위해 완독하는 걸 권장합니다. 하지만 시간이 안 된다면, 사전 질문에 대해 깊게 생각해오는 것만으로 충분합니다." },
        { question: "혼자 신청해도 괜찮나요?", answer: "네. 혼자 신청하셔도 괜찮아요. 처음 만난 사람도 편안히 이야기할 수 있도록 소규모로 진행합니다." },
        { question: "온라인에서는 어떤 활동을 하나요?", answer: "READ ME 웹사이트의 토크방에서 사전 질문에 답하고, 토의 이후 실천한 경험을 기록합니다. 회차별 작성 일정은 가입 후 안내해 드려요." },
        { question: "입금 후에는 무엇을 하면 되나요?", answer: "초대장을 보내드린 대화창에 입금자명을 남겨 주세요. 운영자가 입금을 확인한 뒤 회원가입 링크를 보내드립니다. 신청서에 적은 이름과 이메일로 가입하고 회원 정보를 등록하면 됩니다." }
      ]} /></div></section>

      <section id="registration" className={`section ${styles.registration}`}>
        <div className="section-shell">
          <p className="eyebrow">YOU ARE INVITED</p><h2>함께할 마음이 드셨다면.</h2><p className={styles.sectionLead}>참가비 입금이 확인되면 회원가입 안내를 보내드려요.<br />{" "}가입 신청서에 적은 이름과 이메일로 가입해 주세요.</p>
          <div className={styles.paymentGrid}>
            <div className={styles.payment}>
              <span className="eyebrow">{currentMeeting.cohort} 참가비</span><p className={styles.discount}>{invitation.feeLabel} <del>{invitation.regularFee}</del></p><h3>{invitation.fee}</h3><p>{invitation.feeDescription}</p>
              <div className={styles.bankCard}><span className="eyebrow">입금 계좌</span><p className={styles.accountNumber}>{invitation.account}</p><p>{invitation.bank} · 예금주 {invitation.accountHolder}</p>
              <CopyAccountButton account={invitation.account} />
              </div>
              {invitation.paymentDeadline && <p>입금 기한: {invitation.paymentDeadline}</p>}
              <p className={styles.paymentNote}>입금 후 같은 대화창에 입금자명을 남겨 주세요.</p>
            </div>
            <ol className={styles.steps}>
              <li><span>01</span><div><h3>참가비 입금</h3><p>일정과 환불 기준을 확인하고 안내받은 계좌로 입금해 주세요.</p></div></li>
              <li><span>02</span><div><h3>입금 확인 · 가입 안내</h3><p>운영자가 입금을 확인한 뒤 회원가입 링크를 보내드려요.</p></div></li>
              <li><span>03</span><div><h3>회원가입 · 첫 만남 준비</h3><p>가입과 회원 정보 등록을 마치고, 멤버십 공간에서 첫 만남을 준비해요.</p></div></li>
            </ol>
          </div>
          <div className={styles.paymentRefund}><h3>입금 전 환불 기준</h3><ul>{invitation.refundPolicy.split("\n").map((line) => <li key={line}>{line}</li>)}</ul><p>기수 시작일은 개별 일정 안내에서 확인해 주세요.</p></div>
        </div>
      </section>
      <section className={`section ${styles.closing}`}><div className="section-shell"><p className="eyebrow">SEE YOU SOON</p><h2>당신의 이야기가 놓일<br />자리를 준비할게요.</h2><p>궁금한 점은 초대장을 보내드린 대화창에 편하게 남겨 주세요.</p><a href="#registration" className="button button--ghost">참여 안내 다시 보기 <ArrowUpRight size={16} aria-hidden="true" /></a><span className={styles.signature}>READ ME 드림</span></div></section>
    </main>
  );
}
