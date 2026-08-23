"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, LockKeyhole, Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

const mainMenuItems = [
  { href: "/about", label: "READ ME 소개", description: "우리가 책을 읽고 대화하는 방식", status: null, enabled: true },
  { href: "/interview", label: "인터뷰 안내", description: "모임 전 서로의 기대를 맞추는 첫 대화", status: null, enabled: true },
  { href: "/meeting", label: "주제별 소개", description: "현재 01기 · 관계, 네 번의 질문", status: null, enabled: true },
  { href: "/community", label: "기수별 커뮤니티", description: "인생책과 대화, 기수별 후기", status: "준비 중", enabled: false },
  { href: "/membership", label: "READ ME 멤버십", description: "멤버를 위한 기록과 연결", status: "회원 전용", enabled: false }
] as const;

const publicLinks = mainMenuItems.filter((item) => item.enabled);

type HeaderProps = {
  isAuthenticated?: boolean;
  accountLabel?: string;
};

export function Header({ isAuthenticated = false, accountLabel = "로그인" }: HeaderProps) {
  const pathname = usePathname();
  const mainMenuRef = useRef<HTMLDetailsElement>(null);

  const closeMobileMenu = () => {
    if (mainMenuRef.current) mainMenuRef.current.open = false;
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
          <Link
            href={isAuthenticated ? "/my" : "/login"}
            className="desktop-account-link"
            aria-label={isAuthenticated ? `${accountLabel} 계정, 나의 서재로 이동` : "로그인"}
            title={accountLabel}
          >
            <span>{accountLabel}</span>
            <UserRound size={20} aria-hidden="true" />
          </Link>
        </nav>
        <details ref={mainMenuRef} name="mobile-header-menu" className="mobile-menu mobile-menu--main">
          <summary aria-label="주요 메뉴 열기"><Menu size={21} /></summary>
          <button type="button" className="mobile-menu__backdrop" aria-label="주요 메뉴 닫기" onClick={closeMobileMenu} />
          <div className="main-menu__panel">
            <div className="main-menu__header">
              <div><p>EXPLORE READ ME</p><strong>어디부터 둘러볼까요?</strong></div>
              <button type="button" aria-label="주요 메뉴 닫기" onClick={closeMobileMenu}><X size={20} /></button>
            </div>
            <nav aria-label="모바일 주요 메뉴">
              {mainMenuItems.map((item) => item.enabled ? (
                <Link key={item.href} href={item.href} data-current={pathname === item.href} onClick={closeMobileMenu}>
                  <span className="main-menu__copy"><strong>{item.label}</strong><span>{item.description}</span></span>
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ) : (
                <div key={item.href} className="main-menu__disabled" role="link" aria-disabled="true">
                  <span className="main-menu__copy">{item.status && <small>{item.status}</small>}<strong>{item.label}</strong><span>{item.description}</span></span>
                  {item.status === "회원 전용" && <LockKeyhole size={17} aria-hidden="true" />}
                </div>
              ))}
            </nav>
            <p className="main-menu__note">인터뷰와 커뮤니티, 멤버십은 다음 단계에서 차례로 열립니다.</p>
          </div>
        </details>
        <Link
          href={isAuthenticated ? "/my" : "/login"}
          className="mobile-account-link"
          aria-label={isAuthenticated ? `${accountLabel} 계정, 나의 서재로 이동` : "로그인"}
          title={accountLabel}
        >
          <span>{accountLabel}</span>
          <UserRound size={20} aria-hidden="true" />
        </Link>
      </div>
    </header>
  );
}
