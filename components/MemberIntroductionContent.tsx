import type { MemberIntroduction } from "@/lib/membership/introduction";

type Props = {
  introduction: MemberIntroduction;
  variant?: "default" | "reading";
};

export function MemberIntroductionContent({ introduction, variant = "default" }: Props) {
  const { introduction_word: word, bio, cohort_message: message } = introduction;
  const reading = variant === "reading";
  const labelClassName = reading ? "sr-only" : "introduction-content__label";

  return (
    <div className={`introduction-content${reading ? " introduction-content--reading" : ""}`}>
      {word && <div><p className={labelClassName}>요즘의 나를 표현하는 단어</p><p className="introduction-content__word">{word}</p></div>}
      {bio && <div><p className={labelClassName}>{word ? "그 단어를 고른 이유" : "자기소개"}</p><p className="introduction-content__text">{bio}</p></div>}
      {message && <div className="introduction-content__message"><p className="introduction-content__label">{reading ? "같은 기수 동료들에게" : "함께할 동료들에게"}</p><p className="introduction-content__text">{message}</p></div>}
      {!word && !bio && !message && <p className="text-sm leading-7 text-[var(--muted)]">아직 소개를 준비하고 있어요.</p>}
    </div>
  );
}
