import { JsonView } from "@/components/programme/json-view";
import { ExerciceCard } from "@/components/programme/exercice-card";
import { SemainePlan } from "@/components/programme/semaine-plan";
import { ContreIndications } from "@/components/programme/contre-indications";

// Vue dédiée au pilier ENTRAÎNEMENT : met en avant la vue d'ensemble de la
// semaine, puis replie chaque séance (fermée par défaut) pour éviter
// d'afficher tout le détail (échauffement + exercices) d'un coup — trop
// dense sinon avec le niveau de détail désormais généré par séance.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function EntrainementView({
  data,
  showContreIndications = false,
  photosParExercice,
}: {
  data: unknown;
  showContreIndications?: boolean;
  photosParExercice?: Record<string, string | null>;
}) {
  if (!isPlainObject(data)) return <JsonView data={data} typeMedia="exercice" />;

  const { titre, frequenceParSemaine, dureeProgramme, vueEnsemble, contreIndications, seances, ...reste } = data as {
    titre?: string;
    frequenceParSemaine?: string;
    dureeProgramme?: string;
    vueEnsemble?: string;
    contreIndications?: string[];
    seances?: Record<string, unknown>[];
    [key: string]: unknown;
  };

  const badges = [
    frequenceParSemaine ? { icone: "📅", texte: String(frequenceParSemaine) } : null,
    dureeProgramme ? { icone: "⏳", texte: String(dureeProgramme) } : null,
  ].filter((b): b is { icone: string; texte: string } => b !== null);

  return (
    <div className="flex flex-col gap-5">
      {showContreIndications && <ContreIndications items={contreIndications} />}
      <SemainePlan
        titre={titre}
        badges={badges}
        vueEnsemble={vueEnsemble}
        jours={Array.isArray(seances) ? seances : []}
        labelJour={(seance, i) =>
          typeof seance.nom === "string" ? seance.nom : `Séance ${i + 1}`
        }
        renderContenu={(seance) => {
          const { echauffement, exercices, retourAuCalme, jour, nom, photoQuerySeance, ...detailSeance } = seance as {
            echauffement?: string;
            exercices?: unknown[];
            retourAuCalme?: string;
            jour?: string;
            nom?: string;
            photoQuerySeance?: string;
            [key: string]: unknown;
          };
          const photoSeanceUrl =
            typeof photoQuerySeance === "string" ? photosParExercice?.[photoQuerySeance] : null;
          return (
            <>
              {photoSeanceUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
                <img src={photoSeanceUrl} alt="" className="h-36 w-full rounded-xl object-cover" loading="lazy" />
              )}
              {echauffement && (
                <div className="coai-session-note rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                    🔥 Échauffement
                  </span>
                  <p className="mt-1 text-xs leading-5 text-graphite-300">
                    {String(echauffement)}
                  </p>
                </div>
              )}
              {Array.isArray(exercices) && exercices.length > 0 && (
                <div className="flex flex-col gap-2">
                  {exercices.map((exercice, j) => (
                    <ExerciceCard key={j} exercice={exercice} photosParExercice={photosParExercice} />
                  ))}
                </div>
              )}
              {retourAuCalme && (
                <div className="coai-session-note rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-graphite-500">
                    🧘 Retour au calme
                  </span>
                  <p className="mt-1 text-xs leading-5 text-graphite-300">
                    {String(retourAuCalme)}
                  </p>
                </div>
              )}
              {Object.keys(detailSeance).length > 0 && (
                <JsonView data={detailSeance} typeMedia="exercice" />
              )}
            </>
          );
        }}
      />

      {Object.keys(reste).length > 0 && <JsonView data={reste} typeMedia="exercice" />}
    </div>
  );
}
