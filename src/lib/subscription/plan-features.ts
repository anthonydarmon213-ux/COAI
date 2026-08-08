import type { EffectivePlan } from "@/lib/subscription/plan";

// Fonctions incluses par palier — reprend les mêmes libellés que /pricing,
// réutilisé partout où l'abonné doit voir ce qu'il a (dashboard, compte).
export const PLAN_FEATURES: Record<EffectivePlan, string[]> = {
  GRATUIT: [
    "Journal de séances",
    "Suivi des mesures et photos de progression",
    "Graphiques de progression",
    "Coach IA — 4 questions/mois",
  ],
  STANDARD: [
    "Programme personnalisé généré par IA (entraînement, nutrition, récupération)",
    "Validation humaine — chaque programme relu et validé par un vrai coach",
    "Suivi de progression",
    "Coach IA — 4 questions/mois",
    "Ajustements continus selon tes retours",
    "Streaming (yoga, mobilité, récupération…)",
    "Assistant WhatsApp 24/7",
  ],
  PREMIUM: [
    "Tous les avantages Premium (programme IA validé, suivi, coach IA, streaming, WhatsApp)",
    "1 séance/mois avec Anthony Darmon incluse — présentiel ou visio, à réserver via WhatsApp",
  ],
};
