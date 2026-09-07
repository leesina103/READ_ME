"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useHorizontalCarousel } from "@/components/useHorizontalCarousel";

const afterSeasonItems = [
  {
    timing: "언제든 · 나의 서재",
    title: "기록 보관",
    description: <p>온라인에서 나눈 질문과 서로의 답변을 언제든 다시 꺼내볼 수 있도록 남깁니다.</p>,
    image: "/theme-remi-work.png",
    alt: "책상에서 기록을 남기는 리미"
  },
  {
    timing: "기수가 끝난 뒤 · 오프라인",
    title: "READ ME 파티",
    description: <p>함께 읽은 사람들이 한자리에 모여, 못다 한 이야기를 얼굴 보며 나눕니다.<br />같은 기수여도 그룹이 달라 만나지 못했던 사람들과, 읽었던 책부터 책 너머의 다양한 이야기까지 대화를 이어갑니다.</p>,
    image: "/theme-remi-relationship.png",
    alt: "컵을 들고 마주 앉아 이야기 나누는 리미들"
  },
  {
    timing: "한 기수 이후 · 멤버십",
    title: "READ ME 멤버십",
    description: <p>한 기수를 마친 뒤에도 전 기수의 멤버들과 다양한 활동으로 계속 만날 수 있도록 멤버십으로 연결합니다.</p>,
    image: "/theme-remi-emotion.png",
    alt: "다양한 감정을 마주하며 자신을 살피는 리미"
  },
  {
    timing: "전 기수와 함께 · 온라인",
    title: "멤버십 커뮤니티",
    description: <><p>함께한 기수가 달라도, 다음 질문과 일상을 나누며 서로의 생각과 변화를 이어갑니다.</p><p>인생책을 소개하거나 직접 쓴 글을 공유하는 등, 각자의 읽기와 쓰기를 편하게 나눌 수 있는 커뮤니티를 운영합니다.</p></>,
    image: "/theme-remi-change.png",
    alt: "징검다리를 건너며 새싹에 물을 주는 리미"
  },
  {
    timing: "원하는 책으로 · 멤버십 오프라인",
    title: "멤버십 북토의",
    description: <p>정해진 커리큘럼을 벗어나, 멤버들이 직접 고른 책으로 자유롭게 토의합니다.</p>,
    image: "/theme-remi-self.png",
    alt: "책상에 앉아 원하는 책을 읽고 기록하는 리미"
  },
  {
    timing: "멤버가 만드는 · 온·오프라인",
    title: "자유로운 소모임",
    description: <p>전시, 영화, 산책부터 취향과 관심사를 나누는 모임까지, 멤버들이 자유롭게 제안하고 함께합니다.</p>,
    image: "/theme-remi-life.png",
    alt: "나무 아래 돗자리에서 쉬는 리미"
  }
];

export function AfterSeasonCarousel() {
  const { activeIndex, canMoveNext, canMovePrevious, handleScroll, moveTo, trackRef } = useHorizontalCarousel(afterSeasonItems.length);

  return (
    <div className="after-season">
      <div className="after-season__controls">
        <p aria-live="polite"><strong>{String(activeIndex + 1).padStart(2, "0")}</strong> / {String(afterSeasonItems.length).padStart(2, "0")}</p>
        <div>
          <button type="button" onClick={() => moveTo(activeIndex - 1)} disabled={!canMovePrevious} aria-label="이전 활동 보기"><ArrowLeft size={18} /></button>
          <button type="button" onClick={() => moveTo(activeIndex + 1)} disabled={!canMoveNext} aria-label="다음 활동 보기"><ArrowRight size={18} /></button>
        </div>
      </div>

      <ul ref={trackRef} className="after-season__track" onScroll={handleScroll} tabIndex={0} aria-label="한 기수 이후 이어지는 활동">
        {afterSeasonItems.map((item, index) => (
          <li key={item.title}>
            <figure>
              <Image src={item.image} alt={item.alt} width={960} height={600} sizes="(max-width: 820px) 82vw, 560px" />
            </figure>
            <div className="after-season__copy">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <small>{item.timing}</small>
              <h3>{item.title}</h3>
              <div className="after-season__description">{item.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
