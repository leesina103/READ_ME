import { themeForCohort } from "@/data/cohortThemes";
import type { Theme } from "@/data/themes";

export type SeasonWeek = {
  week: number;
  type: "input" | "output";
  sessionOrder: number;
  sessionTitle: string;
  book: string;
  author: string;
  roomTitle: string;
  prompt: string;
};

// 주제의 네 세션을 토의(홀수 주) / 실천 & OUTPUT(짝수 주) 여덟 주로 펼친다.
export function buildSeasonWeeks(theme: Theme): readonly SeasonWeek[] {
  return theme.sessions.flatMap((session, index) => {
    const sessionOrder = index + 1;
    const shared = {
      sessionOrder,
      sessionTitle: session.title,
      book: session.book,
      author: session.author
    };
    return [
      {
        ...shared,
        week: index * 2 + 1,
        type: "input" as const,
        roomTitle: `${session.title} 토의`,
        prompt: session.question
      },
      {
        ...shared,
        week: index * 2 + 2,
        type: "output" as const,
        roomTitle: `${session.title} 실천 & OUTPUT 세션`,
        prompt: "지난 모임에서 나눈 이야기 중, 내 일상에서 더 생각해보고 싶은 질문이나 직접 해보고 싶은 행동은 무엇인가요?\n자유롭게 이야기해 주세요."
      }
    ];
  });
}

export function seasonWeeksForCohort(cohortNumber: number) {
  return buildSeasonWeeks(themeForCohort(cohortNumber)).map((week) => {
    if (cohortNumber === 1 && week.week === 1) {
      return {
        ...week,
        prompt: "누군가에게 존중받는다고 느꼈던 순간은 언제였나요? 그 사람의 어떤 말이나 행동이 기억에 남나요?"
      };
    }
    return week;
  });
}

export function findSeasonWeek(cohortNumber: number, week: number) {
  return seasonWeeksForCohort(cohortNumber).find((item) => item.week === week) ?? null;
}

export function cohortNumberFromName(name: string) {
  const match = /^(\d+)기$/.exec(name.trim());
  return match ? Number(match[1]) : null;
}

export function cohortNameFromNumber(cohortNumber: number) {
  return `${cohortNumber}기`;
}
