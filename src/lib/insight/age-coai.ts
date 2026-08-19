import type { DailySession } from "@prisma/client";

// Score & Âge COAI façon Whoop (19/08/2026, demande d'Anthony : "il faut
// metre en avant le score coai et l'age coai facon whoop").
//
// Différence volontaire avec `indiceCoai` (src/lib/diagnostic/mini-diagnostic.ts) :
// ce dernier est un score DÉCLARATIF, calculé une seule fois à partir des
// réponses du quiz (avant même la création du compte) — il mesure un
// potentiel de départ. Le "Score COAI" calculé ici est COMPORTEMENTAL : il
// se recalcule à chaque visite du dashboard à partir de ce que
// l'utilisateur a réellement fait (régularité des check-ins, séances
// terminées, sommeil/énergie déclarés, dosage ressenti). Les deux
// coexistent et ne racontent pas la même chose ; le dashboard l'explicite
// dans le libellé plutôt que de laisser croire à un seul et même chiffre.
//
// Comme `tendances-longitudinales.ts`, aucune donnée n'est inventée :
// tant que l'échantillon est trop petit ou que l'âge déclaré manque, la
// fonction renvoie `disponible: false` plutôt qu'un chiffre par défaut.
// Aucune mesure physiologique réelle (pas de bracelet connecté, pas de
// VO2max, pas de HRV) : "Âge COAI" est un indicateur de forme relative
// dérivé du comportement déclaré, jamais une donnée médicale — d'où le
// disclaimer explicite exporté ci-dessous, à afficher partout où le
// chiffre apparaît.

export const AGE_COAI_DISCLAIMER =
  "L'Âge COAI n'est pas une mesure médicale ni physiologique. C'est un indicateur de forme relative, calculé à partir de ta régularité, ta récupération déclarée et le dosage de tes séances — pas d'un bracelet connecté.";

type DailyPourAgeCoai = Pick<DailySession, "sleep" | "energy" | "workoutRating" | "pain" | "completedAt">;

export type AgeCoaiResultat =
  | {
      disponible: true;
      score: number;
      niveau: "À renforcer" | "En construction" | "Solide" | "Excellent";
      ageChronologique: number;
      ageCoai: number;
      ecartAnnees: number; // positif = COAI plus jeune que l'âge réel
      composantes: { regularite: number; recuperation: number; dosage: number };
      jours: number;
    }
  | {
      disponible: false;
      raison: "DONNEES_INSUFFISANTES" | "AGE_MANQUANT";
      joursDeSuiviRestants: number;
    };

const MIN_JOURS_DONNEES = 7;
const ECART_MAX_ANNEES = 6;
const AGE_COAI_PLANCHER = 16;

const SLEEP_SCORE: Record<string, number> = { TRES_MAUVAIS: 15, MAUVAIS: 35, CORRECT: 55, BON: 78, EXCELLENT: 95 };
const ENERGY_SCORE: Record<string, number> = { TRES_BASSE: 15, BASSE: 35, NORMALE: 55, HAUTE: 78, TRES_HAUTE: 95 };

export function calculerAgeCoai(params: {
  ageChronologique: number | null;
  dailies: DailyPourAgeCoai[];
}): AgeCoaiResultat {
  const { ageChronologique, dailies } = params;
  const avecDonnees = dailies.filter((d) => d.sleep != null || d.energy != null || d.workoutRating != null);

  if (avecDonnees.length < MIN_JOURS_DONNEES) {
    return {
      disponible: false,
      raison: "DONNEES_INSUFFISANTES",
      joursDeSuiviRestants: MIN_JOURS_DONNEES - avecDonnees.length,
    };
  }
  if (ageChronologique == null) {
    return { disponible: false, raison: "AGE_MANQUANT", joursDeSuiviRestants: 0 };
  }

  // Régularité : part des jours de check-in effectivement menés à terme.
  const termines = avecDonnees.filter((d) => d.completedAt != null).length;
  const regularite = Math.round((termines / avecDonnees.length) * 100);

  // Récupération : moyenne sommeil/énergie déclarés, pénalisée par la
  // fréquence des jours douloureux (feedback réel, pas une estimation).
  const avecSommeil = avecDonnees.filter((d) => d.sleep != null);
  const avecEnergie = avecDonnees.filter((d) => d.energy != null);
  const sommeilMoyen = avecSommeil.length
    ? avecSommeil.reduce((somme, d) => somme + (SLEEP_SCORE[String(d.sleep)] ?? 55), 0) / avecSommeil.length
    : null;
  const energieMoyenne = avecEnergie.length
    ? avecEnergie.reduce((somme, d) => somme + (ENERGY_SCORE[String(d.energy)] ?? 55), 0) / avecEnergie.length
    : null;
  const baseRecuperation =
    sommeilMoyen != null && energieMoyenne != null
      ? (sommeilMoyen + energieMoyenne) / 2
      : sommeilMoyen ?? energieMoyenne ?? 55;
  const joursDouloureux = avecDonnees.filter((d) => d.pain === true).length;
  const penaliteDouleur = Math.min(20, Math.round((joursDouloureux / avecDonnees.length) * 30));
  const recuperation = Math.max(0, Math.min(100, Math.round(baseRecuperation - penaliteDouleur)));

  // Dosage : part des séances ressenties comme "bien dosées" (ni trop
  // faciles, ni trop dures) parmi celles évaluées.
  const avecRessenti = avecDonnees.filter((d) => d.workoutRating != null);
  const dosage = avecRessenti.length
    ? Math.round((avecRessenti.filter((d) => d.workoutRating === "BIEN_DOSEE").length / avecRessenti.length) * 100)
    : 55;

  const score = Math.round(regularite * 0.4 + recuperation * 0.4 + dosage * 0.2);
  const ecartBrut = Math.round(((score - 50) / 50) * ECART_MAX_ANNEES);
  const ecartAnnees = Math.max(-ECART_MAX_ANNEES, Math.min(ECART_MAX_ANNEES, ecartBrut));
  const ageCoai = Math.max(AGE_COAI_PLANCHER, ageChronologique - ecartAnnees);

  const niveau: "À renforcer" | "En construction" | "Solide" | "Excellent" =
    score >= 78 ? "Excellent" : score >= 60 ? "Solide" : score >= 42 ? "En construction" : "À renforcer";

  return {
    disponible: true,
    score,
    niveau,
    ageChronologique,
    ageCoai,
    ecartAnnees: ageChronologique - ageCoai,
    composantes: { regularite, recuperation, dosage },
    jours: avecDonnees.length,
  };
}
