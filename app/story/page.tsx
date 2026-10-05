import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StoryFilter } from "@/components/StoryFilter";
import { cohortThemeSlugs } from "@/data/cohortThemes";
import { readingGroupStories, storyClosing, storySourceNote } from "@/data/stories";

export const metadata: Metadata = {
  title: "독서모임 이야기",
  description: "독서모임을 경험한 사람들이 말하는 함께 읽고 대화하는 시간의 가치를 기록합니다.",
  alternates: { canonical: "/story" }
};

export default async function StoryPage({ searchParams }: { searchParams: Promise<{ cohort?: string | string[] }> }) {
  const { cohort } = await searchParams;
  const cohortNumbers = [...new Set([
    ...Object.keys(cohortThemeSlugs).map(Number),
    ...readingGroupStories.flatMap((story) => story.cohort ? [story.cohort] : [])
  ])].sort((a, b) => b - a);
  const selected = typeof cohort === "string" && (cohort === "general" || cohortNumbers.some((number) => String(number) === cohort)) ? cohort : "all";
  const stories = readingGroupStories.filter((story) => selected === "all"
    || (selected === "general" ? !story.cohort : story.cohort === Number(selected)));
  const selectionLabel = selected === "all" ? "전체 이야기" : selected === "general" ? "독서모임 이야기" : `${selected}기 후기`;

  return (
    <main className="stories-page">
      <section className="stories-hero section-shell">
        <Link href="/" className="text-link"><ArrowLeft size={15} /> 홈으로 돌아가기</Link>
        <p className="eyebrow">STORY ARCHIVE</p>
        <h1>함께 읽으며<br />만난 이야기</h1>
        <p>{selected === "general" ? storySourceNote : "독서모임을 경험한 사람들의 이야기와 READ ME 기수별 후기를 만나보세요."}</p>
      </section>

      <section className="stories-list-section">
        <div className="section-shell stories-filter">
          <div className="stories-filter-heading">
            <h2>{selectionLabel} <span>{stories.length}편</span></h2>
            <StoryFilter selected={selected} cohorts={cohortNumbers} />
          </div>
          {selected === "all" && <p className="stories-filter-note">{storySourceNote}</p>}
          {stories.length === 0 && <p className="stories-empty">아직 공개된 {selected}기 후기가 없어요. 함께한 이야기가 모이면 이곳에 소개할게요.</p>}
        </div>
        <div className="section-shell stories-list">
          {stories.map((story, index) => {
            const longform = story.longform;

            return (
              <article
                key={story.name}
                className={longform ? "stories-list__item--longform" : story.text ? undefined : "stories-list__item--short"}
              >
                <div className="stories-list__meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{story.name}</strong>
                  <small>{story.cohort ? `READ ME ${story.cohort}기 · ${story.source}` : story.source}</small>
                </div>
                {longform ? (
                  <>
                    <div className="stories-longform__heading">
                      <h2>{longform.title}</h2>
                      <div>{longform.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                    </div>
                    <blockquote className="stories-longform__quote">“{story.quote}”</blockquote>
                    <div className="stories-longform__intro">
                      {longform.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    <details className="stories-longform__details">
                      <summary><span>전체 이야기 읽기</span><i aria-hidden="true">+</i></summary>
                      <div className="stories-longform__details-body">
                        <div className="stories-longform__points">
                          {longform.points.map((point) => (
                            <section key={point.number}>
                              <span>{point.number})</span>
                              <div>
                                <h3 className="stories-longform__point-title">{point.title}</h3>
                                {point.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                              </div>
                            </section>
                          ))}
                        </div>
                      </div>
                    </details>
                  </>
                ) : (
                  <>
                    <blockquote>“{story.quote}”</blockquote>
                    {story.text && <p>{story.text}</p>}
                  </>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="stories-closing">
        <div className="section-shell">
          <p>{storyClosing}</p>
          <Link href="/" className="button button--light">홈으로 돌아가기</Link>
        </div>
      </section>
    </main>
  );
}
