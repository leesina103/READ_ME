"use client";

import Link from "next/link";
import { BookOpenText, CalendarHeart, ChevronLeft, ChevronRight, House, MessagesSquare, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function MembershipNav({ cohortNumber }: { cohortNumber: number | null }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [directions, setDirections] = useState({ left: false, right: false });

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const update = () => {
      const left = scroller.scrollLeft > 1;
      const right = scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 1;
      setDirections((previous) => previous.left === left && previous.right === right ? previous : { left, right });
    };
    // 메뉴 진입 시 현재 페이지가 가려지지 않도록 가로 위치만 조정합니다.
    const active = scroller.querySelector<HTMLElement>('[aria-current="page"]');
    if (active) scroller.scrollLeft = active.offsetLeft - (scroller.clientWidth - active.offsetWidth) / 2;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(scroller);
    Array.from(scroller.children).forEach((child) => observer.observe(child));
    scroller.addEventListener("scroll", update, { passive: true });
    return () => {
      observer.disconnect();
      scroller.removeEventListener("scroll", update);
    };
  }, [pathname]);

  const move = (direction: number) => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    scroller.scrollBy({
      left: direction * scroller.clientWidth * 0.75,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
    });
  };
  const items = [
    { href: "/membership", label: "멤버십 홈", icon: House, active: pathname === "/membership" },
    { href: cohortNumber ? "/membership/talk" : "/membership", label: "온라인 대화", icon: MessagesSquare, active: pathname.startsWith("/membership/talk") },
    { href: "/membership/community", label: "멤버 커뮤니티", icon: BookOpenText, active: pathname.startsWith("/membership/community") },
    { href: "/membership/activities", label: "멤버 활동", icon: CalendarHeart, active: pathname.startsWith("/membership/activities") },
    { href: "/membership/members", label: "멤버 소개", icon: UsersRound, active: pathname.startsWith("/membership/members") }
  ];

  return (
    <nav className="border-b border-[var(--line)] bg-[var(--paper)]" aria-label="멤버십 메뉴">
      <div className="membership-nav__shell">
        <button type="button" className="membership-nav__arrow membership-nav__arrow--left" aria-label="이전 멤버십 메뉴 보기" aria-controls="membership-menu-items" disabled={!directions.left} onClick={() => move(-1)}>
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
      <div ref={scrollRef} id="membership-menu-items" className="membership-nav__items flex gap-1 overflow-x-auto py-3">
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
        <button type="button" className="membership-nav__arrow membership-nav__arrow--right" aria-label="다음 멤버십 메뉴 보기" aria-controls="membership-menu-items" disabled={!directions.right} onClick={() => move(1)}>
          <ChevronRight size={20} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
