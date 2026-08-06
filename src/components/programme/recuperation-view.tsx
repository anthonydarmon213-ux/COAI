import { JsonView } from "@/components/programme/json-view";
import { SemainePlan } from "@/components/programme/semaine-plan";

// Vue dédiée au pilier RÉCUPÉRATION : mêmes codes visuels que l'entraînement
// et la nutrition (vue d'ensemble + un jour par carte repliable).
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function RecuperationView({ data }: { data: unknown }) {
  if (!isPlainObject(data)) return <JsonView data={data} />;

  const { titre, vueEnsemble, jours, ...reste } = data as {
    titre?: string;
    vueEnsemble?: string;
    jours?: Record<string, unknown>[];
    [key: string]: unknown;
  };

  return (
    <div className="flex flex-col gap-5">
      <SemainePlan
        titre={titre}
        vueEnsemble={vueEnsemble}
        vueEnsembleLabel="🌙 Principes de la semaine"
        jours={Array.isArray(jours) ? jours : []}
        labelJour={(jourData) => {
          const jour = String(jourData.jour ?? "");
          const type = typeof jourData.type === "string" ? jourData.type : undefined;
          return type ? `${jour} — ${type}` : jour;
        }}
        renderContenu={(jourData) => {
          const { jour, type, ...detailJour } = jourData;
          void jour;
          void type;
          return <JsonView data={detailJour} />;
        }}
      />

      {Object.keys(reste).length > 0 && <JsonView data={reste} />}
    </div>
  );
}
