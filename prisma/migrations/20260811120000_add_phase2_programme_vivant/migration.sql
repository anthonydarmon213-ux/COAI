-- Phase 2 "rendre COAI vivant et intelligent" (11/08/2026) : durée de
-- séance (pour "Durée moyenne"), mode voyage/adaptations temporaires,
-- contexte extensible sur les adaptations.

ALTER TABLE "seances_log" ADD COLUMN IF NOT EXISTS "dureeMinutes" INTEGER;

ALTER TABLE "programmes_generated" ADD COLUMN IF NOT EXISTS "temporaire" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "programmes_generated" ADD COLUMN IF NOT EXISTS "finPrevue" TIMESTAMP(3);

ALTER TABLE "programme_adaptations" ADD COLUMN IF NOT EXISTS "contexte" JSONB;
