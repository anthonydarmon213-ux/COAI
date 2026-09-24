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
  | "insight_viewed"
  | "neat_explanation_opened"
  | "neat_first_log"
  | "neat_log_recorded"
  | "neat_recommendation_shown"
  | "neat_goal_accepted"
  | "first_workout_completed"
  | "repcount_saved"
  | "diagnostic_email_sent"
  | "muscle_recovery_logged";

// userId nullable (Phase 5.1, 11/08/2026) : diagnostic_email_sent se produit
// avant toute création de compte (lead anonyme, identifié par email seul).
export function trackServerEvent(
  name: ProductEventName,
  userId: string | null,
  meta?: Record<string, unknown>
): void {
  // Logs are not the coaching database. Never copy free text, health signals,
  // travel dates or nested objects into the hosting provider's logs.
  const details: Record<string, string | boolean | null> = { userId };
  if (typeof meta?.first === "boolean") details.first = meta.first;
  if (typeof meta?.pilier === "string" && ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"].includes(meta.pilier)) {
    details.pilier = meta.pilier;
  }
  if (typeof meta?.source === "string" && ["SAISIE_MANUELLE", "MONTRE", "APPLICATION_SANTE"].includes(meta.source)) {
    details.source = meta.source;
  }
  console.log(`[product-event] ${name}`, details);
}
