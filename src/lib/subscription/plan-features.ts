import type { EffectivePlan } from "@/lib/subscription/plan";

// Fonctions incluses par palier — reprend les mêmes libellés que /pricing,
// réutilisé partout où l'abonné doit voir ce qu'il a (dashboard, compte).
export const PLAN_FEATURES: Record<EffectivePlan, string[]> = {
  GRATUIT: [
    "Journal de séances",
    "Suivi des mesures et photos de progression",
    "Graphiques de progression",
    "Coach IA — 4 questions/mois",
    "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
    "Analyse de photo morphologique et posturale",
    "Programme personnalisé généré par IA (entraînement, nutrition, récupération) — sans relecture humaine",
  ],
  STANDARD: [
    "Programme personnalisé généré par IA (entraînement, nutrition, récupération)",
    "Validation humaine — chaque programme relu et validé par un vrai coach",
    "1 séance visio de 30 min/mois avec Anthony Darmon incluse, à réserver via WhatsApp",
    "Suivi de progression",
    "Coach IA — accès illimité",
    "Ajustements continus selon tes retours",
    "Assistant WhatsApp 24/7",
    "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
    "Analyse de photo morphologique et posturale",
  ],
  PREMIUM: [
    "Tous les avantages Transformation (programme IA validé, suivi, coach IA, WhatsApp)",
    "1 séance/mois avec Anthony Darmon incluse — présentiel ou visio, à réserver via WhatsApp",
  ],
};
