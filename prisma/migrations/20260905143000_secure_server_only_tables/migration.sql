-- Ces tables sont accessibles exclusivement via les routes serveur Prisma.
-- Elles ne doivent pas être exposées aux rôles de la Data API Supabase.
ALTER TABLE public.form_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programme_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.form_checks FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.programme_purchases FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.routines FROM anon, authenticated;
