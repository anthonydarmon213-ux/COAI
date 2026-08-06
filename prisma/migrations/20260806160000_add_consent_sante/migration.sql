-- Horodatage de la certification santé recueillie à l'inscription.
-- Idempotent : sûr à rejouer.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "consentSanteAt" TIMESTAMP(3);
