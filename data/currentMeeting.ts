import { currentTheme } from "@/data/themes";

const cohort = "1기";

export const currentMeeting = {
  cohort,
  recruiting: true,
  recruitingLabel: "모집중",
  applyHref: "/interview",
  applyLabel: `${cohort} 참여 신청하기`,
  facts: [
    { label: "진행 기간", value: "2026년 10월 ~" },
    { label: "진행 주기", value: "격주 · 총 4회차" },
    { label: "회차별 소요", value: "3시간" },
    { label: "장소", value: "서울 오프라인" },
    { label: "정원", value: "6명 안팎" },
    { label: "회비", value: "인터뷰 후 안내" }
  ],
  sessions: currentTheme.sessions.map((session, index) => ({ order: index + 1, ...session }))
} as const;
