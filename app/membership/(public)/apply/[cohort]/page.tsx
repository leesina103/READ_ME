import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { MembershipApplicationForm } from "@/components/MembershipApplicationForm";
import { currentMeeting } from "@/data/currentMeeting";
import { cohortNumberFromName } from "@/data/seasonWeeks";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const currentCohortNumber = cohortNumberFromName(currentMeeting.cohort);

type MembershipApplyPageProps = { params: Promise<{ cohort: string }> };

function parseCohortNumber(value: string) {
  return /^\d+$/.test(value) ? Number(value) : null;
}

export async function generateMetadata({ params }: MembershipApplyPageProps): Promise<Metadata> {
  const cohortNumber = parseCohortNumber((await params).cohort);
  if (cohortNumber === null) return {};
  return { title: `${cohortNumber}기 가입 신청`, description: `READ ME ${cohortNumber}기 가입 승인을 위한 신청서를 작성합니다.` };
}

export default async function MembershipApplyPage({ params }: MembershipApplyPageProps) {
  const cohortNumber = parseCohortNumber((await params).cohort);
  if (currentCohortNumber === null || cohortNumber === null || cohortNumber < 1 || cohortNumber > currentCohortNumber) notFound();

  const cohort = `${cohortNumber}기`;
  const closed = cohortNumber < currentCohortNumber;
  const open = !closed && currentMeeting.recruiting;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16 md:py-24">
      <Link href="/meeting" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--muted)]"><ArrowLeft size={16} /> 현재 모임으로 돌아가기</Link>
      <section className="mt-8 rounded-[32px] border border-[var(--line)] bg-[var(--paper)] p-7 sm:p-10 md:p-12">
        <p className="eyebrow">MEMBERSHIP APPLICATION</p>
        <h1 className="mt-5 font-serif text-[42px] font-medium leading-[1.15] tracking-[-0.04em] sm:text-5xl">함께 읽기 위한<br />{cohort} 가입 신청</h1>
        {open ? (
          <>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)]">인터뷰를 마친 분의 가입 정보를 한 번에 받아 운영자가 확인합니다. 승인 후 같은 이름과 이메일로 회원가입할 수 있어요.</p>
            <div className="mt-7 flex items-start gap-3 rounded-2xl bg-[var(--sage)] px-5 py-4 text-sm leading-6"><LockKeyhole className="mt-0.5 shrink-0 text-[var(--forest)]" size={18} /><p className="m-0">이 페이지는 공개 메뉴에 노출하지 않습니다. 신청 내용은 운영자만 확인할 수 있습니다.</p></div>
            <MembershipApplicationForm cohort={cohort} configured={isSupabaseConfigured()} />
          </>
        ) : (
          <>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--muted)]">{closed ? `READ ME ${cohort} 모집은 마감되었습니다. 지금은 ${currentMeeting.cohort} 신청을 받고 있어요.` : `READ ME ${cohort} 모집을 준비하고 있습니다. 모집이 시작되면 이 페이지에서 신청할 수 있어요.`}</p>
            {closed && <Link href={`/membership/apply/${currentCohortNumber}`} className="button button--primary mt-8">{currentMeeting.cohort} 신청서로 가기</Link>}
          </>
        )}
      </section>
    </main>
  );
}
