import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type FaqItem = {
  question: string;
  answer: ReactNode;
  href?: string;
  linkLabel?: string;
};

export function FaqList({ items }: { items: readonly FaqItem[] }) {
  return (
    <div className="faq-list">
      {items.map((item, index) => (
        <details key={item.question}>
          <summary><span>{String(index + 1).padStart(2, "0")}</span>{item.question}<i>+</i></summary>
          <p>
            {item.answer}
            {item.href && item.linkLabel && <><br /><Link href={item.href} className="faq-answer-link">{item.linkLabel} <ArrowRight size={14} /></Link></>}
          </p>
        </details>
      ))}
    </div>
  );
}
