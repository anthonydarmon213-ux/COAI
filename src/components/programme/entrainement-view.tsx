import { JsonView } from "@/components/programme/json-view";
import { ExerciceCard } from "@/components/programme/exercice-card";
import { SemainePlan } from "@/components/programme/semaine-plan";
import { ContreIndications } from "@/components/programme/contre-indications";
import { DemarrerSeanceButton } from "@/components/programme/demarrer-seance-button";
import { SeanceDuJourHero } from "@/components/programme/seance-du-jour-hero";
import { LectureProgrammeTabs } from "@/components/programme/lecture-programme-tabs";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { getSessionDuration } from "@/lib/daily/session";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";
import { filtrerExercicesAvecMedias } from "@/lib/exercices/media-coai";
import { nettoyerSupersets } from "@/lib/programmes/supersets";
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
}: {
  data: unknown;
  showContreIndications?: boolean;
  photosParExercice?: Record<string, string | null>;
  dureeProfil?: number | null;
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
  const seancesProgramme: Record<string, unknown>[] = Array.isArray(seances)
    ? seances.filter(isPlainObject).map((seance) => {
        const exercices = Array.isArray(seance.exercices)
          ? nettoyerSupersets(filtrerExercicesAvecMedias(seance.exercices))
          : [];
        return { ...seance, exercices };
      })
    : [];

  const lienProgression = (
    <Link
      href="/suivi/progression#charges"
      className="group flex items-center justify-between gap-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/[0.08] to-laiton-400/[0.07] p-4 transition hover:border-cyan-300/40"
    >
      <span>
        <span className="font-mono text-[9px] font-bold uppercase tracking-[0.17em] text-cyan-200">Progression des charges</span>
        <strong className="mt-1 block text-sm text-white">Chaque charge saisie pendant ta séance alimente automatiquement ta courbe.</strong>
      </span>
      <span className="shrink-0 text-xl text-cyan-200 transition group-hover:translate-x-1">↗</span>
    </Link>
  );

  const resumeSemaine = (
    <div className="flex flex-col gap-4">
      <div>
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Ta semaine en un coup d&apos;œil</p>
        {titre && <h3 className="mt-1.5 font-editorial text-2xl font-normal text-white">{titre}</h3>}
        {vueEnsemble && <p className="mt-2 max-w-3xl text-sm leading-6 text-graphite-300">{vueEnsemble}</p>}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge.texte} className="rounded-full border border-laiton-400/25 bg-laiton-400/10 px-3 py-1 text-xs font-medium text-laiton-300">
              {badge.icone} {badge.texte}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {seancesProgramme.map((seance, index) => {
          const jour = typeof seance.jour === "string" ? seance.jour : `Séance ${index + 1}`;
          const nom = typeof seance.nom === "string" ? seance.nom : `Séance ${index + 1}`;
          const exercices = Array.isArray(seance.exercices) ? seance.exercices : [];
          const minutes = getSessionDuration(seance, dureeProfil ?? 45);

          return (
            <article key={`${jour}-${nom}`} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-laiton-300">{jour}</p>
              <h4 className="mt-1 text-sm font-semibold text-white">{nom}</h4>
              <p className="mt-2 text-xs text-graphite-400">
                {exercices.length} exercice{exercices.length > 1 ? "s" : ""} · environ {minutes} min
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );

  const planDetaille = (
    <div className="flex flex-col gap-5">
      <SemainePlan
        titre={titre}
        badges={badges}
        vueEnsemble={vueEnsemble}
        jours={seancesProgramme}
        ouvrirPremierJour={false}
        labelJour={(seance, i) =>
          typeof seance.nom === "string" ? seance.nom : `Séance ${i + 1}`
        }
        renderContenu={(seance) => {
          const { echauffement, exercices, retourAuCalme, jour, nom, ...detailSeance } = seance as {
            echauffement?: string;
            exercices?: unknown[];
            retourAuCalme?: string;
            jour?: string;
            nom?: string;
            [key: string]: unknown;
          };
          const premierExercice = Array.isArray(exercices) && isPlainObject(exercices[0])
            ? exercices[0]
            : null;
          const premierNom = premierExercice && typeof premierExercice.nom === "string"
            ? premierExercice.nom
            : null;
          const photoSeanceUrl = premierNom ? photoCoaiPourNom(premierNom) : null;
          return (
            <>
              {photoSeanceUrl && (
                <div className="relative overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element -- visuel COAI local vérifié */}
                  <img src={photoSeanceUrl} alt="" className="h-36 w-full object-cover" loading="lazy" />
                  <CoaiImageMark />
                </div>
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

      {Object.keys(reste).length > 0 && (
        <details className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-graphite-200">
            Objectifs, progression et consignes
          </summary>
          <div className="mt-4 border-t border-white/[0.07] pt-4">
            <JsonView data={reste} typeMedia="exercice" />
          </div>
        </details>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      {showContreIndications && <ContreIndications items={contreIndications} />}
      <LectureProgrammeTabs
        aujourdHui={(
          <div className="flex flex-col gap-4">
            <SeanceDuJourHero contenu={data} photosParExercice={photosParExercice} dureeProfil={dureeProfil} />
            {lienProgression}
          </div>
        )}
        semaine={resumeSemaine}
        planComplet={planDetaille}
      />
    </div>
  );
}
