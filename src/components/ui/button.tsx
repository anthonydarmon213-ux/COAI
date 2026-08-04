import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

// Primaire brass / secondaire steel outline (spec design system v2).
const VARIANTS: Record<Variant, string> = {
  primary: "bg-brass text-ink hover:bg-brass/90",
  secondary: "border border-steel bg-transparent text-steel hover:bg-steel/10",
  ghost: "bg-transparent text-graphite-200 hover:text-laiton-400",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

// Composant de base du design system Holos (palette graphite/laiton + brass/steel).
export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
