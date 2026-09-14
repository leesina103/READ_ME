import type { ReactNode } from "react";

const errorTextClassName = "text-[#9c3d22]";

export function inputClassName(invalid = false, { margin = true } = {}) {
  return `${margin ? "mt-2 " : ""}w-full rounded-2xl border bg-[var(--paper)] px-4 py-3 outline-none focus:border-[var(--forest)] ${invalid ? "border-[#9c3d22]" : "border-[var(--line)]"}`;
}

type FormFieldProps = { label: string; error?: string; hint?: string; counter?: string; children: ReactNode };

export function FormField({ label, error, hint, counter, children }: FormFieldProps) {
  const note = error ?? hint;
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {(note || counter) && (
        <span className="mt-2 flex items-start justify-between gap-3 font-normal">
          <span role={error ? "alert" : undefined} className={error ? `text-sm ${errorTextClassName}` : "text-xs text-[var(--muted)]"}>{note}</span>
          {counter && <span className="shrink-0 text-xs text-[var(--muted)]">{counter}</span>}
        </span>
      )}
    </label>
  );
}

type FormMessageProps = { tone: "error" | "success"; children: ReactNode };

export function FormMessage({ tone, children }: FormMessageProps) {
  return <p role="status" className={`text-sm leading-6 ${tone === "error" ? errorTextClassName : "text-[var(--forest)]"}`}>{children}</p>;
}
