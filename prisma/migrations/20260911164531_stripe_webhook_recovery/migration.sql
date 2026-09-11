-- Additive rollout: old deployments and historical rows remain LEGACY.
-- LEGACY is deliberately not automatically replayed: effects may already exist.
BEGIN;
SET LOCAL lock_timeout = '5s';
ALTER TABLE public.stripe_webhook_events
  ADD COLUMN "state" TEXT NOT NULL DEFAULT 'LEGACY',
  ADD COLUMN "leaseToken" TEXT,
  ADD COLUMN "leaseUntil" TIMESTAMPTZ,
  ADD COLUMN "completedAt" TIMESTAMPTZ,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.stripe_webhook_events ADD CONSTRAINT stripe_webhook_state_check
  CHECK (state IN ('LEGACY', 'PROCESSING', 'FAILED', 'COMPLETED'));
CREATE INDEX stripe_webhook_recovery_idx ON public.stripe_webhook_events (state, "leaseUntil");
COMMIT;
