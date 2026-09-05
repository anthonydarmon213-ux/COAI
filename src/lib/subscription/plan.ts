import type { Subscription } from "@prisma/client";

export type EffectivePlan = "PASS_IA" | "STANDARD" | "PREMIUM";

// Un paiement en retard n'ouvre plus les fonctions coûteuses : Stripe peut
// réactiver l'accès automatiquement dès que le webhook repasse à ACTIVE.
const ACTIVE_STATUSES = new Set(["ACTIVE"]);

/** Un accès facturé (ou en période d'essai) donne accès aux fonctions IA coûteuses. */
export function hasPaidSubscription(subscription?: Subscription | null): boolean {
  return Boolean(subscription && ACTIVE_STATUSES.has(subscription.status));
}

/** Noms produits courts, visibles dans l'app : Free / Premium / Elite. */
export function getMembershipLabel(subscription?: Subscription | null): string {
  if (!hasPaidSubscription(subscription)) return "COAI Free";
  return subscription?.plan === "PREMIUM" ? "COAI Elite" : "COAI Premium";
}

// Sans abonnement actif, l'utilisateur retombe sur "PASS_IA" par défaut.
export function getEffectivePlan(subscription?: Subscription | null): EffectivePlan {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "PASS_IA";
  return subscription.plan;
}

// Tant que l'essai Stripe (7 jours d'essai) n'est pas terminé, aucun
// prélèvement n'a encore eu lieu — status reste "ACTIVE" pendant l'essai
// (trialing y est mappé), donc c'est trialEnd qui permet de distinguer
// "encore en essai, jamais payé" de "déjà facturé". Purement informatif
// désormais (affichage de la date de fin d'essai sur compte/abonnement) —
// ne bloque plus la génération de programme (cf. correction du 11/08/2026 :
// l'essai doit donner un accès réel et immédiat à COAI, pas un accès
// différé à J+7).
export function isInTrial(subscription?: Subscription | null): boolean {
  if (!subscription || subscription.status !== "ACTIVE") return false;
  return Boolean(subscription.trialEnd && subscription.trialEnd > new Date());
}

// Autorise la génération de programme dès qu'il existe un abonnement
// Stripe réel et actif — y compris
// pendant l'essai offert (11/08/2026 : l'essai doit donner un accès réel,
// immédiat, pas un accès différé à la fin des 7 jours). Contrairement à
// getEffectivePlan (qui retombe volontairement sur "PASS_IA" en l'absence
// d'abonnement — utile pour l'UI juste après l'inscription, avant que le
// webhook Stripe n'ait tourné), cette fonction ne doit JAMAIS autoriser
// l'absence totale d'abonnement : sans elle, quelqu'un qui abandonne la
// page de paiement Stripe (jamais de CB saisie, jamais d'essai démarré)
// se retrouvait traité comme "PASS_IA" par défaut et pouvait générer un
// programme complet sans jamais avoir payé (09/08/2026).
export function canGenerateProgramme(subscription?: Subscription | null): boolean {
  if (!subscription) return false;
  return ACTIVE_STATUSES.has(subscription.status);
}

// L'accès historique programmeUnlockedAt reste reconnu pour ne pas retirer
// un achat déjà accordé. Toute nouvelle activation passe par un abonnement.
export function hasProgrammeAccess(
  user: { programmeUnlockedAt: Date | null },
  subscription?: Subscription | null
): boolean {
  if (user.programmeUnlockedAt) return true;
  return Boolean(subscription && ACTIVE_STATUSES.has(subscription.status));
}

// La boutique distingue l'accès historique à un programme de l'accès au
// catalogue complet : un achat à l'unité ou un ancien déblocage ne doit pas
// ouvrir tous les packs. Seul un abonnement actif (y compris l'essai) le fait.
export function hasCatalogueAccess(subscription?: Subscription | null): boolean {
  return Boolean(subscription && ACTIVE_STATUSES.has(subscription.status));
}

// Le suivi est disponible avec tout abonnement actif.
export function hasSuiviAccess(subscription?: Subscription | null): boolean {
  return Boolean(subscription && ACTIVE_STATUSES.has(subscription.status));
}

// Le streaming exclusif fait partie de l'écosystème COAI dès le Pass IA.
// L'ancien déblocage à vie reste reconnu comme pour les programmes.
export function hasStreamingAccess(
  user: { programmeUnlockedAt: Date | null },
  subscription?: Subscription | null
): boolean {
  return hasProgrammeAccess(user, subscription);
}

// Noms marketing (08/08/2026, MAJ 04/09/2026 — repositionnement 3 offres) :
// PASS_IA = "Standard IA", STANDARD = "Premium Remote", PREMIUM = "VIP
// Présentiel" — les identifiants techniques historiques sont conservés pour
// compatibilité (Prisma, Stripe). Prix STANDARD et PREMIUM corrigés au
// passage : ils affichaient encore l'ancien modèle par abonnement mensuel
// (99€/mois, 200€/séance) alors que ces deux offres sont depuis le
// 04/09/2026 vendues en pack 3 ou 6 mois payé en une fois — cf.
// src/lib/pricing/tiers.ts pour le détail complet.
export const PLAN_LABELS: Record<EffectivePlan, string> = {
  PASS_IA: "Standard IA — 19,99€/mois ou 119€/an",
  STANDARD: "Premium Remote — 960€/pack 3 mois minimum",
  PREMIUM: "VIP Présentiel — 1 200€/pack 3 mois minimum",
};
