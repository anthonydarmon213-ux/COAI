import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "default" | "compact";

// Primaire brass / secondaire steel outline (spec design system v2).
const VARIANTS: Record<Variant, string> = {
  primary: "border border-laiton-300/40 bg-[linear-gradient(115deg,#F0DCA0,#D4AF37)] text-graphite-950 shadow-[0_14px_42px_-16px_rgba(212,175,55,0.8)] hover:brightness-110",
  secondary: "border border-cyan-300/25 bg-cyan-300/[0.055] text-graphite-50 shadow-[inset_0_1px_0_rgba(255,255,255,.06)] hover:border-cyan-300/55 hover:bg-cyan-300/[0.1]",
  ghost: "bg-transparent text-graphite-200 hover:text-cyan-300",
};

// "compact" : pour les CTA dans des cartes étroites (ex: teaser "Nos
// formules" du résultat diagnostic) où le padding/texte par défaut déborde
// du bouton — padding explicitement plus petit plutôt qu'une className
// externe qui tenterait de surcharger px-6/py-3/text-sm par une classe
// Tailwind de même spécificité (ordre de sortie non garanti).
const SIZES: Record<Size, string> = {
  default: "rounded-full px-6 py-3 text-sm",
  compact: "rounded-full px-3 py-2 text-xs",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

// Composant de base du design system (palette graphite/laiton + brass/steel).
export function Button({ className = "", variant = "primary", size = "default", ...props }: ButtonProps) {
  return (
    <button
      className={`font-semibold tracking-wide outline-none transition duration-300 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-acier/40 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
