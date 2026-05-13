import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ icon, variant = "primary", className, children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={clsx(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-55",
        variant === "primary" && "bg-brand text-white hover:bg-blue-700",
        variant === "secondary" && "border border-line bg-white text-ink hover:bg-slate-50",
        variant === "danger" && "bg-danger text-white hover:bg-red-700",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
