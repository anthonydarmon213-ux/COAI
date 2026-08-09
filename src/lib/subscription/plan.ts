import type { Subscription } from "@prisma/client";

export type EffectivePlan = "GRATUIT" | "STANDARD" | "PREMIUM";

const ACTIVE_STATUSES = new Set(["ACTIVE", "PAST_DUE"]);

// Le palier Gratuit est désormais un vrai abonnement Stripe (7 jours offerts
// puis 19€/mois, carte obligatoire dès l'inscription). En l'absence de ligne
// Subscription (edge case : compte créé avant l'introduction de cette
// offre, ou juste après l'inscription avant que le webhook Stripe n'ait
// tourné), l'utilisateur est aussi considéré Gratuit par défaut.
export function getEffectivePlan(subscription?: Subscription | null): EffectivePlan {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "GRATUIT";
  return subscription.plan;
}

// Tant que l'essai Stripe (7 jours offerts, offre Impulsion) n'est pas
// terminé, aucun prélèvement n'a encore eu lieu — status reste "ACTIVE"
// pendant l'essai (trialing y est mappé), donc c'est trialEnd qui permet de
// distinguer "encore en essai, jamais payé" de "déjà facturé". Utilisé pour
// bloquer la génération de programme pendant l'essai (cf. 09/08/2026 :
// éviter de livrer un programme complet gratuitement à quelqu'un qui
// résilie avant le premier prélèvement).
export function isInTrial(subscription?: Subscription | null): boolean {
  if (!subscription || subscription.status !== "ACTIVE") return false;
  return Boolean(subscription.trialEnd && subscription.trialEnd > new Date());
}

// Noms marketing (08/08/2026) : GRATUIT = "Impulsion", STANDARD = "Transformation"
// — à ne pas confondre avec l'enum PREMIUM (199€, ancienne offre, "VIP" à la
// séance depuis ce renommage), qui n'est plus vendu comme abonnement — ce
// label ne concerne que d'éventuels abonnés déjà sur l'ancienne offre.
export const PLAN_LABELS: Record<EffectivePlan, string> = {
  GRATUIT: "Impulsion — 19€/mois après 7 jours offerts",
  STANDARD: "Transformation — 49€/mois",
  PREMIUM: "Ancien Premium — 199€/mois",
};
