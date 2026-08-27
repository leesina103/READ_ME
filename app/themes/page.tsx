import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { currentTheme, themes } from "@/data/themes";

export const metadata: Metadata = {
  title: "주제별 소개",
  description: "READ ME가 기수별로 함께 읽고 대화하는 여섯 가지 삶의 주제를 소개합니다."
};

export default function ThemesPage() {
  return (
    <main>
      <section className="themes-hero section-shell">
        <p className="eyebrow">READING LIFE, TOGETHER</p>
        <h1>삶을 읽는<br /><span>여섯 가지 주제</span></h1>
        <p>한 기수는 하나의 주제를 따라갑니다. 책에서 시작한 질문을 서로의 경험과 연결하며, 익숙했던 삶을 새로운 방향에서 바라봅니다.</p>
      </section>

      <section className="section section--paper">
        <div className="section-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">CURRENT SEASON</p><h2>지금 함께 읽는 주제</h2></div>
          </div>
          <article className="current-theme-card">
            <div><span>01기</span><p>현재 기수</p></div>
            <div><p>{currentTheme.name}</p><h3>{currentTheme.subtitle}</h3></div>
            <div className="current-theme-card__actions">
              <Link href="/meeting" className="button button--light">01기 모임 안내 보기 <ArrowRight size={16} /></Link>
            </div>
          </article>
          <Link href="/interview" className="theme-interview-cta">
            <div>
              <span>JOIN THE CONVERSATION</span>
              <strong>인터뷰 신청하기</strong>
              <p>서로를 존중하며 깊이 대화할 수 있는지, 가볍게 이야기를 나누며 먼저 만나봅니다.</p>
            </div>
            <ArrowRight size={26} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="section themes-index-section">
        <div className="section-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">SIX THEMES</p><h2>어떤 삶을 읽어볼까요?</h2></div>
          </div>
          <div className="theme-grid">
            {themes.map((theme, index) => (
              <Link key={theme.slug} href={`/themes/${theme.slug}`} className="theme-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><p>{theme.name}</p><h3>{theme.subtitle}</h3><small>{theme.summary}</small></div>
                <ArrowRight size={19} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
