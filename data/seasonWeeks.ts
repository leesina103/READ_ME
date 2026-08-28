import { currentTheme } from "@/data/themes";

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

export const seasonWeeks: readonly SeasonWeek[] = currentTheme.sessions.flatMap((session, index) => {
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
      roomTitle: `${session.title} 휴식 & OUTPUT 세션`,
      prompt: `《${session.book}》에서 만난 생각 중 삶에 적용해보고 싶은 행동 하나를 정해 실천해 보세요. 무엇을 해봤고, 무엇이 달라졌는지 기록하고 공유해 주세요.`
    }
  ];
});

export function findSeasonWeek(week: number) {
  return seasonWeeks.find((item) => item.week === week) ?? null;
}

export function cohortNumberFromName(name: string) {
  const match = /^(\d+)기$/.exec(name.trim());
  return match ? Number(match[1]) : null;
}
