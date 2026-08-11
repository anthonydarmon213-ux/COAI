"use client";

// Sélecteur rapide 1-5 (boutons, pas un slider à glisser) — réutilisé par
// le check-in post-séance et le check-in hebdomadaire. Objectif UX : moins
// de friction qu'un champ texte/menu déroulant, utilisable d'une main entre
// deux séries à la salle.
export function ScalePicker({
  value,
  onChange,
  labelMin,
  labelMax,
}: {
  value: number | null;
  onChange: (value: number) => void;
  labelMin: string;
  labelMax: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex h-11 flex-1 items-center justify-center rounded-lg border text-sm font-semibold transition ${
              value === n
                ? "border-laiton-400/50 bg-laiton-400/15 text-laiton-200"
                : "border-graphite-800 text-graphite-400 hover:border-graphite-700 hover:text-white"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-graphite-500">
        <span>{labelMin}</span>
        <span>{labelMax}</span>
      </div>
    </div>
  );
}
