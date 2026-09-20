export type MemberIntroduction = {
  introduction_word: string;
  bio: string;
  cohort_message: string;
};

export type MemberDirectoryRow = MemberIntroduction & {
  cohort: string;
  user_id: string;
  display_name: string;
};

export const introductionFields = {
  introductionWord: { label: "요즘의 나를 표현하는 단어 하나", min: 1, max: 20 },
  bio: { label: "그 단어를 고른 이유", min: 2, max: 200 },
  cohortMessage: { label: "함께할 동료들에게 하고 싶은 말", min: 2, max: 300 }
} as const;

export type IntroductionField = keyof typeof introductionFields;

export function isIntroductionComplete(value: MemberIntroduction) {
  return Boolean(value.introduction_word?.trim() && value.bio.trim() && value.cohort_message.trim());
}
