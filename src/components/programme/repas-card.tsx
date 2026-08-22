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

  // Badges dérivés de ce que l'IA a réellement écrit sur le repas — un
  // badge "High Protein" affiché sans que le plat le soit vraiment serait
  // une information fausse, pas une décoration.
  const texteComplet = `${nom ?? ""} ${quantite ?? ""}`.toLowerCase();
  const badges: string[] = [];
  if (/prot[ée]in|poulet|œuf|oeuf|thon|saumon|skyr|fromage blanc|tofu|lentille/.test(texteComplet)) {
    badges.push("Riche en protéines");
  }
  if (/l[ée]gume|[ée]pinard|brocoli|salade|crudit/.test(texteComplet)) badges.push("Fibres & micronutriments");
  if (/avoine|riz|patate|quinoa|p[âa]tes|pain complet/.test(texteComplet)) badges.push("Énergie durable");

  return (
    <div className="coai-meal-card group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-laiton-400/40 hover:shadow-[0_18px_45px_-30px_rgba(201,162,98,0.9)]">
      {photoUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental */}
          <img src={photoUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0e10] via-[#0d0e10]/25 to-transparent" aria-hidden="true" />
          {type && (
            <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
              {type}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2 p-4">
        {type && !photoUrl && (
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-laiton-400">{type}</span>
        )}
        <h4 className="font-display text-base font-semibold text-[#fffdf8]">{nom ?? "Repas"}</h4>
        {quantite && <p className="text-xs leading-5 text-graphite-300">{quantite}</p>}

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {badges.map((b) => (
              <span key={b} className="rounded-full border border-laiton-400/30 bg-laiton-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-laiton-200">
                {b}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
