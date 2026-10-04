-- Réduit le droit destructif TRUNCATE sans modifier les autres privilèges.
-- Les tables sont servies par Prisma côté serveur ; aucune donnée n'est touchée.
REVOKE TRUNCATE ON TABLE
  public.activite_journaliere,
  public.ai_usage_events,
  public.avis,
  public.billing_events,
  public.churn_feedback,
  public.coach_notes,
  public.daily_sessions,
  public.diagnostic_leads,
  public.mesures,
  public.profiles,
  public.programme_adaptations,
  public.programmes_generated,
  public.recuperations_musculaires,
  public.repas_log,
  public.seances_log,
  public.stripe_webhook_events,
  public.subscriptions,
  public.tests_maxi,
  public.users,
  public.videos,
  public.weekly_checkins,
  public.whatsapp_events
FROM PUBLIC, anon, authenticated;
