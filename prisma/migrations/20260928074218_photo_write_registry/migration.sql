-- Prepared locally only. Requires explicit production migration approval.
-- Timestamp allocated by `supabase migration new photo_write_registry`.
-- Managed in Prisma like the existing application migrations, not Supabase's
-- independent history. Never deploy writers before these tables are present.
BEGIN;
CREATE TABLE public.photo_owner_gates (
  "ownerKey" TEXT PRIMARY KEY,
  closed BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE public.photo_uploads (
  id TEXT PRIMARY KEY,
  "ownerKey" TEXT NOT NULL REFERENCES public.photo_owner_gates("ownerKey"),
  settled BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX photo_uploads_owner_pending_idx ON public.photo_uploads ("ownerKey", settled);
ALTER TABLE public.photo_owner_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_uploads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.photo_owner_gates, public.photo_uploads FROM PUBLIC, anon, authenticated;
COMMIT;
