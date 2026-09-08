"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { homeStories } from "@/data/stories";
import { useHorizontalCarousel } from "@/components/useHorizontalCarousel";

export function StoryCarousel() {
  const { activeIndex, canMoveNext, canMovePrevious, handleScroll, moveTo, trackRef } = useHorizontalCarousel(homeStories.length);

  return (
    <div className="story-carousel">
      <div className="story-carousel__controls">
        <p aria-live="polite"><strong>{String(activeIndex + 1).padStart(2, "0")}</strong> / {String(homeStories.length).padStart(2, "0")}</p>
        <div>
          <button type="button" onClick={() => moveTo(activeIndex - 1)} disabled={!canMovePrevious} aria-label="이전 후기 보기"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => moveTo(activeIndex + 1)} disabled={!canMoveNext} aria-label="다음 후기 보기"><ArrowRight size={18} /></button>
        </div>
      </div>

      <ul ref={trackRef} className="story-carousel__track" onScroll={handleScroll} tabIndex={0} aria-label="독서모임 후기">
        {homeStories.map((story, index) => (
          <li key={story.name}>
            <div className="story-carousel__meta"><span>{String(index + 1).padStart(2, "0")}</span><strong>{story.name}</strong></div>
            {story.longform && <div className="story-carousel__heading"><h3>{story.longform.title}</h3><div>{story.longform.topics.map((topic) => <span key={topic}>{topic}</span>)}</div></div>}
            <blockquote>“{story.quote}”</blockquote>
            {story.text && <p>{story.text}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
