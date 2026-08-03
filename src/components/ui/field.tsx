import type { ReactNode } from "react";

// Regroupe label + champ + message d'erreur, pour éviter de répéter la
// structure dans chaque formulaire.
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-mono text-xs uppercase tracking-wider text-graphite-400">{label}</span>
      {children}
      {error && <span className="text-sm text-red-400">{error}</span>}
    </label>
  );
}
