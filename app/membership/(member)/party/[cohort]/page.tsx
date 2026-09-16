import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Clock3, Gift, MapPin, MessageSquareHeart, NotebookPen, UsersRound, UtensilsCrossed } from "lucide-react";
import { themeForCohort } from "@/data/cohortThemes";
import { partyInvitationForCohort, type PartyPerk } from "@/data/partyInvitations";
import { requireActiveMembership } from "@/lib/membership/access";

export const metadata: Metadata = {
  title: "파티 초대장",
  robots: { index: false, follow: false }
};

const timeZone = "Asia/Seoul";
const formatPartyDate = (value: string) => new Intl.DateTimeFormat("ko-KR", { timeZone, month: "long", day: "numeric", weekday: "long" }).format(new Date(value));
const formatPartyTime = (value: string) => new Intl.DateTimeFormat("ko-KR", { timeZone, hour: "numeric", minute: "2-digit" }).format(new Date(value));
const perkIcons: Record<PartyPerk["icon"], typeof Gift> = { meal: UtensilsCrossed, record: NotebookPen, gift: Gift };

function Lines({ lines }: { lines: readonly string[] }) {
  return <>{lines.map((line, index) => <span key={line} className={index > 0 ? "block" : undefined}>{line}</span>)}</>;
}

type PartyInvitationPageProps = { params: Promise<{ cohort: string }> };

export default async function PartyInvitationPage({ params }: PartyInvitationPageProps) {
  const member = await requireActiveMembership();
  const cohortNumber = Number((await params).cohort);

  if (!Number.isInteger(cohortNumber) || cohortNumber < 1 || member.cohortNumber !== cohortNumber) notFound();

  const invitation = partyInvitationForCohort(cohortNumber);
  const theme = themeForCohort(cohortNumber);
  const cohortName = member.cohort ?? `${cohortNumber}기`;
  const confirmed = invitation.status !== "draft" && invitation.startsAt !== null;
  const facts = [
    { icon: CalendarDays, label: "DATE", value: confirmed && invitation.startsAt ? formatPartyDate(invitation.startsAt) : "확정 후 안내" },
    { icon: Clock3, label: "TIME", value: confirmed && invitation.startsAt ? formatPartyTime(invitation.startsAt) : "확정 후 안내" },
    { icon: MapPin, label: "PLACE", value: confirmed && invitation.venue ? invitation.venue.name : "확정 후 안내" }
  ];

  return (
    <main>
      {/* 표지. 주제 상세 페이지처럼 어두운 바탕 위에 제목과 리미 그림을 크게 둔다. */}
      <section className="bg-[var(--ink)] text-[var(--cream)]">
        <div className="mx-auto max-w-5xl px-6 pb-16 pt-12 md:pb-24 md:pt-16">
          <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6">
            <div>
              <p className="text-xs font-bold tracking-[.2em] text-[var(--sage)]">EPILOGUE · READ ME {cohortName}</p>
              <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.02] tracking-[-0.05em] sm:text-6xl md:text-7xl"><Lines lines={invitation.title} /></h1>
            </div>
            <p className="m-0 max-w-sm leading-8 text-[var(--cream)]/70">{invitation.tagline}</p>
          </div>

          <div className="relative mt-12 aspect-[4/3] overflow-hidden rounded-[20px] border border-[var(--cream)]/20 bg-[var(--cream)] sm:aspect-[16/9] sm:rounded-[30px]">
            <Image
              src="/theme-remi-relationship.png"
              alt="컵을 들고 마주 앉아 이야기 나누는 리미들"
              fill
              priority
              sizes="(max-width: 820px) calc(100vw - 48px), 1024px"
              className="object-cover"
            />
          </div>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-[24px] border border-[var(--cream)]/20 bg-[var(--cream)]/20 sm:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[var(--ink)] p-6">
                <dt className="flex items-center gap-2 text-[11px] font-bold tracking-[.16em] text-[var(--sage)]"><Icon size={14} aria-hidden="true" /> {label}</dt>
                <dd className="m-0 mt-3 text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#party-schedule" className="button button--light">시간과 장소 보기 <ArrowDown size={15} aria-hidden="true" /></a>
            <span className="text-sm text-[var(--cream)]/60">{member.displayName}님을 위한 비공개 초대장이에요.</span>
          </div>
        </div>
      </section>

      {/* 함께 읽은 네 권. READ ME만의 구역으로, 기수 주제 데이터를 그대로 불러온다. */}
      <section className="bg-[var(--paper)]">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <p className="eyebrow">WHAT WE READ</p>
          <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl">{theme.name} 주제로 함께 읽은 네 권</h2>
          <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">“{theme.subtitle}” 이 질문을 따라 여덟 주를 걸어왔어요. 그날 밤, 이 책들에서 시작한 이야기를 다시 꺼내요.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {theme.sessions.map((session, index) => (
              <li key={session.book} className="rounded-[22px] border border-[var(--line)] bg-[var(--cream)] p-6">
                <span className="font-serif text-2xl leading-none text-[var(--sand)]">{String(index + 1).padStart(2, "0")}</span>
                <p className="mt-5 text-xs font-bold tracking-[.12em] text-[var(--forest)]">{session.title}</p>
                <strong className="mt-2 block text-lg leading-snug">『{session.book}』</strong>
                <small className="mt-1 block text-sm text-[var(--muted)]">{session.author}</small>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 이 밤의 이야기 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[.85fr_1.15fr] md:gap-16">
          <div>
            <p className="eyebrow">THE STORY</p>
            <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl"><Lines lines={invitation.story.title} /></h2>
          </div>
          <div className="space-y-5 leading-8 text-[var(--muted)] md:pt-10">
            {invitation.story.paragraphs.map((paragraph) => <p key={paragraph} className="m-0">{paragraph}</p>)}
          </div>
        </div>
      </section>

      {/* 그날 밤의 흐름 */}
      <section className="bg-[var(--paper)]">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <p className="eyebrow">PROGRAM</p>
          <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl"><Lines lines={invitation.program.title} /></h2>
          <p className="mt-4 max-w-2xl leading-8 text-[var(--muted)]">{invitation.program.lead}</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {invitation.program.steps.map((step, index) => (
              <li key={step.title} className="rounded-[22px] border border-[var(--line)] bg-[var(--cream)] p-6 md:p-7">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--forest)] font-serif text-sm text-[var(--cream)]">{index + 1}</span>
                <h3 className="mt-7 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 준비한 것들 */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <p className="eyebrow">PREPARED FOR YOU</p>
        <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl">그날을 위해 준비했어요</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {invitation.perks.map((perk) => {
            const Icon = perkIcons[perk.icon];
            return (
              <article key={perk.title} className="rounded-[22px] border border-[var(--line)] bg-[var(--paper)] p-6 md:p-7">
                <Icon className="text-[var(--forest)]" size={24} strokeWidth={1.6} aria-hidden="true" />
                <h3 className="mt-6 text-lg font-semibold">{perk.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{perk.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* 시간과 장소 */}
      <section id="party-schedule" className="bg-[var(--paper)] scroll-mt-20">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <p className="eyebrow">WHEN &amp; WHERE</p>
          <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
            {confirmed && invitation.startsAt ? <>{formatPartyDate(invitation.startsAt)},<span className="block">만나요</span></> : <>일정은 확정되면<span className="block">이곳에서 안내할게요</span></>}
          </h2>

          {confirmed ? (
            <div className="mt-10 grid gap-6 md:grid-cols-[1.1fr_.9fr] md:gap-10">
              <ol className="rounded-[24px] border border-[var(--line)] bg-[var(--cream)] px-6 md:px-8">
                {invitation.timeline.map((item) => (
                  <li key={item.time} className="grid gap-2 border-b border-[var(--line)] py-6 last:border-b-0 sm:grid-cols-[150px_1fr] sm:gap-6">
                    <span className="font-serif text-lg text-[var(--forest)]">{item.time}</span>
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="mt-1 text-sm leading-7 text-[var(--muted)]">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="grid gap-4 content-start">
                {invitation.venue && (
                  <article className="rounded-[24px] border border-[var(--line)] bg-[var(--cream)] p-6 md:p-7">
                    <p className="flex items-center gap-2 text-[11px] font-bold tracking-[.16em] text-[var(--forest)]"><MapPin size={14} aria-hidden="true" /> PLACE</p>
                    <h3 className="mt-4 text-xl font-semibold">{invitation.venue.name}</h3>
                    <p className="mt-2 text-sm leading-7 text-[var(--muted)]">{invitation.venue.address}</p>
                    {invitation.venue.mapHref ? (
                      <a href={invitation.venue.mapHref} target="_blank" rel="noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[var(--forest)]">지도에서 위치 보기 <ArrowUpRight size={15} aria-hidden="true" /></a>
                    ) : (
                      <p className="mt-5 text-xs text-[var(--muted)]">지도 링크는 참석 확정 후 함께 보내드려요.</p>
                    )}
                  </article>
                )}
                <article className="rounded-[24px] border border-[var(--line)] bg-[var(--cream)] p-6 md:p-7">
                  <p className="flex items-center gap-2 text-[11px] font-bold tracking-[.16em] text-[var(--forest)]"><UsersRound size={14} aria-hidden="true" /> WHO</p>
                  <h3 className="mt-4 text-xl font-semibold">{invitation.invitees}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--muted)]">READ ME {cohortName}로 함께 읽은 분이라면 누구든 환영이에요.</p>
                </article>
              </div>
            </div>
          ) : (
            <p className="mt-10 rounded-[24px] border border-[var(--line)] bg-[var(--cream)] p-7 leading-8 text-[var(--muted)]">날짜와 장소가 정해지면 이 자리에 시간표와 오는 길을 채워둘게요. 확정 소식은 온라인 대화방과 이메일로도 알려드려요.</p>
          )}
        </div>
      </section>

      {/* 자주 묻는 질문. 랜딩 페이지의 접기 목록 스타일을 그대로 쓴다. */}
      <section className="mx-auto max-w-5xl px-6 py-16 md:py-24">
        <div className="grid gap-10 md:grid-cols-[.7fr_1.3fr] md:gap-16">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl">오기 전에<span className="block">궁금할 이야기</span></h2>
          </div>
          <div className="faq-list">
            {invitation.faqs.map((faq, index) => (
              <details key={faq.question}>
                <summary><span>{String(index + 1).padStart(2, "0")}</span>{faq.question}<i>+</i></summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 참석 안내 */}
      <section className="mx-auto max-w-5xl px-6 pb-16 md:pb-24">
        <div className="rounded-[32px] bg-[var(--forest)] px-7 py-10 text-[var(--cream)] sm:px-10 md:px-12 md:py-14">
          <p className="text-xs font-bold tracking-[.2em] text-[var(--sage)]">RSVP</p>
          <h2 className="mt-4 font-serif text-3xl font-medium tracking-[-0.03em] sm:text-4xl">
            {invitation.status === "closed" ? <>참석 신청이<span className="block">마감됐어요</span></> : confirmed ? <>그날 밤,<span className="block">자리를 비워둘게요</span></> : <>일정이 정해지면<span className="block">신청을 열게요</span></>}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[11px] font-bold tracking-[.16em] text-[var(--sage)]">FEE</p>
              <p className="mt-2 font-serif text-4xl font-medium">{confirmed ? invitation.fee.amount : "확정 후 안내"}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--cream)]/75">{invitation.fee.note}</p>
            </div>
            <div className="grid gap-3 md:justify-items-end">
              {invitation.status === "open" && confirmed && invitation.rsvp.href ? (
                <a href={invitation.rsvp.href} target="_blank" rel="noreferrer" className="button button--light">{invitation.rsvp.label} <ArrowUpRight size={15} aria-hidden="true" /></a>
              ) : (
                <span aria-disabled="true" className="button cursor-not-allowed border border-[var(--cream)]/30 text-[var(--cream)]/70 hover:translate-y-0">{invitation.status === "closed" ? "신청 마감" : invitation.status === "open" && confirmed ? "신청 링크 준비 중" : "신청 준비 중"}</span>
              )}
              <p className="m-0 max-w-xs text-xs leading-6 text-[var(--cream)]/65 md:text-right">{invitation.status === "closed" ? "이미 확정된 분은 그날 만나요. 궁금한 점은 운영진에게 편하게 물어주세요." : invitation.rsvp.note}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 마무리. 이미 있는 파티 후기 기능과 연결한다. */}
      <section className="mx-auto max-w-5xl px-6 pb-20 md:pb-28">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8">
          <div className="flex items-start gap-4">
            <MessageSquareHeart className="mt-1 shrink-0 text-[var(--forest)]" size={24} strokeWidth={1.6} aria-hidden="true" />
            <div>
              <h2 className="text-xl font-semibold">파티가 끝난 뒤, 여운을 남겨주세요</h2>
              <p className="mt-2 text-sm leading-7 text-[var(--muted)]">좋았던 순간과 다음 만남에 바라는 점을 짧게 들려주시면 다음 파티를 준비하는 데 큰 힘이 돼요.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/membership/review?event=party" className="button button--primary">파티 후기 남기기 <ArrowRight size={15} aria-hidden="true" /></Link>
            <Link href="/membership" className="button button--ghost">멤버십 홈으로</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
