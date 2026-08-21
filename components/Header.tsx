"use client";

import Link from "next/link";
import { BookOpen, Menu } from "lucide-react";
import { useRef } from "react";

const publicLinks = [
  { href: "/about", label: "READ ME 소개" },
  { href: "/meeting", label: "모임 둘러보기" }
];

export function Header() {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" aria-label="READ ME 홈">
          <span className="brand-mark__icon"><BookOpen size={19} strokeWidth={1.8} /></span>
          <span>READ ME</span>
        </Link>
        <nav className="desktop-nav" aria-label="주요 메뉴">
          {publicLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <span className="nav-divider" aria-hidden="true" />
          <Link href="/my" className="nav-library">나의 서재</Link>
          <Link href="/login" className="nav-login">로그인</Link>
        </nav>
        <details ref={mobileMenuRef} className="mobile-menu">
          <summary aria-label="메뉴 열기"><Menu size={21} /></summary>
          <nav aria-label="모바일 메뉴">
            {publicLinks.map((link) => <Link key={link.href} href={link.href} onClick={closeMobileMenu}>{link.label}</Link>)}
            <Link href="/my" onClick={closeMobileMenu}>나의 서재 <small>회원 전용</small></Link>
            <Link href="/login" onClick={closeMobileMenu}>로그인 <small>기록 이어보기</small></Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
