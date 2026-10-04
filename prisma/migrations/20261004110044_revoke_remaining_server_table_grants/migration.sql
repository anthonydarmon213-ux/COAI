-- Prepared locally, not authorization to migrate production.
-- These server-only tables already have RLS. Remove unnecessary client grants,
-- including TRUNCATE (not governed by row policies). Keep server owner access.
REVOKE ALL PRIVILEGES ON TABLE
  public.ai_usage_events,
  public.billing_events,
  public.churn_feedback,
  public.coach_notes,
  public.daily_sessions,
  public.recuperations_musculaires,
  public.stripe_webhook_events
FROM PUBLIC, anon, authenticated;
