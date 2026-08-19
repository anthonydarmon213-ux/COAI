import { JsonView } from "@/components/programme/json-view";
import { SemainePlan } from "@/components/programme/semaine-plan";
import { ContreIndications } from "@/components/programme/contre-indications";
import { RepasCard } from "@/components/programme/repas-card";

// Vue dédiée au pilier NUTRITION : mêmes codes visuels que l'entraînement
// (vue d'ensemble + un jour par carte repliable) pour une lecture cohérente
// et plus digeste que le JSON à plat.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ConseilHabitude = {
  sujet?: string;
  constatActuel?: string;
  conseil?: string;
};

export function NutritionView({
  data,
  showContreIndications = false,
  photosParExercice,
}: {
  data: unknown;
  showContreIndications?: boolean;
  // Photos Pexels (19/08/2026) — clé = photoQuery/photoQueryJour tel que
  // généré par l'IA, résolues côté serveur (pilier-page.tsx). Nom du prop
  // partagé avec EntrainementView : même forme de map, réutilisée telle
  // quelle par RepasCard (photoQuery) et pour la photo d'ambiance du jour
  // (photoQueryJour) ci-dessous.
  photosParExercice?: Record<string, string | null>;
}) {
  if (!isPlainObject(data)) return <JsonView data={data} typeMedia="repas" />;

  const { titre, vueEnsemble, contreIndications, objectifsJournaliers, conseilsHabitudes, jours, ...reste } = data as {
    titre?: string;
    vueEnsemble?: string;
    contreIndications?: string[];
    objectifsJournaliers?: Record<string, unknown>;
    conseilsHabitudes?: ConseilHabitude[];
    jours?: Record<string, unknown>[];
    [key: string]: unknown;
  };

  const badges = isPlainObject(objectifsJournaliers)
    ? Object.entries(objectifsJournaliers)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => ({
          icone: k === "calories" ? "🔥" : k === "proteines" ? "🍗" : k === "glucides" ? "🍚" : "🥑",
          texte: String(v),
        }))
    : [];

  return (
    <div className="coai-nutrition-view flex flex-col gap-5">
      {showContreIndications && <ContreIndications items={contreIndications} />}
      <SemainePlan
        titre={titre}
        badges={badges}
        vueEnsemble={vueEnsemble}
        vueEnsembleLabel="🥗 Principes de la semaine"
        jours={Array.isArray(jours) ? jours : []}
        labelJour={(jourData) => String(jourData.jour ?? "")}
        renderContenu={(jourData) => {
          const { repas, photoQueryJour } = jourData as { repas?: unknown[]; photoQueryJour?: unknown };
          const photoJourUrl =
            typeof photoQueryJour === "string" ? photosParExercice?.[photoQueryJour] : null;
          const hero = photoJourUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
            <img src={photoJourUrl} alt="" className="h-36 w-full rounded-xl object-cover" loading="lazy" />
          );
          if (!Array.isArray(repas) || repas.length === 0) {
            return (
              <>
                {hero}
                <JsonView data={jourData} typeMedia="repas" />
              </>
            );
          }
          return (
            <div className="flex flex-col gap-2.5">
              {hero}
              {repas.map((r, j) => (
                <RepasCard key={j} repas={r} photosParExercice={photosParExercice} />
              ))}
            </div>
          );
        }}
      />

      {Array.isArray(conseilsHabitudes) && conseilsHabitudes.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-xs uppercase tracking-wider text-laiton-500">
            💡 Conseils sur tes habitudes
          </span>
          {conseilsHabitudes.map((c, i) => (
            <div key={i} className="coai-habit-card rounded-xl border border-graphite-800 bg-graphite-900/40 p-4">
              {c.sujet && (
                <span className="text-xs font-semibold uppercase tracking-wide text-laiton-300">
                  {c.sujet}
                </span>
              )}
              {c.constatActuel && (
                <p className="mt-1.5 text-xs leading-5 text-graphite-400">{c.constatActuel}</p>
              )}
              {c.conseil && (
                <p className="mt-1 text-sm leading-6 text-graphite-100">{c.conseil}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {Object.keys(reste).length > 0 && <JsonView data={reste} typeMedia="repas" />}
    </div>
  );
}
