import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-laiton-500 text-graphite-950 hover:bg-laiton-400",
  secondary:
    "border border-graphite-700 bg-transparent text-graphite-50 hover:border-laiton-500 hover:text-laiton-400",
  ghost: "bg-transparent text-graphite-200 hover:text-laiton-400",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

// Composant de base du design system Holos (palette graphite/laiton).
export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
