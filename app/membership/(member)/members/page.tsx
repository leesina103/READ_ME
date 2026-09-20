import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { UsersRound } from "lucide-react";
import { MemberIntroductionContent } from "@/components/MemberIntroductionContent";
import type { MemberDirectoryRow } from "@/lib/membership/introduction";
import { canUseLegacyMembershipFallback, requireActiveMembership } from "@/lib/membership/access";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "멤버 소개",
  robots: { index: false, follow: false }
};

function PageShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="eyebrow">MEMBERSHIP MEMBERS</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">함께 읽는 사람들</h1>
      <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">
        현재 기수 동료들이 남긴 소개와 인사를 모았습니다. 내 소개는{" "}
        <Link href="/my#introduction" className="font-semibold text-[var(--forest)] underline underline-offset-4">나의 서재</Link>에서 언제든 고칠 수 있어요. 소개는 현재 기수 동료들에게만 보여요.
      </p>
      {children}
    </main>
  );
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="mt-10 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-8 text-sm leading-7 text-[var(--muted)]">
      {children}
    </div>
  );
}

function MemberCard({ row, isMe }: { row: MemberDirectoryRow; isMe: boolean }) {
  const titleId = `member-${row.user_id}-title`;

  return (
    <article aria-labelledby={titleId} className="rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--sand)] text-base font-bold text-[var(--ink)]" aria-hidden="true">
          {row.display_name.slice(0, 1)}
        </span>
        <h3 id={titleId} className="min-w-0 break-words text-base font-semibold">
          {row.display_name}
          {isMe && <span className="ml-2 rounded-full bg-[var(--forest)] px-2 py-1 text-xs font-bold text-[var(--cream)]">나</span>}
        </h3>
      </div>
      <MemberIntroductionContent introduction={row} />
    </article>
  );
}

export default async function MembersPage() {
  const member = await requireActiveMembership();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_member_directory");

  if (error) {
    return (
      <PageShell>
        <Notice>
          {canUseLegacyMembershipFallback(error.code)
            ? "멤버 소개는 준비 중이에요. 잠시 뒤 다시 들러주세요."
            : "멤버 소개를 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요."}
        </Notice>
      </PageShell>
    );
  }

  const rows = ((data ?? []) as MemberDirectoryRow[]).filter((row) => row.cohort === member.cohort);

  if (rows.length === 0) {
    return (
      <PageShell>
        <Notice>아직 소개를 남긴 동료가 없어요. 첫 소개를 남겨보세요.</Notice>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="mt-10" aria-label={`${member.cohort} 멤버 소개`}>
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-4">
          <h2 className="inline-flex items-center gap-2 text-xl font-semibold">
            <UsersRound size={18} className="text-[var(--forest)]" /> {member.cohort}
          </h2>
          <p className="text-sm text-[var(--muted)]">{rows.length}명</p>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {rows.map((row) => <MemberCard key={row.user_id} row={row} isMe={row.user_id === member.user.id} />)}
        </div>
      </section>
    </PageShell>
  );
}
