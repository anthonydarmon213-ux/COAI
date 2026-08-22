import type { Subscription } from "@prisma/client";

export type EffectivePlan = "GRATUIT" | "STANDARD" | "PREMIUM";

const ACTIVE_STATUSES = new Set(["ACTIVE", "PAST_DUE"]);

// Sans abonnement actif, l'utilisateur retombe sur "GRATUIT" par défaut.
export function getEffectivePlan(subscription?: Subscription | null): EffectivePlan {
  if (!subscription || !ACTIVE_STATUSES.has(subscription.status)) return "GRATUIT";
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
// Stripe réel, actif (ou en retard de paiement, encore toléré) — y compris
// pendant l'essai offert (11/08/2026 : l'essai doit donner un accès réel,
// immédiat, pas un accès différé à la fin des 7 jours). Contrairement à
// getEffectivePlan (qui retombe volontairement sur "GRATUIT" en l'absence
// d'abonnement — utile pour l'UI juste après l'inscription, avant que le
// webhook Stripe n'ait tourné), cette fonction ne doit JAMAIS autoriser
// l'absence totale d'abonnement : sans elle, quelqu'un qui abandonne la
// page de paiement Stripe (jamais de CB saisie, jamais d'essai démarré)
// se retrouvait traité comme "GRATUIT" par défaut et pouvait générer un
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

// Le suivi est disponible avec tout abonnement actif.
export function hasSuiviAccess(subscription?: Subscription | null): boolean {
  return Boolean(subscription && ACTIVE_STATUSES.has(subscription.status));
}

// Noms marketing (08/08/2026) : GRATUIT = "Pass IA", STANDARD = "Coaching Hybride"
// — les identifiants techniques historiques sont conservés pour compatibilité.
export const PLAN_LABELS: Record<EffectivePlan, string> = {
  GRATUIT: "Pass IA — 49€/an (soit 4,08€/mois)",
  STANDARD: "Coaching Hybride — 89€/mois",
  PREMIUM: "VIP — à partir de 199€/mois",
};
