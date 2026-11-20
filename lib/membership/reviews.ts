import type { TalkSchedule } from "@/lib/membership/talkDeadlines";

export const reviewEventDetails = {
  session: {
    eyebrow: "SESSION REVIEW",
    title: "이번 세션은 어떠셨나요?",
    description: "함께 나눈 시간에서 좋았던 점과 다음 세션에 보완하면 좋을 점을 들려주세요."
  },
  cohort: {
    eyebrow: "SEASON REVIEW",
    title: "이번 기수를 함께 돌아봐요",
    description: "마지막 실천·기록까지 마친 뒤, 기수 전체를 한 번 돌아보는 후기예요. 기억에 남은 점과 다음 기수 참여에 대한 마음을 들려주세요."
  },
  party: {
    eyebrow: "PARTY REVIEW",
    title: "파티의 여운을 들려주세요",
    description: "함께한 파티에서 좋았던 점과 다음 만남에 바라는 점을 편하게 남겨주세요."
  }
} as const;

export type ReviewEvent = keyof typeof reviewEventDetails;

export const midpointReviewDetails = {
  eyebrow: "MIDPOINT REVIEW",
  title: "지난 4주를 함께 돌아봐요",
  description: "두 번의 토의와 실천·기록을 돌아보며, 좋았던 점과 남은 모임에서 달라졌으면 하는 점을 들려주세요."
};

export function parseReviewEvent(value?: string): ReviewEvent {
  return value === "session" || value === "party" ? value : "cohort";
}

export function reviewFollowUp({ event, session, sessionCount, schedule, ended, now = Date.now() }: {
  event: ReviewEvent;
  session?: number;
  sessionCount: number;
  schedule: TalkSchedule[];
  ended: boolean;
  now?: number;
}) {
  if (event !== "session" || !session || !Number.isInteger(session) || session < 1 || session > sessionCount) {
    return { nextMeeting: null, record: null, recordWeek: null };
  }

  const recordWeek = session * 2;
  const record = schedule.find(item => item.week_number === recordWeek) ?? null;
  // 홀수 주의 실제 모임만 골라 같은 모임의 실천 주차와 지난 일정을 제외한다.
  const nextMeeting = ended ? null : schedule
    .filter(item => item.week_number % 2 === 1
      && item.week_number > recordWeek
      && item.week_number <= sessionCount * 2
      && item.meeting_at && Date.parse(item.meeting_at) > now)
    .sort((a, b) => Date.parse(a.meeting_at!) - Date.parse(b.meeting_at!))[0] ?? null;

  return { nextMeeting, record, recordWeek };
}
