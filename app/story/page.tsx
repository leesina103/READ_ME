import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { readingGroupStories, storyClosing, storySourceNote } from "@/data/stories";

export const metadata: Metadata = {
  title: "독서모임 이야기",
  description: "독서모임을 경험한 사람들이 말하는 함께 읽고 대화하는 시간의 가치를 기록합니다."
};

export default function StoryPage() {
  return (
    <main className="stories-page">
      <section className="stories-hero section-shell">
        <Link href="/" className="text-link"><ArrowLeft size={15} /> Main으로 돌아가기</Link>
        <p className="eyebrow">STORY ARCHIVE</p>
        <h1>함께 읽으며<br />만난 이야기</h1>
        <p>{storySourceNote}</p>
      </section>

      <section className="stories-list-section">
        <div className="section-shell stories-list">
          {readingGroupStories.map((story, index) => {
            const longform = story.longform;

            return (
              <article
                key={story.name}
                className={longform ? "stories-list__item--longform" : story.text ? undefined : "stories-list__item--short"}
              >
                <div className="stories-list__meta">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{story.name}</strong>
                </div>
                {longform ? (
                  <>
                    <div className="stories-longform__heading">
                      <h2>{longform.title}</h2>
                      <div>{longform.topics.map((topic) => <span key={topic}>{topic}</span>)}</div>
                    </div>
                    <div className="stories-longform__intro">
                      {longform.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    </div>
                    <div className="stories-longform__points">
                      {longform.points.map((point) => (
                        <section key={point.number}>
                          <span>{point.number.padStart(2, "0")}</span>
                          <div>{point.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                        </section>
                      ))}
                    </div>
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
          <Link href="/" className="button button--light">Main으로 돌아가기</Link>
        </div>
      </section>
    </main>
  );
}
