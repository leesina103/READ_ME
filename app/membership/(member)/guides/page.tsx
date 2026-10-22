import type { Metadata } from "next";
import Link from "next/link";
import { requireActiveMembership } from "@/lib/membership/access";
import { guideAnchor } from "@/lib/membership/guides";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "함께하는 가이드",
  robots: { index: false, follow: false }
};

export default async function GuidesPage() {
  await requireActiveMembership();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("list_member_guides");
  const guides = new Map<string, string[]>();
  for (const guide of (data ?? []) as { host_name: string; host_style: string | null }[]) {
    const introductions = guides.get(guide.host_name) ?? [];
    if (guide.host_style && !introductions.includes(guide.host_style)) introductions.push(guide.host_style);
    guides.set(guide.host_name, introductions);
  }

  return (
    <main className="section">
      <div className="section-shell">
        <p className="eyebrow">READ ME GUIDES</p>
        <h1 className="mt-5 font-serif text-4xl tracking-[-0.04em]">함께하는 가이드</h1>
        <p className="mt-5 leading-8 text-[var(--muted)]">책과 질문으로 만남을 이어가는 가이드들을 소개해요.</p>
        <div className="mt-10 grid grid-cols-2 gap-5 max-[820px]:grid-cols-1">
          {error ? <p role="alert">가이드 소개를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>
            : guides.size === 0 ? <p className="text-[var(--muted)]">가이드 소개를 준비하고 있어요.</p>
            : [...guides].map(([name, introductions]) => (
              <section key={name} id={guideAnchor(name)} className="min-w-0 scroll-mt-28 break-words rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 max-[430px]:p-5">
                <h2 className="text-xl font-semibold">가이드 {name}</h2>
                {introductions.length ? introductions.map((introduction) => <p key={introduction} className="mt-4 whitespace-pre-line text-sm leading-8 text-[var(--muted)]">{introduction}</p>) : <p className="mt-4 text-sm text-[var(--muted)]">소개를 준비하고 있어요.</p>}
              </section>
            ))}
        </div>
        <Link href="/membership" className="button mt-10">멤버십 홈으로</Link>
      </div>
    </main>
  );
}
