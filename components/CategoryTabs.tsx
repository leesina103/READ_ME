import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type CategoryTab = { key: string; label: string; icon: LucideIcon; href: string };

type CategoryTabsProps = { tabs: CategoryTab[]; activeKey: string; ariaLabel: string };

export function CategoryTabs({ tabs, activeKey, ariaLabel }: CategoryTabsProps) {
  return (
    <nav className="flex flex-wrap gap-2" aria-label={ariaLabel}>
      {tabs.map(({ key, label, icon: Icon, href }) => {
        const active = key === activeKey;
        return (
          <Link
            key={key}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-sm font-semibold ${active ? "border-[var(--forest)] bg-[var(--forest)] text-[var(--cream)]" : "border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--sage)]"}`}
          >
            <Icon size={16} aria-hidden="true" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
