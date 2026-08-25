type Props = {
  title: string;
  description: string;
};

export function PageContext({ title, description }: Props) {
  return (
    <div className="page-context" aria-label="현재 페이지">
      <div className="section-shell page-context__inner">
        <span>PAGE</span>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>
    </div>
  );
}
