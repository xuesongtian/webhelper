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
        "ios-touch inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold tracking-[0] disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0",
        variant === "primary" && "bg-[#0a84ff] text-white shadow-[0_12px_28px_rgba(10,132,255,0.22)] hover:bg-[#0071e3]",
        variant === "secondary" && "border border-white/70 bg-white/70 text-slate-900 shadow-[0_10px_24px_rgba(31,41,55,0.06)] backdrop-blur-xl hover:bg-white",
        variant === "danger" && "bg-[#ff3b30] text-white shadow-[0_12px_28px_rgba(255,59,48,0.18)] hover:bg-[#d92d20]",
        variant === "ghost" && "text-slate-600 hover:bg-white/58 hover:text-slate-950",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
