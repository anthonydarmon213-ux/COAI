// Projection émotionnelle du résultat du diagnostic (19/08/2026, demande
// Anthony, inspirée d'une capture MyFitCoach) : relie l'objectif du
// prospect à un événement précis qu'il a choisi (mariage, vacances,
// performance au travail, jouer avec ses enfants...) avec une trajectoire
// projetée dans le temps. Toujours une estimation bornée par des rythmes
// de progression prudents et réalistes, jamais un chiffre inventé au
// hasard — explicitement présentée comme une projection, pas une promesse.

export const EVENEMENTS_DECLENCHEURS = [
  "Un mariage",
  "Des vacances à la plage",
  "Une compétition ou un événement sportif",
  "Être plus performant au travail",
  "Jouer avec mes enfants sans être essoufflé",
  "Me sentir bien avec mon/ma partenaire",
  "Pas d'événement précis, juste pour moi",
] as const;

export type EvenementDeclencheur = (typeof EVENEMENTS_DECLENCHEURS)[number];

const SANS_EVENEMENT_PRECIS: EvenementDeclencheur = "Pas d'événement précis, juste pour moi";

const SEMAINES_PAR_ECHEANCE: Record<string, number> = {
  "Dans 1 mois — accompagnement VIP": 4,
  "Dans 3 mois": 12,
  "Dans 6 mois": 26,
  "Dans 12 mois": 52,
  "Pas de date précise": 12,
};

export type ProjectionEmotionnelle = {
  type: "POIDS" | "SCORE";
  unite: string;
  semaines: number;
  points: number[];
  depart: number;
  arrivee: number;
  evenement: string | null;
  disclaimer: string;
};

function classifierObjectif(objectif: string | null): "PERTE" | "MASSE" | "AUTRE" {
  if (objectif === "Perdre du gras") return "PERTE";
  if (objectif === "Prendre du muscle") return "MASSE";
  return "AUTRE";
}

function nombreDePoints(semaines: number): number {
  const pas = semaines > 26 ? 4 : semaines > 12 ? 2 : 1;
  return Math.min(12, Math.max(4, Math.round(semaines / pas)));
}

export function construireProjection(r: {
  objectif: string | null;
  poidsKg: string | number | null;
  echeance: string | null;
  evenement: string | null;
  indiceCoaiScore: number;
}): ProjectionEmotionnelle | null {
  const semaines = SEMAINES_PAR_ECHEANCE[r.echeance ?? ""] ?? 12;
  const nbPoints = nombreDePoints(semaines);
  const type = classifierObjectif(r.objectif);
  const poids = r.poidsKg ? Number(r.poidsKg) : null;

  if (type !== "AUTRE" && poids && poids > 0) {
    // Rythmes prudents de nutrition sportive (perte ~0,45kg/semaine, prise
    // de masse maîtrisée ~0,22kg/semaine) — jamais un régime extrême.
    // Garde-fou santé : jamais plus de 10%/8% du poids de départ sur toute
    // la période, quelle que soit la durée choisie.
    const rateParSemaine = type === "PERTE" ? -0.45 : 0.22;
    const capTotal = poids * (type === "PERTE" ? 0.1 : 0.08);
    const totalBrut = rateParSemaine * semaines;
    const total = Math.sign(totalBrut) * Math.min(Math.abs(totalBrut), capTotal);
    const points = Array.from({ length: nbPoints }, (_, i) => {
      const progression = i / (nbPoints - 1);
      return Math.round((poids + total * progression) * 10) / 10;
    });
    return {
      type: "POIDS",
      unite: "kg",
      semaines,
      points,
      depart: poids,
      arrivee: points[points.length - 1]!,
      evenement: r.evenement,
      disclaimer: "Projection indicative basée sur un rythme de progression prudent et réaliste, jamais un régime extrême — pas une promesse de résultat, ni un avis médical.",
    };
  }

  // Objectif non lié au poids (force, mobilité, performance, se sentir
  // mieux, reprise du sport...) : projette le Score COAI déjà calculé
  // (indiceCoai.score, jamais un chiffre inventé pour l'occasion) plutôt
  // qu'un poids hors sujet par rapport à l'objectif déclaré.
  const scoreDepart = Math.round(r.indiceCoaiScore);
  const scoreArrivee = Math.min(92, scoreDepart + Math.min(22, Math.round(semaines * 0.9)));
  const points = Array.from({ length: nbPoints }, (_, i) => {
    const progression = i / (nbPoints - 1);
    return Math.round(scoreDepart + (scoreArrivee - scoreDepart) * progression);
  });
  return {
    type: "SCORE",
    unite: "/100",
    semaines,
    points,
    depart: scoreDepart,
    arrivee: points[points.length - 1]!,
    evenement: r.evenement,
    disclaimer: "Projection indicative de ton Score COAI avec un accompagnement régulier — pas une promesse de résultat.",
  };
}

export { SANS_EVENEMENT_PRECIS };
