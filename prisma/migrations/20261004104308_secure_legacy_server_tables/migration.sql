-- Prepared/tested locally only. Explicit authorization required in production.
-- Timestamp allocated by Supabase CLI migration new secure_legacy_server_tables.
-- These Prisma tables are reached through authenticated server routes, NOT the
-- client Data API. Keep server owner/service-role access; grant no client policy.
-- Explicit allowlist: do not modify Auth/Storage or unrelated/new application tables.
DO $migration$
DECLARE
  target_table TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    '_prisma_migrations', 'activite_journaliere', 'avis', 'diagnostic_leads',
    'founder_waitlist_entries', 'mesures', 'profiles', 'programme_adaptations',
    'programmes_generated', 'repas_log', 'seances_log', 'subscriptions',
    'tests_maxi', 'users', 'videos', 'weekly_checkins', 'whatsapp_events'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target_table);
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM PUBLIC, anon, authenticated', target_table);
  END LOOP;
END
$migration$;
