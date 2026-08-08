import type { Subscription } from "@prisma/client";

export type EffectivePlan = "GRATUIT" | "STANDARD" | "PREMIUM";

const ACTIVE_STATUSES = new Set(["ACTIVE", "PAST_DUE"]);

// Le palier Gratuit est désormais un vrai abonnement Stripe (1 mois offert
// puis 19€/mois, carte obligatoire dès l'inscription). En l'absence de ligne
// Subscription (edge case : compte créé avant l'introduction de cette
// offre, ou juste après l'inscription avant que le webhook Stripe n'ait
// tourné), l'utilisateur est aussi considéré Gratuit par défaut.
export function getEffectivePlan(subscription?: Subscription | null): EffectivePlan {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "GRATUIT";
  return subscription.plan;
}

// PREMIUM ("VIP" à la séance depuis ce renommage) n'est plus vendu comme
// abonnement — ce label ne concerne que d'éventuels abonnés déjà sur
// l'ancienne offre.
export const PLAN_LABELS: Record<EffectivePlan, string> = {
  GRATUIT: "Gratuit — 19€/mois après 1 mois offert",
  STANDARD: "Premium — 49€/mois",
  PREMIUM: "Ancien Premium — 199€/mois",
};
