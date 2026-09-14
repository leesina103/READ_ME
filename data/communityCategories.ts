import { BookHeart, NotebookPen, type LucideIcon } from "lucide-react";
import type { CommunityCategory } from "@/app/membership/community-actions";

export type CommunityCategoryInfo = {
  label: string;
  eyebrow: string;
  description: string;
  empty: string;
  icon: LucideIcon;
};

// 커뮤니티 분류의 이름과 안내 문구. 상단 메뉴, 탭, 글쓰기 폼, 글 상세가 모두 여기를 따른다.
export const communityCategories: Readonly<Record<CommunityCategory, CommunityCategoryInfo>> = {
  books: {
    label: "인생책",
    eyebrow: "LIFE-CHANGING BOOK",
    description: "내 삶에 오래 남은 책과 그 이유를 멤버들에게 소개하는 공간입니다.",
    empty: "아직 소개된 인생책이 없어요.",
    icon: BookHeart
  },
  writing: {
    label: "글 나눔",
    eyebrow: "SHARED WRITING",
    description: "직접 쓴 글이나 함께 읽고 싶은 외부 글을 편하게 나누는 공간입니다.",
    empty: "아직 나눈 글이 없어요.",
    icon: NotebookPen
  }
};

export const communityCategoryKeys = Object.keys(communityCategories) as CommunityCategory[];

export function parseCommunityCategory(value: string | undefined): CommunityCategory {
  return value === "writing" ? "writing" : "books";
}
