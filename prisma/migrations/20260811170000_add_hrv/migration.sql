-- Phase 3 (11/08/2026) : HRV (variabilité de fréquence cardiaque), signal
-- de récupération le plus direct parmi les wearables courants.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "hrv" DOUBLE PRECISION;
