export const currentMeeting = {
  cohort: "01기",
  title: "나를 읽는 네 번의 밤",
  schedule: "격주 4회",
  capacity: "8명 안팎",
  location: "서울 오프라인",
  application: {
    status: "알림 신청 중",
    description: "구체적인 일정과 장소가 확정되면 가장 먼저 알려드려요.",
    href: "/signup",
    actionLabel: "알림 신청하기"
  },
  sessions: [
    { order: 1, title: "관계를 읽다", question: "나는 사람을 어떻게 이해하고 있나요?" },
    { order: 2, title: "나를 읽다", question: "내가 원하는 삶은 어떤 모습인가요?" },
    { order: 3, title: "변화를 읽다", question: "변하고 싶은 마음은 어디에서 오나요?" },
    { order: 4, title: "마음을 읽다", question: "지금의 감정을 어떻게 돌볼 수 있을까요?" }
  ]
} as const;
