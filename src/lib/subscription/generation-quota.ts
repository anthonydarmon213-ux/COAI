import type { PlanCode } from "@/lib/pricing/tiers";

// Quota de génération de programme (24/08/2026, demande Anthony : "ce n'est
// pas rentable").
//
// Une génération complète déclenche environ 21 appels IA : pour chacun des
// 3 piliers, une requête de structure puis une requête par jour — la
// nutrition à elle seule en fait 8. Sans plafond, un abonné qui régénère en
// boucle coûte plus cher que son abonnement, en particulier sur Pass IA
// (49 €/an, soit ~4 €/mois).
//
// Les plafonds sont volontairement larges : le but est d'arrêter l'abus, pas
// de brider l'usage normal. Une personne qui régénère plus de deux fois par
// mois ne cherche généralement plus un programme adapté — elle teste
// l'outil, ce qui est légitime mais ne doit pas être illimité.
export const GENERATION_QUOTA_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export const GENERATION_QUOTA_PAR_PLAN: Record<PlanCode, number> = {
  PASS_IA: 2, // Pass IA — ~4 €/mois
  STANDARD: 6, // Coaching Hybride — 89 €/mois
  PREMIUM: 15, // Coaching VIP (plan historique, plus vendu en ligne)
};

export function getGenerationQuotaState(
  plan: PlanCode,
  used: number,
  resetAt: Date | null
) {
  const limite = GENERATION_QUOTA_PAR_PLAN[plan];
  const expire = !resetAt || Date.now() - resetAt.getTime() >= GENERATION_QUOTA_WINDOW_MS;
  const utilise = expire ? 0 : used;
  const restant = Math.max(0, limite - utilise);

  // Date de réouverture, pour dire quand plutôt qu'un simple "réessaie
  // plus tard" — un plafond sans horizon est vécu comme une panne.
  const prochainReset =
    !expire && resetAt ? new Date(resetAt.getTime() + GENERATION_QUOTA_WINDOW_MS) : null;

  return { limite, utilise, restant, expire, epuise: restant === 0, prochainReset };
}
