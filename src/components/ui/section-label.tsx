// Petit repère typographique façon étiquette de labo (ex: "PILIER 01 — ENTRAÎNEMENT").
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-xs uppercase tracking-widest text-laiton-500">{children}</span>
  );
}
