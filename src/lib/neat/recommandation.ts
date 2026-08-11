import type { SignauxAdaptation } from "@/lib/adaptation/signals";
import { donneesSuffisantesNeat, type SignauxNeat } from "@/lib/neat/signaux";
import type { EtatVoyage } from "@/lib/neat/voyage";

export type TypeRecommandationNeat =
  | "INSUFFISANT"
  | "PRUDENCE_DOULEUR"
  | "VOYAGE"
  | "PRIORITE_RECUPERATION"
  | "DEJA_ELEVE"
  | "BAISSE"
  | "AUGMENTER"
  | "STABLE";

export type RecommandationNeat = {
  type: TypeRecommandationNeat;
  message: string;
  ton: "neutral" | "success" | "warning";
};

// Seuils relatifs à la référence PERSONNELLE de l'utilisateur (moyenne 28j),
// jamais à un objectif universel de pas — exigence explicite du bloc NEAT.
const SEUIL_BAISSE = -0.2;
const SEUIL_DEJA_ELEVE = 0.2;
const SEUIL_STABLE = 0.1;

// Moteur déterministe et prudent, appliqué AVANT tout appel IA (même
// principe que src/lib/adaptation/engine.ts : les règles de sécurité vivent
// dans le code, jamais uniquement dans un prompt). Ordre de priorité :
// données insuffisantes > douleur > voyage > fatigue/sommeil > déjà élevé/
// métier physique > baisse inhabituelle > stable ou faible avec bonne
// récupération.
export function calculerRecommandationNeat(
  signauxNeat: SignauxNeat,
  signauxAdaptation: SignauxAdaptation,
  etatVoyage: EtatVoyage,
  contrainteRecenteType: string | null
): RecommandationNeat {
  if (!donneesSuffisantesNeat(signauxNeat)) {
    return {
      type: "INSUFFISANT",
      message: "COAI apprend encore ton niveau d'activité quotidien.",
      ton: "neutral",
    };
  }

  const douleurImportante = signauxAdaptation.douleurRecente?.niveau === "IMPORTANTE";
  if (douleurImportante) {
    const zone = signauxAdaptation.douleurRecente?.zone;
    return {
      type: "PRUDENCE_DOULEUR",
      message: `Une douleur importante${zone ? ` (${zone})` : ""} a été signalée récemment — pas de recommandation d'augmenter la marche ou l'activité tant que ce n'est pas résorbé. COAI ne remplace pas un professionnel de santé.`,
      ton: "warning",
    };
  }

  if (etatVoyage.actif) {
    return {
      type: "VOYAGE",
      message:
        "Tu es en mode voyage — pas d'objectif fixe ici. Une baisse d'activité pendant cette période n'est pas pénalisée (et le voyage fait parfois marcher plus que d'habitude). COAI reviendra à ta référence habituelle dès ton retour.",
      ton: "neutral",
    };
  }

  const sommeilMauvais =
    signauxAdaptation.checkinHebdo?.sommeil === "MAUVAIS" ||
    signauxAdaptation.checkinHebdo?.sommeil === "TRES_MAUVAIS";
  const fatigueElevee =
    signauxAdaptation.checkinHebdo?.energie != null && signauxAdaptation.checkinHebdo.energie <= 2;
  const stressEleve =
    signauxAdaptation.checkinHebdo?.stress != null && signauxAdaptation.checkinHebdo.stress >= 4;

  if (sommeilMauvais || fatigueElevee || stressEleve) {
    return {
      type: "PRIORITE_RECUPERATION",
      message:
        "Ton sommeil ou ta fatigue ne sont pas au mieux en ce moment — on ne cherche pas à augmenter l'entraînement ET l'activité quotidienne en même temps. Priorité à la récupération.",
      ton: "warning",
    };
  }

  const metierPhysique = signauxNeat.dernierTypeTravail === "PHYSIQUE";
  const dejaEleve = (signauxNeat.tendance ?? 0) >= SEUIL_DEJA_ELEVE;

  if (metierPhysique || dejaEleve) {
    return {
      type: "DEJA_ELEVE",
      message: metierPhysique
        ? "Ton métier t'amène déjà à bouger beaucoup au quotidien — COAI ne rajoute pas de pas artificiellement, la priorité va à ta récupération."
        : "Ton activité quotidienne est déjà élevée en ce moment. COAI privilégie ta récupération plutôt que l'ajout de pas.",
      ton: "neutral",
    };
  }

  if ((signauxNeat.tendance ?? 0) <= SEUIL_BAISSE) {
    const suggestionCourte =
      contrainteRecenteType === "MANQUE_TEMPS"
        ? " Plusieurs marches courtes dans la journée valent une longue séance en plus."
        : "";
    return {
      type: "BAISSE",
      message: `Tu bouges moins que d'habitude cette semaine.${suggestionCourte} Quelques marches courtes peuvent t'aider à retrouver progressivement ton rythme habituel — rien d'urgent ni de brusque.`,
      ton: "warning",
    };
  }

  if (Math.abs(signauxNeat.tendance ?? 0) < SEUIL_STABLE) {
    return {
      type: "STABLE",
      message: "Ton activité reste proche de ta moyenne habituelle. Continue ainsi.",
      ton: "success",
    };
  }

  return {
    type: "AUGMENTER",
    message:
      "Ta récupération est correcte et ton activité est stable — c'est le bon moment pour une petite augmentation progressive si tu en as envie, sans obligation ni objectif précis à atteindre.",
    ton: "success",
  };
}
