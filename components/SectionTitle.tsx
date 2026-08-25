type Props = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionTitle({ eyebrow, title, description }: Props) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-medium tracking-[0.2em] text-[var(--accent-dark)]">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">{title}</h2>
      <p className="section-title__description mt-4 leading-7 text-[var(--muted)]">{description}</p>
    </div>
  );
}
