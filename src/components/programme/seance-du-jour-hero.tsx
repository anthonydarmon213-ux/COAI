import { DemarrerSeanceButton } from "@/components/programme/demarrer-seance-button";
import { getWorkoutForDate, getSessionDuration } from "@/lib/daily/session";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { CoaiImageMark } from "@/components/ui/coai-image-mark";
import { filtrerExercicesAvecMedias } from "@/lib/exercices/media-coai";
import { nettoyerSupersets } from "@/lib/programmes/supersets";

// Séance du jour mise en avant (22/08/2026, demande Anthony : "le bouton
// Démarrer la séance doit immédiatement lancer le Player"). Jusqu'ici le
// bouton existait mais était enfoui dans l'accordéon du bon jour de la
// semaine : il fallait deviner quel jour ouvrir avant de pouvoir démarrer.
//
// Cette carte lit la séance du jour dans le programme déjà chargé — aucune
// requête supplémentaire, aucune donnée nouvelle. Un jour sans séance
// prévue affiche explicitement "repos", jamais une séance d'un autre jour
// qui laisserait croire qu'elle est au programme aujourd'hui.
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function SeanceDuJourHero({
  contenu,
  photosParExercice,
  dureeProfil,
}: {
  contenu: unknown;
  photosParExercice?: Record<string, string | null>;
  dureeProfil?: number | null;
}) {
  const seance = getWorkoutForDate(contenu, new Date());

  if (!seance || !isPlainObject(seance)) {
    return (
      <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Aujourd&apos;hui</p>
        <h2 className="mt-1.5 text-lg font-semibold text-white">Journée de récupération.</h2>
        <p className="mt-1 text-xs leading-5 text-graphite-400">
          Aucune séance prévue aujourd&apos;hui. Tu peux consulter le reste de ta semaine ci-dessous.
        </p>
      </section>
    );
  }

  const nom = typeof seance.nom === "string" ? seance.nom : "Ta séance du jour";
  const exercices = Array.isArray(seance.exercices)
    ? nettoyerSupersets(filtrerExercicesAvecMedias(seance.exercices))
    : [];
  const echauffement = typeof seance.echauffement === "string" ? seance.echauffement : undefined;
  const retourAuCalme = typeof seance.retourAuCalme === "string" ? seance.retourAuCalme : undefined;
  void photosParExercice;
  const premierNom = isPlainObject(exercices[0]) && typeof exercices[0].nom === "string"
    ? exercices[0].nom
    : null;
  const photoUrl = premierNom ? photoCoaiPourNom(premierNom) : null;
  const minutes = getSessionDuration(seance, dureeProfil ?? 45);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-laiton-400/30 bg-white/[0.03]">
      {photoUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- source Pexels externe */}
          <img src={photoUrl} alt="" className="h-40 w-full bg-black object-contain" loading="lazy" />
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-t from-[#0d0e10] via-[#0d0e10]/40 to-transparent" aria-hidden="true" />
          <CoaiImageMark className="bottom-auto top-28" />
        </>
      )}

      <div className="relative px-5 py-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Ta séance d&apos;aujourd&apos;hui</p>
        <h2 className="mt-1.5 font-display text-xl font-semibold text-white">{nom}</h2>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-graphite-300">
            {exercices.length} exercice{exercices.length > 1 ? "s" : ""}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-medium text-graphite-300">
            ~{minutes} min
          </span>
        </div>

        <div className="mt-4">
          <DemarrerSeanceButton
            nomSeance={nom}
            echauffement={echauffement}
            exercices={exercices}
            retourAuCalme={retourAuCalme}
            photosParExercice={photosParExercice}
          />
        </div>
      </div>
    </section>
  );
}
