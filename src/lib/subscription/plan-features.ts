import type { EffectivePlan } from "@/lib/subscription/plan";

export const PLAN_FEATURES: Record<EffectivePlan, string[]> = {
  PASS_IA: [
    "Bilan initial et programme personnalisé",
    "Check-in quotidien et séance adaptée à la forme du jour",
    "Entraînement, nutrition et récupération",
    "Coach IA disponible 24h/24 et 7j/7",
    "Suivi des séances, mesures et progrès",
  ],
  STANDARD: [
    "Tout l'accompagnement Pass IA",
    "Programme supervisé par un coach diplômé d'État",
    "Retours humains et ajustements réguliers",
    "Coach IA 24h/24 entre les échanges humains",
  ],
  PREMIUM: [
    "Tout l'accompagnement Coaching Hybride",
    "Séance privée mensuelle avec Anthony",
    "Visio partout ou présentiel à Paris centre",
    "Ajustements prioritaires et attention maximale",
  ],
};
