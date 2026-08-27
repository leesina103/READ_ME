import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import { findTheme, themes } from "@/data/themes";
import { notFound } from "next/navigation";

type ThemePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return themes.map((theme) => ({ slug: theme.slug }));
}

export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const theme = findTheme((await params).slug);
  if (!theme) return {};
  return { title: `${theme.name} — 주제별 소개`, description: theme.summary };
}

export default async function ThemePage({ params }: ThemePageProps) {
  const theme = findTheme((await params).slug);
  if (!theme) notFound();
  const themeIndex = themes.findIndex((item) => item.slug === theme.slug);

  return (
    <main className="theme-detail-page">
      <section className="theme-detail-hero">
        <div className="section-shell">
          <Link href="/themes" className="theme-detail-back"><ArrowLeft size={15} /> 여섯 주제 보기</Link>
          <div className="theme-detail-hero__grid">
            <div className="theme-detail-hero__title">
              <p className="eyebrow">THEME {String(themeIndex + 1).padStart(2, "0")}</p>
              <h1>{theme.name}<br /><span>{theme.subtitle}</span></h1>
            </div>
            <div className="theme-detail-cover">
              <Image
                src={`/theme-remi-${theme.slug}.png`}
                alt={`${theme.name} 주제를 표현한 READ ME 캐릭터 리미`}
                fill
                priority
                sizes="(max-width: 820px) calc(100vw - 36px), 1160px"
              />
            </div>
            <div className="theme-detail-hero__copy">
              <blockquote>{theme.coreQuestion}</blockquote>
              <p>{theme.introduction}</p>
              <div className="theme-keywords">{theme.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section--paper theme-session-section">
        <div className="section-shell">
          <div className="theme-session-heading">
            <p className="eyebrow">SESSION 01—04</p>
            <h2>네 번의 질문,<br />네 권의 책</h2>
          </div>
          <ol className="theme-session-list">
            {theme.sessions.map((session, index) => (
              <li key={session.question}>
                <div className="theme-session-number">
                  <span>SESSION</span>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                </div>
                <article>
                  <p className="theme-session-topic">{session.title}</p>
                  <h3>{session.question}</h3>
                  <div className="theme-session-book">
                    <BookOpen size={20} aria-hidden="true" />
                    <div><span>함께 읽는 책</span><strong>《{session.book}》</strong><small>{session.author}</small></div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section theme-detail-footer">
        <div className="section-shell">
          <p>다른 삶의 질문도 둘러보세요.</p>
          <Link href="/themes" className="button button--primary">주제별 소개로 돌아가기 <ArrowRight size={15} /></Link>
        </div>
      </section>
    </main>
  );
}
