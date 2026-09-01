import type { Recette } from "@/lib/nutrition/recettes";
import { REGIME_LABEL, TYPE_REPAS_LABEL } from "@/lib/nutrition/recettes";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";

// Carte recette (19/08/2026, demande Anthony — "de belles images", direction
// Whoop/MyFitnessCoach) : photo Pexels en fond avec dégradé sombre, macros en
// badges, ingrédients/étapes repliés dans un <details> natif (zéro JS
// nécessaire pour l'interaction d'ouverture). `photoUrl` peut être null si
// PEXELS_API_KEY est absente ou l'appel a échoué — la carte reste alors
// utilisable, juste sans photo, jamais une image cassée.
export function RecetteCard({ recette, photoUrl }: { recette: Recette; photoUrl: string | null }) {
  return (
    <article className="animate-reveal group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#111518] shadow-[0_24px_70px_-46px_rgba(0,0,0,.7)] transition hover:border-white/20">
      <div className="relative h-40 w-full overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(196,154,82,.25),transparent_60%),#171b1d]">
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
          <img
            src={photoUrl}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e10] via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {TYPE_REPAS_LABEL[recette.typeRepas]}
        </span>
        <span className="absolute bottom-3 left-3 rounded-full border border-white/20 bg-black/40 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          {recette.tempsMinutes} min
        </span>
        {photoUrl && <CoaiImageMark />}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base font-semibold text-[#fffdf8]">{recette.nom}</h3>
          <p className="mt-1 text-xs leading-5 text-graphite-400">{recette.description}</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {recette.regimes.map((r) => (
            <span key={r} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              {REGIME_LABEL[r]}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-center">
          <div>
            <strong className="block text-sm text-[#fffdf8]">{recette.macros.calories}</strong>
            <span className="text-[9px] uppercase tracking-wide text-graphite-500">kcal</span>
          </div>
          <div>
            <strong className="block text-sm text-[#fffdf8]">{recette.macros.proteines}g</strong>
            <span className="text-[9px] uppercase tracking-wide text-graphite-500">Prot.</span>
          </div>
          <div>
            <strong className="block text-sm text-[#fffdf8]">{recette.macros.glucides}g</strong>
            <span className="text-[9px] uppercase tracking-wide text-graphite-500">Gluc.</span>
          </div>
          <div>
            <strong className="block text-sm text-[#fffdf8]">{recette.macros.lipides}g</strong>
            <span className="text-[9px] uppercase tracking-wide text-graphite-500">Lip.</span>
          </div>
        </div>

        {(recette.portion || recette.conservation) && (
          <div className="flex flex-wrap gap-1.5 text-[10px] text-graphite-400">
            {recette.portion && <span className="rounded-full border border-white/10 px-2 py-1">Portion · {recette.portion}</span>}
            {recette.conservation && <span className="rounded-full border border-white/10 px-2 py-1">Batch cooking compatible</span>}
          </div>
        )}

        <details className="group/details mt-1 text-xs">
          <summary className="cursor-pointer list-none font-semibold text-laiton-300 transition hover:text-laiton-200">
            Voir la recette →
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">Ingrédients</p>
              <ul className="mt-1.5 flex flex-col gap-1 text-graphite-300">
                {recette.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-laiton-400" aria-hidden="true" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-graphite-500">Préparation</p>
              <ol className="mt-1.5 flex flex-col gap-1.5 text-graphite-300">
                {recette.etapes.map((etape, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="font-mono text-[10px] font-bold text-laiton-400">{i + 1}.</span>
                    {etape}
                  </li>
                ))}
              </ol>
            </div>
            {recette.variantes && (
              <div className="rounded-xl border border-laiton-400/20 bg-laiton-400/[0.05] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-300">Adapter à mon programme</p>
                <ul className="mt-2 flex flex-col gap-2 text-graphite-300">
                  {Object.entries(recette.variantes).map(([objectif, conseil]) => (
                    <li key={objectif}>
                      <strong className="text-[10px] text-laiton-200">
                        {objectif === "RESET_TRX" ? "RESET / TRX" : objectif} —
                      </strong>{" "}
                      {conseil}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(recette.allergenes || recette.conservation) && (
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3 text-[10px] leading-4 text-graphite-400">
                {recette.allergenes && recette.allergenes.length > 0 && (
                  <p><strong className="text-graphite-200">Allergènes :</strong> {recette.allergenes.join(", ")}.</p>
                )}
                {recette.conservation && (
                  <p className={recette.allergenes && recette.allergenes.length > 0 ? "mt-1" : undefined}>
                    <strong className="text-graphite-200">Conservation :</strong> {recette.conservation}
                  </p>
                )}
              </div>
            )}
          </div>
        </details>
      </div>
    </article>
  );
}
