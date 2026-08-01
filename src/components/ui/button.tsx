import type { ButtonHTMLAttributes } from "react";

// Composant de base du design system Lab Coach (palette graphite/laiton).
export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`rounded-md bg-laiton-500 px-4 py-2 font-medium text-graphite-950 transition hover:bg-laiton-400 ${className}`}
      {...props}
    />
  );
}
