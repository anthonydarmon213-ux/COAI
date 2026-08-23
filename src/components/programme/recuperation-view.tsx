import { JsonView } from "@/components/programme/json-view";
import { SemainePlan } from "@/components/programme/semaine-plan";
import { ContreIndications } from "@/components/programme/contre-indications";

// Vue dédiée au pilier RÉCUPÉRATION : mêmes codes visuels que l'entraînement
// et la nutrition (vue d'ensemble + un jour par carte repliable).
import { photoRecuperationPourTexte } from "@/lib/recuperation/photos-recuperation";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function RecuperationView({
  data,
  showContreIndications = false,
  photosParExercice,
}: {
  data: unknown;
  showContreIndications?: boolean;
  photosParExercice?: Record<string, string | null>;
}) {
  if (!isPlainObject(data)) return <JsonView data={data} />;

  const { titre, vueEnsemble, contreIndications, jours, ...reste } = data as {
    titre?: string;
    vueEnsemble?: string;
    contreIndications?: string[];
    jours?: Record<string, unknown>[];
    [key: string]: unknown;
  };

  return (
    <div className="coai-recovery-view flex flex-col gap-5">
      {showContreIndications && <ContreIndications items={contreIndications} />}
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
          const { jour, type, sommeil, photoQueryJour, ...detailJour } = jourData;
          void jour;
          // Photo COAI d'abord (24/08/2026), sur le contenu réel de la
          // journée plutôt que sur la requête Pexels : "rouleau de mousse
          // sur les quadriceps" trouve la bonne image, là où la recherche
          // par mots-clés renvoyait des photos de spa sans rapport.
          const texteDuJour = [type, sommeil, ...Object.values(detailJour)]
            .filter((v): v is string => typeof v === "string")
            .join(" ");
          const photoJourUrl =
            photoRecuperationPourTexte(texteDuJour) ??
            (typeof photoQueryJour === "string" ? photosParExercice?.[photoQueryJour] ?? null : null);
          return (
            <div className="flex flex-col gap-3">
              {photoJourUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
                <img src={photoJourUrl} alt="" className="h-36 w-full rounded-xl object-cover" loading="lazy" />
              )}
              {typeof sommeil === "string" && sommeil.trim() && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-laiton-300">🌙 Sommeil</p>
                  <p className="mt-1.5 text-sm leading-6 text-graphite-200">{sommeil}</p>
                </div>
              )}
              <JsonView data={detailJour} />
            </div>
          );
        }}
      />

      {Object.keys(reste).length > 0 && <JsonView data={reste} />}
    </div>
  );
}
