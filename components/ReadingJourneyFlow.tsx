import { ArrowRight } from "lucide-react";

const readingJourney = [
  { label: "책", text: "함께 읽으며 질문을 발견합니다." },
  { label: "나", text: "생각과 가치관을 천천히 들여다봅니다." },
  { label: "사람", text: "대화하며 다른 삶과 관점을 판단 없이 만납니다." },
  { label: "삶", text: "새롭게 얻은 각자의 답을 일상으로 가져갑니다." }
] as const;

type Props = {
  className: string;
};

export function ReadingJourneyFlow({ className }: Props) {
  return (
    <div className={className} aria-label="READ ME의 독서 흐름">
      {readingJourney.map((step, index) => (
        <article key={step.label}>
          <span>0{index + 1}</span>
          <strong>{step.label}</strong>
          <p>{step.text}</p>
          {index < readingJourney.length - 1 && <ArrowRight size={18} aria-hidden="true" />}
        </article>
      ))}
    </div>
  );
}
