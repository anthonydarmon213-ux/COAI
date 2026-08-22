"use client";

import { useMemo } from "react";
import { musclesPourExercice, MUSCLE_LABEL, type MuscleSlug } from "@/lib/exercices/muscles";

// Routine de récupération ciblée (22/08/2026, demande Anthony) — trois
// mouvements choisis selon les muscles réellement sollicités par la séance
// du jour. Aucun appel LLM : les étirements par groupe musculaire sont
// standards, un modèle n'apporterait rien et coûterait à chaque affichage.
//
// Si la séance n'est pas reconnue (exercices non mappés) ou si c'est un jour
// de repos, le composant ne s'affiche pas : proposer une routine "générique"
// dans ce cas la rendrait ciblée en apparence seulement.

type Etirement = { nom: string; duree: string; consigne: string };

const PAR_MUSCLE: Partial<Record<MuscleSlug, Etirement>> = {
  chest: { nom: "Ouverture pectoraux au mur", duree: "30s / côté", consigne: "Avant-bras au mur, coude à hauteur d'épaule, pivote doucement le buste vers l'extérieur." },
  deltoids: { nom: "Étirement épaule croisée", duree: "30s / côté", consigne: "Bras tendu en travers de la poitrine, tire-le avec l'autre bras sans hausser l'épaule." },
  triceps: { nom: "Triceps derrière la nuque", duree: "30s / côté", consigne: "Coude vers le haut, main entre les omoplates, accompagne avec l'autre main." },
  biceps: { nom: "Biceps au mur", duree: "30s / côté", consigne: "Main à plat au mur derrière toi, tourne doucement le buste dans l'autre sens." },
  forearm: { nom: "Avant-bras et poignets", duree: "20s / sens", consigne: "Bras tendu, tire les doigts vers toi puis vers le bas." },
  "upper-back": { nom: "Étirement du dos en boule", duree: "45s", consigne: "Mains jointes devant toi, arrondis le haut du dos en poussant les mains loin." },
  trapezius: { nom: "Trapèzes latéraux", duree: "30s / côté", consigne: "Oreille vers l'épaule, main opposée qui accompagne. Sans à-coup." },
  "lower-back": { nom: "Décompression lombaire au sol", duree: "45s", consigne: "Sur le dos, genoux ramenés vers la poitrine, bascule doucement de gauche à droite." },
  abs: { nom: "Extension douce du buste", duree: "30s", consigne: "À plat ventre, appui sur les avant-bras, épaules basses. Amplitude courte." },
  obliques: { nom: "Inclinaison latérale debout", duree: "30s / côté", consigne: "Un bras au-dessus de la tête, incline le buste sur le côté sans partir en avant." },
  quadriceps: { nom: "Quadriceps debout", duree: "30s / côté", consigne: "Talon vers la fesse, genoux côte à côte, bassin légèrement rétroversé." },
  hamstring: { nom: "Ischios jambe tendue", duree: "40s / côté", consigne: "Talon posé devant, jambe tendue, penche-toi depuis les hanches en gardant le dos droit." },
  gluteal: { nom: "Fessier en figure 4", duree: "40s / côté", consigne: "Assis, cheville sur le genou opposé, penche le buste vers l'avant." },
  adductors: { nom: "Adducteurs en fente latérale", duree: "40s / côté", consigne: "Une jambe pliée, l'autre tendue sur le côté, descends le bassin lentement." },
  calves: { nom: "Mollets au mur", duree: "30s / côté", consigne: "Avant du pied contre le mur, talon au sol, avance légèrement la hanche." },
};

export function RoutineRecuperation({ exercicesDuJour }: { exercicesDuJour: string[] }) {
  const routine = useMemo(() => {
    // Comptage des muscles sollicités : les plus fréquents dans la séance
    // sont ceux qui méritent l'étirement, pas le premier exercice croisé.
    const frequence = new Map<MuscleSlug, number>();
    for (const nom of exercicesDuJour) {
      const cible = musclesPourExercice(nom);
      if (!cible) continue;
      for (const m of cible.muscles) frequence.set(m, (frequence.get(m) ?? 0) + 1);
    }
    return [...frequence.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([muscle]) => ({ muscle, etirement: PAR_MUSCLE[muscle] }))
      .filter((e): e is { muscle: MuscleSlug; etirement: Etirement } => Boolean(e.etirement))
      .slice(0, 3);
  }, [exercicesDuJour]);

  if (routine.length === 0) return null;

  return (
    <section className="coai-glass p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Après ta séance</p>
      <h2 className="mt-1.5 text-lg font-semibold text-white">🧘 Récupération ciblée</h2>
      <p className="mt-1 text-xs leading-5 text-graphite-400">
        Trois étirements pour les muscles que tu as réellement travaillés aujourd&apos;hui.
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {routine.map(({ muscle, etirement }, i) => (
          <div key={muscle} className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-white">
                <span className="mr-1.5 font-mono text-[10px] text-laiton-300">{i + 1}</span>
                {etirement.nom}
              </p>
              <span className="flex-none font-mono text-[10px] tabular-nums text-graphite-500">{etirement.duree}</span>
            </div>
            <p className="mt-1 text-xs leading-5 text-graphite-400">{etirement.consigne}</p>
            <span className="mt-1.5 inline-block rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-graphite-500">
              {MUSCLE_LABEL[muscle]}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-4 text-graphite-500">
        Étirements doux, jamais dans la douleur — si ça tire vraiment, relâche.
      </p>
    </section>
  );
}
