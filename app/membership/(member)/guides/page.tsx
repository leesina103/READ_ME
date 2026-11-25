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
  const { data, error } = await supabase.rpc("member_guide_profiles");
  const guides = (data ?? []) as { guide_id: string; nickname: string; introduction: string }[];

  return (
    <main className="section">
      <div className="section-shell">
        <p className="eyebrow">READ ME GUIDES</p>
        <h1 className="mt-5 font-serif text-4xl tracking-[-0.04em]">함께하는 가이드</h1>
        <p className="mt-5 leading-8 text-[var(--muted)]">책과 질문으로 만남을 이어가는 가이드들을 소개해요.</p>
        <div className="mt-10 grid grid-cols-2 gap-5 max-[820px]:grid-cols-1">
          {error ? <p role="alert">가이드 소개를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.</p>
            : guides.length === 0 ? <p className="text-[var(--muted)]">가이드 소개를 준비하고 있어요.</p>
            : guides.map(({ guide_id, nickname, introduction }, index) => (
              <section key={guide_id} id={guideAnchor(guide_id)} className="min-w-0 scroll-mt-28 break-words rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 max-[430px]:p-5">
                <h2 id={guides[index - 1]?.nickname !== nickname ? guideAnchor(nickname) : undefined} className="text-xl font-semibold">가이드 {nickname}</h2>
                <p className="mt-4 whitespace-pre-line break-words text-sm leading-8 text-[var(--muted)]">{introduction || "소개를 준비하고 있어요."}</p>
              </section>
            ))}
        </div>
        <Link href="/membership" className="button mt-10">멤버십 홈으로</Link>
      </div>
    </main>
  );
}
