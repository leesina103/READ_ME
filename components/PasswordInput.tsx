"use client";

import { useState, type ComponentProps } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClassName } from "@/components/FormField";

type PasswordInputProps = Omit<ComponentProps<"input">, "type" | "className"> & { invalid?: boolean };

export function PasswordInput({ invalid = false, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative mt-2 block">
      <input
        {...props}
        type={visible ? "text" : "password"}
        aria-invalid={invalid || undefined}
        className={`${inputClassName(invalid, { margin: false })} pr-12 [&::-ms-reveal]:hidden`}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "비밀번호 숨기기" : "비밀번호 보기"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center rounded-r-2xl px-4 text-[var(--muted)] hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-[var(--forest)]"
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </span>
  );
}
