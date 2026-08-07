import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

// Primaire brass / secondaire steel outline (spec design system v2).
const VARIANTS: Record<Variant, string> = {
  primary: "bg-laiton-400 text-graphite-950 shadow-[0_12px_38px_-14px_rgba(201,162,98,0.75)] hover:bg-laiton-300",
  secondary: "border border-white/15 bg-white/[0.03] text-graphite-50 hover:border-laiton-400/40 hover:bg-white/[0.07]",
  ghost: "bg-transparent text-graphite-200 hover:text-laiton-400",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

// Composant de base du design system (palette graphite/laiton + brass/steel).
export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-full px-6 py-3 text-sm font-semibold tracking-wide outline-none transition duration-300 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-acier/40 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
