// Architecture minimale pour les événements produit internes (Phase 2,
// 11/08/2026) — pas de nouvelle dépendance analytics : pour l'instant ça se
// contente de logger côté serveur (visible dans les logs Vercel), prêt à
// être branché sur un vrai système (PostHog, Amplitude...) plus tard sans
// toucher aux appelants. GA4/Meta Pixel (src/lib/analytics.ts) restent
// séparés : ceux-là sont pour l'acquisition/marketing, celui-ci pour
// comprendre l'usage du produit une fois inscrit.
export type ProductEventName =
  | "onboarding_completed"
  | "workout_started"
  | "workout_completed"
  | "workout_checkin_completed"
  | "weekly_checkin_completed"
  | "adaptation_proposed"
  | "adaptation_accepted"
  | "adaptation_rejected"
  | "travel_mode_started"
  | "travel_mode_finished"
  | "insight_viewed";

export function trackServerEvent(
  name: ProductEventName,
  userId: string,
  meta?: Record<string, unknown>
): void {
  console.log(`[product-event] ${name}`, { userId, ...meta });
}
