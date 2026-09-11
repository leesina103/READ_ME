import { currentTheme } from "@/data/themes";

const cohort = "1기";
const recruiting: boolean = true;

const schedule = {
  duration: "8주",
  start: "2026년 10월부터",
  cadence: "격주",
  offlineSessions: "4회",
  onlineSessions: "4회",
  sessionDuration: "3시간",
  location: "서울 오프라인",
  groupSize: "4~6명",
  fee: "인터뷰 후 안내"
} as const;

const meetingTitle = recruiting ? `${cohort} 모집 안내` : `${cohort} 모임 안내`;

const interview = {
  duration: "20~30분",
  resultTiming: "1~2일"
} as const;

export const currentMeeting = {
  cohort,
  schedule,
  interview,
  recruiting,
  recruitingLabel: "모집중",
  meetingTitle,
  meetingLabel: `${meetingTitle} 보기`,
  applyHref: "/interview/apply",
  applyLabel: "인터뷰 예약하기",
  facts: [
    { label: "진행 기간", value: `${schedule.duration} · ${schedule.start}` },
    { label: "진행 주기", value: schedule.cadence },
    { label: "오프라인 토의", value: schedule.offlineSessions },
    { label: "온라인 실천·기록", value: schedule.onlineSessions },
    { label: "회차별 소요", value: schedule.sessionDuration },
    { label: "장소", value: schedule.location },
    { label: "정원", value: schedule.groupSize },
    { label: "회비", value: schedule.fee }
  ],
  sessions: currentTheme.sessions.map((session, index) => ({ order: index + 1, ...session }))
} as const;
