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
  | "landing_cta_clicked"
  | "diagnostic_started"
  | "diagnostic_step_completed"
  | "diagnostic_completed"
  | "diagnostic_reveal_started"
  | "diagnostic_result_viewed"
  | "diagnostic_lead_captured"
  | "programme_preview_viewed"
  | "signup_started"
  | "signup_completed"
  | "pricing_viewed"
  | "plan_selected"
  | "checkout_started"
  | "instagram_checkout_help_viewed"
  | "instagram_safari_link_copied"
  | "checkout_completed"
  | "first_programme_viewed"
  | "first_workout_started"
  | "progress_shared"
  | "referral_link_shared"
  | "diagnostic_result_shared";

export function trackFunnelEvent(name: FunnelEventName, params?: Record<string, unknown>) {
  trackEvent(name, params);
}
