// Readiness du jour (22/08/2026, demande Anthony) — score d'aptitude
// combinant le check-in du matin et, quand elles existent, les données de
// santé importées (HRV, FC de repos).
//
// Point important : ce score N'AJOUTE AUCUNE décision. adaptWorkout()
// (src/lib/daily/session.ts) décide déjà quoi faire de la séance — douleur
// → séance suspendue, charge mentale saturée → mobilité + respiration,
// sommeil/énergie bas → volume réduit, temps court → exercices clés
// conservés. Ce module rend cette logique lisible et chiffrée pour
// l'utilisateur ; il ne bascule rien lui-même, sinon deux systèmes
// pourraient donner deux verdicts différents sur la même journée.

export type NiveauReadiness = "ELEVE" | "MODERE" | "BAS";

export type Readiness = {
  score: number;
  niveau: NiveauReadiness;
  titre: string;
  recommandation: string;
  facteurs: { label: string; valeur: string; poids: "positif" | "neutre" | "negatif" }[];
  /** false quand aucun check-in n'a encore été fait aujourd'hui. */
  disponible: boolean;
};

type EntreeReadiness = {
  sleep: string | null;
  energy: string | null;
  chargeMentale: string | null;
  pain: boolean | null;
  /** Profil : renseignés seulement si une montre/Apple Santé a été importée. */
  hrv: number | null;
  frequenceCardiaqueRepos: number | null;
};

const SOMMEIL_POINTS: Record<string, number> = {
  TRES_MAUVAIS: 0,
  MAUVAIS: 8,
  CORRECT: 20,
  BON: 30,
  EXCELLENT: 35,
};

const ENERGIE_POINTS: Record<string, number> = {
  TRES_BASSE: 0,
  BASSE: 8,
  NORMALE: 22,
  HAUTE: 32,
  TRES_HAUTE: 35,
};

const CHARGE_POINTS: Record<string, number> = {
  LEGERE: 20,
  NORMALE: 16,
  CHARGEE: 8,
  SATUREE: 0,
};

const SOMMEIL_LABEL: Record<string, string> = {
  TRES_MAUVAIS: "Très mauvais",
  MAUVAIS: "Mauvais",
  CORRECT: "Correct",
  BON: "Bon",
  EXCELLENT: "Excellent",
};

const ENERGIE_LABEL: Record<string, string> = {
  TRES_BASSE: "Très basse",
  BASSE: "Basse",
  NORMALE: "Normale",
  HAUTE: "Haute",
  TRES_HAUTE: "Très haute",
};

const CHARGE_LABEL: Record<string, string> = {
  LEGERE: "Légère",
  NORMALE: "Normale",
  CHARGEE: "Chargée",
  SATUREE: "Saturée",
};

export function calculerReadiness(entree: EntreeReadiness): Readiness {
  const facteurs: Readiness["facteurs"] = [];

  // Sans check-in, aucun score : afficher un chiffre à partir du seul
  // profil laisserait croire à une mesure du jour alors que rien n'a été
  // renseigné aujourd'hui.
  if (!entree.sleep && !entree.energy) {
    return {
      score: 0,
      niveau: "MODERE",
      titre: "Ton état du jour t'attend",
      recommandation: "Fais ton bilan du jour pour connaître ton niveau de forme et laisser COAI ajuster ta séance.",
      facteurs: [],
      disponible: false,
    };
  }

  let points = 0;
  let maximum = 0;

  if (entree.sleep) {
    points += SOMMEIL_POINTS[entree.sleep] ?? 20;
    maximum += 35;
    const p = SOMMEIL_POINTS[entree.sleep] ?? 20;
    facteurs.push({
      label: "Sommeil",
      valeur: SOMMEIL_LABEL[entree.sleep] ?? "—",
      poids: p >= 30 ? "positif" : p >= 20 ? "neutre" : "negatif",
    });
  }

  if (entree.energy) {
    const p = ENERGIE_POINTS[entree.energy] ?? 22;
    points += p;
    maximum += 35;
    facteurs.push({
      label: "Énergie",
      valeur: ENERGIE_LABEL[entree.energy] ?? "—",
      poids: p >= 32 ? "positif" : p >= 22 ? "neutre" : "negatif",
    });
  }

  if (entree.chargeMentale) {
    const p = CHARGE_POINTS[entree.chargeMentale] ?? 16;
    points += p;
    maximum += 20;
    facteurs.push({
      label: "Charge mentale",
      valeur: CHARGE_LABEL[entree.chargeMentale] ?? "—",
      poids: p >= 16 ? "positif" : p >= 8 ? "neutre" : "negatif",
    });
  }

  // HRV : uniquement présente si l'utilisateur a importé une capture de
  // montre ou connecté Apple Santé. On la traite comme un bonus/malus
  // modeste, jamais comme le facteur dominant — la valeur peut dater de
  // plusieurs jours et n'est pas une mesure du matin même.
  if (typeof entree.hrv === "number" && entree.hrv > 0) {
    const p = entree.hrv >= 60 ? 10 : entree.hrv >= 35 ? 6 : 2;
    points += p;
    maximum += 10;
    facteurs.push({
      label: "HRV",
      valeur: `${entree.hrv} ms`,
      poids: p >= 10 ? "positif" : p >= 6 ? "neutre" : "negatif",
    });
  }

  const score = maximum > 0 ? Math.round((points / maximum) * 100) : 0;

  // Une douleur signalée plafonne le score : adaptWorkout suspend déjà la
  // séance dans ce cas, le chiffre affiché doit refléter cette décision au
  // lieu de la contredire avec un score élevé.
  const scoreFinal = entree.pain ? Math.min(score, 35) : score;
  if (entree.pain) {
    facteurs.push({ label: "Douleur signalée", valeur: "Oui", poids: "negatif" });
  }

  if (entree.pain) {
    return {
      score: scoreFinal,
      niveau: "BAS",
      titre: "Priorité au repos",
      recommandation: "Tu as signalé une gêne : ta séance est mise en pause aujourd'hui. Si la douleur persiste ou s'intensifie, demande un avis médical.",
      facteurs,
      disponible: true,
    };
  }

  if (scoreFinal >= 70) {
    return {
      score: scoreFinal,
      niveau: "ELEVE",
      titre: "Prêt pour une séance intense",
      recommandation: "Bon terrain aujourd'hui : tu peux viser l'intensité prévue, voire pousser un peu sur ton exercice principal.",
      facteurs,
      disponible: true,
    };
  }

  if (scoreFinal >= 50) {
    return {
      score: scoreFinal,
      niveau: "MODERE",
      titre: "Séance normale, sans forcer",
      recommandation: "Fais ta séance comme prévu, mais garde une répétition en réserve sur chaque série plutôt que d'aller à l'échec.",
      facteurs,
      disponible: true,
    };
  }

  return {
    score: scoreFinal,
    niveau: "BAS",
    titre: "Journée à alléger",
    recommandation: "Ton sommeil et ton énergie sont bas : COAI réduit le volume de ta séance. Mobilité et marche restent d'excellentes options aujourd'hui.",
    facteurs,
    disponible: true,
  };
}
