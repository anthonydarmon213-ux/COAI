import { JsonView } from "@/components/programme/json-view";
import { ExerciceCard } from "@/components/programme/exercice-card";
import { SemainePlan } from "@/components/programme/semaine-plan";
import { ContreIndications } from "@/components/programme/contre-indications";
import { DemarrerSeanceButton } from "@/components/programme/demarrer-seance-button";
import { SeanceDuJourHero } from "@/components/programme/seance-du-jour-hero";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import Link from "next/link";

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
  dureeProfil,
  premiereSeance = false,
}: {
  data: unknown;
  showContreIndications?: boolean;
  photosParExercice?: Record<string, string | null>;
  dureeProfil?: number | null;
  premiereSeance?: boolean;
}) {
  if (!isPlainObject(data)) return <JsonView data={data} typeMedia="exercice" />;

  const { _source, titre, frequenceParSemaine, dureeProgramme, vueEnsemble, contreIndications, seances, ...reste } = data as {
    _source?: string;
    titre?: string;
    frequenceParSemaine?: string;
    dureeProgramme?: string;
    vueEnsemble?: string;
    contreIndications?: string[];
    seances?: Record<string, unknown>[];
    [key: string]: unknown;
  };
  void _source;

  const badges = [
    frequenceParSemaine ? { icone: "📅", texte: String(frequenceParSemaine) } : null,
    dureeProgramme ? { icone: "⏳", texte: String(dureeProgramme) } : null,
  ].filter((b): b is { icone: string; texte: string } => b !== null);

  return (
    <div className="flex flex-col gap-5">
      {showContreIndications && <ContreIndications items={contreIndications} />}
      {/* Séance du jour en tête (22/08/2026) — le lecteur est accessible en
          un clic, sans avoir à deviner quel jour ouvrir dans l'accordéon. */}
      <SeanceDuJourHero contenu={data} photosParExercice={photosParExercice} dureeProfil={dureeProfil} premiereSeance={premiereSeance} />
      <Link
        href="/suivi/repcount"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/[0.08] to-laiton-400/[0.07] p-4 transition hover:border-cyan-300/40"
      >
        <span>
          <span className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-cyan-200">Progression des charges</span>
          <strong className="mt-1 block text-sm text-white">Note une série ou retrouve automatiquement les courbes alimentées pendant tes séances.</strong>
        </span>
        <span className="shrink-0 text-xl text-cyan-200 transition group-hover:translate-x-1">↗</span>
      </Link>
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
          const premierExercice = Array.isArray(exercices) && isPlainObject(exercices[0])
            ? exercices[0]
            : null;
          const premierNom = premierExercice && typeof premierExercice.nom === "string"
            ? premierExercice.nom
            : null;
          const photoSeanceUrl =
            (premierNom ? photoCoaiPourNom(premierNom) : null) ??
            (typeof photoQuerySeance === "string" ? photosParExercice?.[photoQuerySeance] : null);
          return (
            <>
              <div className="rounded-2xl border border-cyan-300/25 bg-gradient-to-br from-cyan-950/40 to-black p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-cyan-200">Ton parcours de séance</p>
                <ol className="mt-3 grid gap-2 text-sm text-white sm:grid-cols-3">
                  <li className="rounded-xl border border-white/10 p-3"><span className="mr-2 text-cyan-200">01</span>Échauffement</li>
                  <li className="rounded-xl border border-white/10 p-3"><span className="mr-2 text-cyan-200">02</span>Corps de séance</li>
                  <li className="rounded-xl border border-white/10 p-3"><span className="mr-2 text-laiton-200">03</span>Retour au calme</li>
                </ol>
                <p className="mt-3 text-xs leading-5 text-graphite-300">Découvre les mouvements ci-dessous, puis lance la séance guidée. Les charges se renseignent pendant la séance.</p>
              </div>
              {photoSeanceUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- source Pexels externe, next/image nécessiterait de whitelister le domaine pour un usage encore expérimental
                <img src={photoSeanceUrl} alt="" className="h-36 w-full rounded-xl object-cover object-center" loading="lazy" />
              )}
              {Array.isArray(exercices) && exercices.length > 0 && (
                <DemarrerSeanceButton
                  nomSeance={typeof nom === "string" ? nom : "Ta séance"}
                  echauffement={typeof echauffement === "string" ? echauffement : undefined}
                  exercices={exercices}
                  retourAuCalme={typeof retourAuCalme === "string" ? retourAuCalme : undefined}
                  photosParExercice={photosParExercice}
                />
              )}
              {echauffement && (
                <section className="coai-session-note rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.04] p-5">
                  <h3 className="text-base font-semibold text-cyan-100">
                    01 · Échauffement
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-graphite-200">
                    {String(echauffement)}
                  </p>
                </section>
              )}
              {Array.isArray(exercices) && exercices.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h3 className="mb-2 mt-3 text-base font-semibold text-white">02 · Corps de séance <span className="text-sm font-normal text-graphite-400">— {exercices.length} exercices</span></h3>
                  {exercices.map((exercice, j) => (
                    <ExerciceCard key={j} exercice={exercice} photosParExercice={photosParExercice} />
                  ))}
                </div>
              )}
              {retourAuCalme && (
                <section className="coai-session-note rounded-2xl border border-laiton-300/25 bg-laiton-300/[0.04] p-5">
                  <h3 className="text-base font-semibold text-laiton-100">
                    03 · Retour au calme
                  </h3>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-graphite-200">
                    {String(retourAuCalme)}
                  </p>
                </section>
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
