import type { GroupeMusculaire, NiveauRecuperationMuscle, RecuperationMusculaire } from "@prisma/client";

// Suivi de récupération par groupe musculaire (19/08/2026). Purement
// déclaratif : ce module ne fait que relire la dernière entrée connue par
// groupe (RecuperationMusculaire, la table est renseignée depuis l'API
// /api/recuperation-musculaire) — jamais de déduction automatique à partir
// des séances (cf. commentaire sur le modèle dans schema.prisma). Un
// groupe jamais renseigné reste explicitement "non renseigné", jamais une
// valeur par défaut.

export const GROUPES_MUSCULAIRES: GroupeMusculaire[] = [
  "DOS",
  "PECTORAUX",
  "EPAULES",
  "BRAS",
  "JAMBES",
  "FESSIERS",
  "ABDOMINAUX",
  "MOLLETS",
];

export const GROUPE_LABEL: Record<GroupeMusculaire, string> = {
  DOS: "Dos",
  PECTORAUX: "Pectoraux",
  EPAULES: "Épaules",
  BRAS: "Bras",
  JAMBES: "Jambes",
  FESSIERS: "Fessiers",
  ABDOMINAUX: "Abdominaux",
  MOLLETS: "Mollets",
};

export const NIVEAU_LABEL: Record<NiveauRecuperationMuscle, string> = {
  COURBATURES_FORTES: "Courbatures fortes",
  COURBATURES_LEGERES: "Courbatures légères",
  LEGERE_FATIGUE: "Légère fatigue",
  FRAIS: "Frais",
};

// Conseil purement dérivé du ressenti déclaré (règle simple, pas d'IA, pas
// de calcul de charge/volume) — jamais une consigne médicale.
export const NIVEAU_CONSEIL: Record<NiveauRecuperationMuscle, string> = {
  COURBATURES_FORTES: "Laisse ce groupe se reposer encore un peu.",
  COURBATURES_LEGERES: "Un travail léger reste possible si tu te sens bien.",
  LEGERE_FATIGUE: "Prêt pour un travail modéré.",
  FRAIS: "Prêt à être sollicité pleinement.",
};

export type EtatGroupeMusculaire = {
  groupe: GroupeMusculaire;
  dernier: Pick<RecuperationMusculaire, "niveau" | "date"> | null;
  joursDepuis: number | null;
};

export function buildEtatRecuperationMuscles(
  entrees: Pick<RecuperationMusculaire, "groupe" | "niveau" | "date">[]
): EtatGroupeMusculaire[] {
  const parGroupe = new Map<GroupeMusculaire, Pick<RecuperationMusculaire, "niveau" | "date">>();
  for (const entree of entrees) {
    const existant = parGroupe.get(entree.groupe);
    if (!existant || entree.date > existant.date) {
      parGroupe.set(entree.groupe, { niveau: entree.niveau, date: entree.date });
    }
  }
  const maintenant = Date.now();
  return GROUPES_MUSCULAIRES.map((groupe) => {
    const dernier = parGroupe.get(groupe) ?? null;
    return {
      groupe,
      dernier,
      joursDepuis: dernier ? Math.floor((maintenant - dernier.date.getTime()) / (24 * 60 * 60 * 1000)) : null,
    };
  });
}
