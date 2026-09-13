export const reviewEventDetails = {
  session: {
    eyebrow: "SESSION REVIEW",
    title: "이번 세션은 어떠셨나요?",
    description: "함께 나눈 시간에서 좋았던 점과 다음 세션에 보완하면 좋을 점을 들려주세요."
  },
  cohort: {
    eyebrow: "SEASON REVIEW",
    title: "이번 기수를 함께 돌아봐요",
    description: "한 기수를 지나며 기억에 남은 점과 앞으로 더 좋아지면 좋을 점을 들려주세요."
  },
  party: {
    eyebrow: "PARTY REVIEW",
    title: "파티의 여운을 들려주세요",
    description: "함께한 파티에서 좋았던 점과 다음 만남에 바라는 점을 편하게 남겨주세요."
  }
} as const;

export type ReviewEvent = keyof typeof reviewEventDetails;

export function parseReviewEvent(value?: string): ReviewEvent {
  return value === "session" || value === "party" ? value : "cohort";
}
