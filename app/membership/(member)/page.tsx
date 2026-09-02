import Link from "next/link";
import { ArrowRight, BookOpenText, CalendarHeart, MessagesSquare } from "lucide-react";
import { requireActiveMembership } from "@/lib/membership/access";

export default async function MembershipPage() {
  const member = await requireActiveMembership();
  const talkHref = member.cohortNumber ? "/membership/talk" : "/membership";
  const sections = [
    { href: talkHref, icon: MessagesSquare, eyebrow: "ONLINE TALK", title: "온라인 대화", description: `${member.cohort ?? "참여 기수"}의 질문에 답하고 같은 기수 멤버의 생각을 만나보세요.` },
    { href: "/membership/community", icon: BookOpenText, eyebrow: "COMMUNITY", title: "멤버십 커뮤니티", description: "인생책을 소개하고 직접 쓴 글을 멤버들과 나눠보세요." },
    { href: "/membership/activities", icon: CalendarHeart, eyebrow: "ACTIVITIES", title: "멤버 활동", description: "북토의와 산책, 영화, 전시 같은 소모임을 함께해요." }
  ];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="eyebrow">READ ME MEMBERSHIP</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">함께 읽은 다음의 이야기</h1>
      <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">{member.displayName}님, 기수의 대화부터 멤버들이 만드는 새로운 만남까지 이곳에서 이어가세요.</p>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {sections.map(({ href, icon: Icon, eyebrow, title, description }) => (
          <Link key={href} href={href} className="group rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 transition-transform hover:-translate-y-1">
            <Icon className="text-[var(--forest)]" size={26} />
            <p className="mt-8 text-xs font-bold tracking-[.14em] text-[var(--forest)]">{eyebrow}</p>
            <h2 className="mt-3 text-xl font-semibold">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">{description}</p>
            <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[var(--forest)]">들어가기 <ArrowRight size={15} /></span>
          </Link>
        ))}
      </div>
    </main>
  );
}
