-- Phase 5 (11/08/2026) : lieu d'entraînement (distinct de l'équipement) et
-- durée de séance visée, désormais collectés dans le diagnostic public et
-- le profil abonné. Additive, idempotente.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "lieuEntrainement" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "dureeSeanceMinutes" INTEGER;
