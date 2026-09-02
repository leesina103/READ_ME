"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown, LockKeyhole, Menu, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRef } from "react";

const publicMenuItems = [
  { href: "/about", label: "READ ME 소개", description: "우리가 책을 읽고 대화하는 방식" },
  { href: "/interview", label: "인터뷰 안내", description: "참여 전 가볍게 나누는 첫 대화" },
  { href: "/themes", label: "주제별 소개", description: "현재 1기 · 관계, 여섯 기수의 질문" }
] as const;

const membershipGroups = [
  {
    label: "커뮤니티",
    href: "/membership/community",
    items: [
      { label: "인생책 소개", href: "/membership/community?tab=books" },
      { label: "글 공유", href: "/membership/community?tab=writing" }
    ]
  },
  {
    label: "멤버 활동",
    href: "/membership/activities",
    items: [
      { label: "북토의", href: "/membership/activities?tab=book-club" },
      { label: "소모임", href: "/membership/activities?tab=gatherings" }
    ]
  }
] as const;

type HeaderProps = {
  isAuthenticated?: boolean;
  isMember?: boolean;
  accountLabel?: string;
};

type MembershipMenuContentProps = {
  enabled: boolean;
  onNavigate?: () => void;
};

function MembershipMenuContent({ enabled, onNavigate }: MembershipMenuContentProps) {
  return (
    <div className="membership-menu__content">
      <div className="membership-menu__intro">
        <div><small>{enabled ? "MEMBER ONLY" : "LOCKED"}</small><strong>READ ME 멤버십</strong></div>
        {enabled ? <Link href="/membership" onClick={onNavigate}>멤버십 홈 <ArrowRight size={14} /></Link> : <LockKeyhole size={17} aria-hidden="true" />}
      </div>
      <div className="membership-menu__groups">
        {membershipGroups.map((group) => (
          <section key={group.href}>
            {enabled ? <Link className="membership-menu__group-title" href={group.href} onClick={onNavigate}>{group.label}</Link> : <strong className="membership-menu__group-title">{group.label}</strong>}
            <div className="membership-menu__choices">
              {group.items.map((item) => enabled ? (
                <Link key={item.href} href={item.href} onClick={onNavigate}>{item.label}</Link>
              ) : (
                <span key={item.href} aria-disabled="true">{item.label}</span>
              ))}
            </div>
          </section>
        ))}
      </div>
      {!enabled && <p className="membership-menu__locked-note">로그인한 활성 멤버에게 열리는 메뉴입니다.</p>}
    </div>
  );
}

export function Header({ isAuthenticated = false, isMember = false, accountLabel = "로그인" }: HeaderProps) {
  const pathname = usePathname();
  const mainMenuRef = useRef<HTMLDetailsElement>(null);

  const closeMobileMenu = () => {
    if (mainMenuRef.current) mainMenuRef.current.open = false;
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link href="/" className="brand-mark" aria-label="READ ME 홈"><span className="brand-mark__icon"><BookOpen size={19} strokeWidth={1.8} /></span><span>READ ME</span></Link>

        <nav className="desktop-nav" aria-label="주요 메뉴">
          {publicMenuItems.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          <details className="desktop-membership-menu">
            <summary aria-label="멤버십 하위 메뉴 열기"><span>READ ME 멤버십</span><ChevronDown size={15} aria-hidden="true" /></summary>
            <div className="desktop-membership-menu__panel"><MembershipMenuContent enabled={isMember} /></div>
          </details>
          <span className="nav-divider" aria-hidden="true" />
          <Link href={isAuthenticated ? "/my" : "/login"} className="desktop-account-link" aria-label={isAuthenticated ? `${accountLabel} 계정, 나의 서재로 이동` : "로그인"} title={accountLabel}><span>{accountLabel}</span><UserRound size={20} aria-hidden="true" /></Link>
        </nav>

        <details ref={mainMenuRef} name="mobile-header-menu" className="mobile-menu mobile-menu--main">
          <summary aria-label="주요 메뉴 열기"><Menu size={21} /></summary>
          <button type="button" className="mobile-menu__backdrop" aria-label="주요 메뉴 닫기" onClick={closeMobileMenu} />
          <div className="main-menu__panel">
            <div className="main-menu__header"><div><p>EXPLORE READ ME</p><strong>어디부터 둘러볼까요?</strong></div><button type="button" aria-label="주요 메뉴 닫기" onClick={closeMobileMenu}><X size={20} /></button></div>
            <nav aria-label="모바일 주요 메뉴">
              {publicMenuItems.map((item) => (
                <Link key={item.href} href={item.href} data-current={pathname === item.href || pathname.startsWith(`${item.href}/`)} onClick={closeMobileMenu}>
                  <span className="main-menu__copy"><strong>{item.label}</strong><span>{item.description}</span></span><ArrowRight size={18} aria-hidden="true" />
                </Link>
              ))}
              <details className="main-menu__membership">
                <summary><span className="main-menu__copy"><small>{isMember ? "회원 전용" : "잠김"}</small><strong>READ ME 멤버십</strong><span>커뮤니티와 멤버 활동</span></span><ChevronDown size={18} aria-hidden="true" /></summary>
                <MembershipMenuContent enabled={isMember} onNavigate={closeMobileMenu} />
              </details>
            </nav>
            <p className="main-menu__note">멤버십 공간은 로그인한 활성 멤버에게만 열립니다.</p>
          </div>
        </details>

        <Link href={isAuthenticated ? "/my" : "/login"} className="mobile-account-link" aria-label={isAuthenticated ? `${accountLabel} 계정, 나의 서재로 이동` : "로그인"} title={accountLabel}><span>{accountLabel}</span><UserRound size={20} aria-hidden="true" /></Link>
      </div>
    </header>
  );
}
