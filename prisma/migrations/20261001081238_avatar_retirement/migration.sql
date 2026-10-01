-- Local preparation only. Timestamp allocated by `supabase migration new`.
-- Apply through the application's Prisma history after explicit approval.
-- The existing table remains server-only (RLS and revoked client grants).
ALTER TABLE public.photo_uploads
  ADD COLUMN "avatarCommitted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "retiredAvatarName" TEXT;
