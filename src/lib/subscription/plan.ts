import type { Subscription } from "@prisma/client";

export type EffectivePlan = "GRATUIT" | "STANDARD" | "PREMIUM";

const ACTIVE_STATUSES = new Set(["ACTIVE", "PAST_DUE"]);

// Le palier Gratuit n'a pas de ligne Subscription : dès qu'il n'y a pas
// d'abonnement Stripe actif, l'utilisateur est considéré Gratuit.
export function getEffectivePlan(subscription?: Subscription | null): EffectivePlan {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "GRATUIT";
  return subscription.plan;
}

// STANDARD (renommé "Premium" côté affichage) reste le seul abonnement
// auto-souscriptible depuis /pricing. PREMIUM ("VIP" à la séance depuis ce
// renommage) n'est plus vendu comme abonnement — ce label ne concerne que
// d'éventuels abonnés déjà sur l'ancienne offre.
export const PLAN_LABELS: Record<EffectivePlan, string> = {
  GRATUIT: "Gratuit",
  STANDARD: "Premium — 49€/mois",
  PREMIUM: "Ancien Premium — 199€/mois",
};
