import { trackEvent } from "@/lib/analytics";

// Vocabulaire unique du funnel d'acquisition (Phase 5B, 11/08/2026) — un seul
// endroit qui liste, dans l'ordre, les événements attendus pour pouvoir
// calculer plus tard les taux de passage d'une étape à l'autre (home →
// diagnostic → compte → pricing → checkout → abonnement → première séance).
// Envoie à GA4 (déjà en place, src/lib/analytics.ts) — pas de nouvelle
// dépendance analytics. Pas de dashboard de calcul ici (pas nécessaire pour
// l'instant) : juste s'assurer que chaque étape est bien instrumentée.
export type FunnelEventName =
  | "landing_viewed"
  | "diagnostic_started"
  | "diagnostic_step_completed"
  | "diagnostic_completed"
  | "diagnostic_result_viewed"
  | "programme_preview_viewed"
  | "signup_started"
  | "signup_completed"
  | "pricing_viewed"
  | "plan_selected"
  | "checkout_started"
  | "checkout_completed"
  | "first_programme_viewed"
  | "first_workout_started";

export function trackFunnelEvent(name: FunnelEventName, params?: Record<string, unknown>) {
  trackEvent(name, params);
}
