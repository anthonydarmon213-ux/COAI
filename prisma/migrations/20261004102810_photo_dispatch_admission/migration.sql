-- Local preparation only; production requires explicit migration approval.
-- Timestamp allocated by Supabase CLI migration new photo_dispatch_admission.
-- Existing/old-writer reservations are uncertain and MUST retain the barrier.
-- Only new code explicitly inserts false and claims dispatch before Storage I/O.
BEGIN;
ALTER TABLE public.photo_uploads
  ADD COLUMN "dispatchStarted" BOOLEAN NOT NULL DEFAULT true;
COMMIT;
