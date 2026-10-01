-- Local preparation; explicit approval required before production migration.
-- Timestamp allocated by Supabase CLI; application history remains Prisma.
BEGIN;
ALTER TABLE public.photo_uploads
  ADD COLUMN "retiredAvatarOwner" TEXT,
  ADD COLUMN "retirementRetryAt" TIMESTAMPTZ;

-- Recover routing only for a positively matched existing application user.
-- If an older task has no match, the constraint below deliberately fails;
-- investigate that task instead of dropping it or guessing an owner.
UPDATE public.photo_uploads p SET "retiredAvatarOwner"=u."supabaseAuthId"
FROM public.users u
WHERE p."retiredAvatarName" IS NOT NULL
  AND p."ownerKey"=encode(sha256(convert_to('coai-photo-owner-v1:' || u."supabaseAuthId", 'UTF8')), 'hex');

ALTER TABLE public.photo_uploads ADD CONSTRAINT photo_retirement_routing_check CHECK (
  ("retiredAvatarName" IS NULL AND "retiredAvatarOwner" IS NULL AND "retirementRetryAt" IS NULL)
  OR ("retiredAvatarName" IS NOT NULL AND "retiredAvatarOwner" IS NOT NULL AND "avatarCommitted" AND settled)
);
CREATE INDEX photo_retirement_retry_idx ON public.photo_uploads ("retirementRetryAt" ASC NULLS FIRST, id)
  WHERE "retiredAvatarName" IS NOT NULL;
COMMIT;
