"use client";

import { useEffect, useRef, useState } from "react";

export function useHorizontalCarousel(itemCount: number) {
  const trackRef = useRef<HTMLUListElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const moveTo = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children.item(index) as HTMLElement | null;

    if (!track || !slide) return;

    setActiveIndex(index);
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  const handleScroll = () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      const track = trackRef.current;
      if (!track) return;

      const slides = Array.from(track.children) as HTMLElement[];
      const closestIndex = slides.reduce((closest, slide, index) => (
        Math.abs(slide.offsetLeft - track.scrollLeft) < Math.abs(slides[closest].offsetLeft - track.scrollLeft)
          ? index
          : closest
      ), 0);

      setActiveIndex(closestIndex);
    });
  };

  useEffect(() => () => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  return {
    activeIndex,
    canMoveNext: activeIndex < itemCount - 1,
    canMovePrevious: activeIndex > 0,
    handleScroll,
    moveTo,
    trackRef
  };
}
