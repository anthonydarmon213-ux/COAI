import type { Subscription } from "@prisma/client";

export type EffectivePlan = "GRATUIT" | "STANDARD" | "PREMIUM";

const ACTIVE_STATUSES = new Set(["ACTIVE", "PAST_DUE"]);

// Le palier Gratuit n'a pas de ligne Subscription : dès qu'il n'y a pas
// d'abonnement Stripe actif, l'utilisateur est considéré Gratuit.
export function getEffectivePlan(subscription?: Subscription | null): EffectivePlan {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "GRATUIT";
  return subscription.plan;
}

export const PLAN_LABELS: Record<EffectivePlan, string> = {
  GRATUIT: "Gratuit",
  STANDARD: "Standard — 49€/mois",
  PREMIUM: "Premium — 199€/mois",
};
