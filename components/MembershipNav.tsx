"use client";

import Link from "next/link";
import { BookOpenText, CalendarHeart, House, MessagesSquare } from "lucide-react";
import { usePathname } from "next/navigation";

export function MembershipNav({ cohortNumber }: { cohortNumber: number | null }) {
  const pathname = usePathname();
  const items = [
    { href: "/membership", label: "멤버십 홈", icon: House, active: pathname === "/membership" },
    { href: cohortNumber ? "/membership/talk" : "/membership", label: "온라인 대화", icon: MessagesSquare, active: pathname.startsWith("/membership/talk") },
    { href: "/membership/community", label: "커뮤니티", icon: BookOpenText, active: pathname.startsWith("/membership/community") },
    { href: "/membership/activities", label: "멤버 활동", icon: CalendarHeart, active: pathname.startsWith("/membership/activities") }
  ];

  return (
    <nav className="border-b border-[var(--line)] bg-[var(--paper)]" aria-label="멤버십 메뉴">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-3 sm:px-6">
        {items.map(({ href, label, icon: Icon, active }) => active ? (
          <span key={label} aria-current="page" aria-disabled="true" className="inline-flex min-h-11 shrink-0 cursor-default items-center gap-2 rounded-full bg-[var(--forest)] px-4 text-sm font-semibold text-[var(--cream)]">
            <Icon size={16} /> {label}
          </span>
        ) : (
          <Link key={label} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold hover:bg-[var(--sage)]" href={href}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
