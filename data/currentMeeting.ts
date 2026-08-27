import { currentTheme } from "@/data/themes";

export const currentMeeting = {
  cohort: "01기",
  title: `${currentTheme.name}, ${currentTheme.subtitle}`,
  schedule: "8주 · 격주 토의 4회",
  capacity: "8명 안팎",
  location: "서울 오프라인",
  application: {
    status: "알림 신청 중",
    description: "구체적인 일정과 장소가 확정되면 가장 먼저 알려드려요.",
    href: "/signup",
    actionLabel: "알림 신청하기"
  },
  sessions: currentTheme.sessions.map((session, index) => ({ order: index + 1, ...session }))
} as const;
