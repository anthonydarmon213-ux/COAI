// Carte visuelle pour un repas généré (19/08/2026, demande Anthony —
// "améliore la mise en page" de la nutrition) : même langage que
// ExerciceCard (readout dense mais aéré) plutôt que le dump JsonView à plat
// utilisé jusqu'ici pour chaque repas.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function RepasCard({
  repas,
  photosParExercice,
}: {
  repas: unknown;
  // Photos Pexels (19/08/2026) : résolues côté serveur (pilier-page.tsx) à
  // partir du "photoQuery" que l'IA génère pour CHAQUE repas — jamais
  // d'appel réseau depuis ce composant, jamais de photo inventée (absente
  // du map ou clé null → aucune image affichée).
  photosParExercice?: Record<string, string | null>;
}) {
  if (!isPlainObject(repas)) return null;
  const type = typeof repas.type === "string" ? repas.type : undefined;
  const nom = typeof repas.nom === "string" ? repas.nom : undefined;
  const quantite = typeof repas.quantite === "string" ? repas.quantite : undefined;
  const photoQuery = typeof repas.photoQuery === "string" ? repas.photoQuery : undefined;
  const photoUrl = photoQuery ? photosParExercice?.[photoQuery] : null;

  return (
    <div className="coai-meal-card group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 transition duration-300 hover:border-laiton-400/25 hover:bg-white/[0.035]">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
        <img src={photoUrl} alt="" className="h-32 w-full rounded-lg object-cover" loading="lazy" />
      )}
      <div className="flex flex-col gap-1">
        {type && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-laiton-400">
            {type}
          </span>
        )}
        <h4 className="text-sm font-semibold text-graphite-50">{nom ?? "Repas"}</h4>
      </div>
      {quantite && <p className="text-xs leading-5 text-graphite-300">{quantite}</p>}
    </div>
  );
}
