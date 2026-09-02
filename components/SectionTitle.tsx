import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: ReactNode;
  context?: string;
  description?: string;
};

export function SectionTitle({ eyebrow, title, context, description }: Props) {
  return (
    <div className="max-w-2xl">
      <p className="section-title__eyebrow text-xs font-medium tracking-[0.2em] text-[var(--accent-dark)]">{eyebrow}</p>
      {context && <p className="section-title__context mt-4 leading-7 text-[var(--muted)]">{context}</p>}
      <h2 className={`${context ? "mt-2" : "mt-4"} text-3xl font-semibold tracking-[-0.03em] md:text-4xl`}>{title}</h2>
      {description && <p className="section-title__description mt-4 leading-7 text-[var(--muted)]">{description}</p>}
    </div>
  );
}
