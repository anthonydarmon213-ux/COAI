import { JsonView } from "@/components/programme/json-view";
import Image from "next/image";
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
  sexe,
}: {
  data: unknown;
  showContreIndications?: boolean;
  photosParExercice?: Record<string, string | null>;
  sexe?: string | null;
}) {
  if (!isPlainObject(data)) return <JsonView data={data} />;

  const { _source, titre, vueEnsemble, contreIndications, protocoles, jours, ...reste } = data as {
    _source?: string;
    titre?: string;
    vueEnsemble?: string;
    contreIndications?: string[];
    protocoles?: Record<string, unknown>[];
    jours?: Record<string, unknown>[];
    [key: string]: unknown;
  };
  void _source;

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
            photoRecuperationPourTexte(texteDuJour, sexe) ??
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

      {Array.isArray(protocoles) && protocoles.length > 0 && (
        <section className="flex flex-col gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
              Boîte à outils récupération
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-white">
              Choisis selon ton besoin du jour.
            </h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {protocoles.map((protocole, index) => {
              const nom = typeof protocole.nom === "string" ? protocole.nom : "Récupération";
              const photo = photoRecuperationPourTexte(nom, sexe);
              return (
                <article key={`${nom}-${index}`} className="coai-glass overflow-hidden rounded-2xl">
                  {photo && (
                    <Image
                      src={photo}
                      alt=""
                      width={900}
                      height={675}
                      className="h-36 w-full object-cover"
                    />
                  )}
                  <div className="flex flex-col gap-2 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="font-display text-base font-semibold text-white">{nom}</h4>
                      {typeof protocole.duree === "string" && (
                        <span className="shrink-0 rounded-full border border-laiton-400/25 bg-laiton-400/[0.08] px-2.5 py-1 text-[10px] font-semibold text-laiton-200">
                          {protocole.duree}
                        </span>
                      )}
                    </div>
                    {typeof protocole.conseil === "string" && (
                      <p className="text-xs leading-5 text-graphite-300">{protocole.conseil}</p>
                    )}
                    {typeof protocole.precaution === "string" && (
                      <p className="border-t border-white/[0.07] pt-2 text-[11px] leading-5 text-graphite-500">
                        Prudence · {protocole.precaution}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {Object.keys(reste).length > 0 && <JsonView data={reste} />}
    </div>
  );
}
