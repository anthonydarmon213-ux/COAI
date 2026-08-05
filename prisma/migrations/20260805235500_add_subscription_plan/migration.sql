-- Ajoute le palier d'abonnement (STANDARD 49€ / PREMIUM 199€) sur subscriptions.
-- Idempotent : sûr à rejouer.
DO $$ BEGIN
  CREATE TYPE "SubscriptionPlan" AS ENUM ('STANDARD', 'PREMIUM');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "subscriptions"
  ADD COLUMN IF NOT EXISTS "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STANDARD';
