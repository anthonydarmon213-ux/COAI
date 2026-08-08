import { JsonView } from "@/components/programme/json-view";
import { SemainePlan } from "@/components/programme/semaine-plan";
import { ContreIndications } from "@/components/programme/contre-indications";

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

export function NutritionView({ data }: { data: unknown }) {
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
    <div className="flex flex-col gap-5">
      <ContreIndications items={contreIndications} />
      <SemainePlan
        titre={titre}
        badges={badges}
        vueEnsemble={vueEnsemble}
        vueEnsembleLabel="🥗 Principes de la semaine"
        jours={Array.isArray(jours) ? jours : []}
        labelJour={(jourData) => String(jourData.jour ?? "")}
        renderContenu={(jourData) => {
          const { repas } = jourData as { repas?: unknown[] };
          if (!Array.isArray(repas) || repas.length === 0) {
            return <JsonView data={jourData} typeMedia="repas" />;
          }
          return (
            <div className="flex flex-col gap-2">
              {repas.map((r, j) => (
                <div key={j} className="rounded-lg border border-graphite-800 bg-graphite-950/60 p-3">
                  <JsonView data={r} typeMedia="repas" />
                </div>
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
            <div key={i} className="rounded-lg border border-graphite-800 bg-graphite-900/40 p-3.5">
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
