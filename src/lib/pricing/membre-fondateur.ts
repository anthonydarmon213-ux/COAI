import { prisma } from "@/lib/db/client";
import { MEMBRES_FONDATEURS_MAX } from "@/lib/pricing/membre-fondateur-constants";

// Offre "membre fondateur" (19/08/2026, demande Anthony — obtenir les tout
// premiers abonnés et retours terrain) : 49€/mois bloqué à vie sur
// Impulsion pour les 100 premiers abonnés. Le prix Impulsion est déjà
// 49€/mois aujourd'hui (rien à changer côté Stripe) — Stripe garantit déjà
// nativement qu'un abonné existant garde le prix auquel il a souscrit tant
// qu'Anthony augmente les tarifs futurs en créant un nouveau Price Stripe
// plutôt qu'en modifiant celui-ci (impossible de toute façon : un Price
// Stripe est immuable). Ce module ne fait donc qu'un comptage réel — jamais
// un chiffre inventé pour créer une fausse urgence.
export { MEMBRES_FONDATEURS_MAX };

export async function placesFondateursRestantes(): Promise<number> {
  const count = await prisma.subscription.count({ where: { plan: "GRATUIT" } });
  return Math.max(0, MEMBRES_FONDATEURS_MAX - count);
}
