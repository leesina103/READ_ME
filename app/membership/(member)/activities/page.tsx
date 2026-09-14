import { BookOpenCheck, Footprints } from "lucide-react";
import { CategoryTabs } from "@/components/CategoryTabs";

const activityTabs = {
  "book-club": { icon: BookOpenCheck, label: "북토의", description: "정해진 커리큘럼을 벗어나 멤버들이 고른 책으로 다시 만납니다.", empty: "예정된 북토의가 없어요." },
  gatherings: { icon: Footprints, label: "소모임", description: "산책, 영화, 전시처럼 함께하고 싶은 활동을 제안하고 참여합니다.", empty: "예정된 소모임이 없어요." }
} as const;

type ActivitiesPageProps = { searchParams: Promise<{ tab?: string }> };

export default async function ActivitiesPage({ searchParams }: ActivitiesPageProps) {
  const requestedTab = (await searchParams).tab;
  const activeTab = requestedTab === "gatherings" ? "gatherings" : "book-club";
  const active = activityTabs[activeTab];

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <p className="eyebrow">MEMBERSHIP ACTIVITIES</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-[-0.04em] sm:text-5xl">책 밖에서도 이어지는 만남</h1>
      <p className="mt-5 max-w-2xl leading-8 text-[var(--muted)]">멤버십 북토의와 멤버가 제안하는 다양한 소모임을 확인하는 공간입니다.</p>

      <div className="mt-10">
        <CategoryTabs
          ariaLabel="멤버 활동 분류"
          activeKey={activeTab}
          tabs={Object.entries(activityTabs).map(([key, tab]) => ({ key, label: tab.label, icon: tab.icon, href: `/membership/activities?tab=${key}` }))}
        />
      </div>

      <section className="mt-5 rounded-[28px] border border-[var(--line)] bg-[var(--paper)] p-7 md:p-8" aria-label={active.label}>
        <p className="leading-7 text-[var(--muted)]">{active.description}</p>
        <p className="mt-6 border-t border-[var(--line)] pt-6 text-sm text-[var(--muted)]">{active.empty}</p>
      </section>
    </main>
  );
}
