// Carte visuelle pour un exercice généré (au lieu d'une liste plate
// clé/valeur) : icônes par repère, mise en page dense mais aérée. Pas de
// photo/vidéo hébergée (pas de bibliothèque maison — décision actée), le
// lien "Voir la technique" pointe vers une recherche YouTube ciblée sur le
// nom exact généré par l'IA.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const CHAMPS: { cle: string; icone: string; label: string }[] = [
  { cle: "series", icone: "🔁", label: "Séries" },
  { cle: "repetitions", icone: "🔢", label: "Répétitions" },
  { cle: "repos", icone: "⏱️", label: "Repos" },
  { cle: "charge", icone: "💪", label: "Charge" },
  { cle: "methode", icone: "🎯", label: "Méthode" },
];

export function ExerciceCard({ exercice }: { exercice: unknown }) {
  if (!isPlainObject(exercice)) return null;
  const nom = typeof exercice.nom === "string" ? exercice.nom : undefined;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-graphite-800 bg-graphite-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-graphite-50">{nom ?? "Exercice"}</h4>
        {nom && (
          <a
            href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${nom} technique musculation`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 whitespace-nowrap rounded-full border border-laiton-400/25 bg-laiton-400/10 px-2.5 py-1 text-[11px] font-medium text-laiton-300 transition hover:bg-laiton-400/20"
          >
            ▶ Technique
          </a>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {CHAMPS.map(({ cle, icone, label }) => {
          const valeur = exercice[cle];
          if (valeur === undefined || valeur === null || valeur === "") return null;
          return (
            <div key={cle} className="rounded-lg bg-white/[0.03] px-2.5 py-2">
              <span className="block text-[10px] uppercase tracking-wider text-graphite-500">
                {icone} {label}
              </span>
              <span className="mt-0.5 block text-xs font-medium leading-snug text-graphite-100">
                {String(valeur)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
