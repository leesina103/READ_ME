export function CohortLabel({ children, light = false }: { children: string; light?: boolean }) {
  return <strong className={`cohort-label${light ? " cohort-label--light" : ""}`}>{children}</strong>;
}
