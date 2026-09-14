import { currentTheme, findTheme, type Theme, type ThemeSlug } from "@/data/themes";

// 기수별로 읽는 주제. 새 기수를 열 때 여기에 한 줄 추가한다.
// 표에 없는 기수는 현재 모집 주제를 그대로 따른다.
export const cohortThemeSlugs: Readonly<Record<number, ThemeSlug>> = {
  1: "relationship"
};

export function themeForCohort(cohortNumber: number | null | undefined): Theme {
  const slug = cohortNumber != null ? cohortThemeSlugs[cohortNumber] : undefined;
  return (slug && findTheme(slug)) || currentTheme;
}
