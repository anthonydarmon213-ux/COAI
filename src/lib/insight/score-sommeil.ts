import type { DailySleep } from "@prisma/client";
import { SOMMEIL_TIPS } from "@/lib/diagnostic/mini-diagnostic";

// Score sommeil du pilier Récupération (19/08/2026, demande Anthony : "on
// améliore le sommeil de la personne... avec un score sommeil"). Distinct
// du sous-score "récupération" de age-coai.ts (qui mélange sommeil et
// énergie 50/50 pour le Score COAI global) — ici, un score dédié
// uniquement au sommeil, avec ses propres recommandations concrètes.
// Aucun appel IA : mêmes principes que le reste de l'app (règles
// déterministes, jamais de chiffre inventé).

const SLEEP_SCORE: Record<DailySleep, number> = {
  TRES_MAUVAIS: 15,
  MAUVAIS: 35,
  CORRECT: 55,
  BON: 78,
  EXCELLENT: 95,
};

const MIN_JOURS = 3;

export type NiveauSommeil = "À travailler" | "Correct" | "Bon" | "Excellent";

const RECOMMANDATIONS_PAR_NIVEAU: Record<NiveauSommeil, string[]> = {
  "À travailler": [
    "Vise un horaire de coucher fixe, y compris le week-end — la régularité compte souvent plus que la durée exacte.",
    "Coupe les écrans au moins 30 minutes avant de dormir : la lumière bleue retarde l'endormissement.",
    "Évite la caféine après 14h — sa demi-vie dépasse souvent 6 heures et retarde l'endormissement.",
  ],
  Correct: [
    "Garde ta chambre fraîche et sombre : une température autour de 18-19°C favorise un sommeil plus profond.",
    "Essaie de te coucher 30 minutes plus tôt cette semaine et observe l'effet sur ton énergie en séance.",
  ],
  Bon: [
    "Ton sommeil est un vrai atout pour progresser — garde ce rythme, surtout les veilles de séance intense.",
  ],
  Excellent: [
    "Excellent terrain de récupération — peu de monde a cette régularité, c'est un vrai avantage pour progresser.",
  ],
};

function niveauPourScore(score: number): NiveauSommeil {
  if (score >= 80) return "Excellent";
  if (score >= 62) return "Bon";
  if (score >= 42) return "Correct";
  return "À travailler";
}

export type ScoreSommeilResultat =
  | {
      disponible: true;
      score: number;
      niveau: NiveauSommeil;
      tendance: "hausse" | "stable" | "baisse" | null;
      recommandations: string[];
      jours: number;
    }
  | {
      disponible: false;
      joursRestants: number;
      conseilDeclare: string | null;
    };

export function calculerScoreSommeil(
  dailies: Array<{ sleep: DailySleep | null; date: Date }>,
  qualiteSommeilDeclaree?: string | null
): ScoreSommeilResultat {
  const avecSommeil = dailies.filter((d): d is { sleep: DailySleep; date: Date } => d.sleep != null);

  if (avecSommeil.length < MIN_JOURS) {
    return {
      disponible: false,
      joursRestants: MIN_JOURS - avecSommeil.length,
      conseilDeclare: qualiteSommeilDeclaree ? SOMMEIL_TIPS[qualiteSommeilDeclaree] ?? null : null,
    };
  }

  const scoreMoyen = Math.round(avecSommeil.reduce((somme, d) => somme + SLEEP_SCORE[d.sleep], 0) / avecSommeil.length);
  const niveau = niveauPourScore(scoreMoyen);

  // Tendance : moyenne des 7 derniers jours vs les 7 précédents, seulement
  // si les deux fenêtres ont assez de données pour être fiables.
  const triesRecent = [...avecSommeil].sort((a, b) => b.date.getTime() - a.date.getTime());
  const recents = triesRecent.slice(0, 7);
  const precedents = triesRecent.slice(7, 14);
  let tendance: "hausse" | "stable" | "baisse" | null = null;
  if (recents.length >= 3 && precedents.length >= 3) {
    const moyRecent = recents.reduce((s, d) => s + SLEEP_SCORE[d.sleep], 0) / recents.length;
    const moyPrecedent = precedents.reduce((s, d) => s + SLEEP_SCORE[d.sleep], 0) / precedents.length;
    const ecart = moyRecent - moyPrecedent;
    tendance = ecart >= 8 ? "hausse" : ecart <= -8 ? "baisse" : "stable";
  }

  return {
    disponible: true,
    score: scoreMoyen,
    niveau,
    tendance,
    recommandations: RECOMMANDATIONS_PAR_NIVEAU[niveau],
    jours: avecSommeil.length,
  };
}
