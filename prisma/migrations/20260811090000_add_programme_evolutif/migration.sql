-- Vision "programme évolutif" (11/08/2026) : check-in post-séance structuré,
-- check-in hebdomadaire, versionnage explicite des programmes, et
-- traçabilité de chaque adaptation avec sa raison.

-- Check-in post-séance structuré sur seances_log (champs additifs, la
-- colonne "ressenti" existante n'est pas touchée).
DO $$ BEGIN
  CREATE TYPE "NiveauDouleur" AS ENUM ('AUCUNE', 'LEGERE', 'IMPORTANTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "seances_log" ADD COLUMN IF NOT EXISTS "difficulte" INTEGER;
ALTER TABLE "seances_log" ADD COLUMN IF NOT EXISTS "energie" INTEGER;
ALTER TABLE "seances_log" ADD COLUMN IF NOT EXISTS "douleur" "NiveauDouleur";
ALTER TABLE "seances_log" ADD COLUMN IF NOT EXISTS "douleurZone" TEXT;

-- Version explicite sur les programmes générés (historique déjà implicite
-- via generatedAt, ce champ le rend affichable : V1, V2...).
ALTER TABLE "programmes_generated" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;

-- Check-in hebdomadaire.
DO $$ BEGIN
  CREATE TYPE "NiveauSommeil" AS ENUM ('TRES_MAUVAIS', 'MAUVAIS', 'CORRECT', 'BON', 'EXCELLENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "weekly_checkins" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "semaineDebut" DATE NOT NULL,
  "sommeil" "NiveauSommeil",
  "energie" INTEGER,
  "stress" INTEGER,
  "faim" INTEGER,
  "motivation" INTEGER,
  "poidsKg" DOUBLE PRECISION,
  "douleurs" BOOLEAN,
  "seancesRealisees" INTEGER,
  "commentaire" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "weekly_checkins_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "weekly_checkins" ADD CONSTRAINT "weekly_checkins_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "weekly_checkins_userId_semaineDebut_key"
  ON "weekly_checkins"("userId", "semaineDebut");

-- Historique des adaptations de programme (raison de chaque changement).
DO $$ BEGIN
  CREATE TYPE "DecisionAdaptation" AS ENUM ('GARDER', 'PROGRESSER', 'REDUIRE', 'MODIFIER', 'ADAPTER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "StatutAdaptation" AS ENUM ('APPLIQUEE', 'EN_ATTENTE', 'VALIDEE', 'MODIFIEE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "programme_adaptations" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "pilier" "Pilier" NOT NULL,
  "decision" "DecisionAdaptation" NOT NULL,
  "confiance" DOUBLE PRECISION,
  "changements" JSONB NOT NULL,
  "resume" TEXT NOT NULL,
  "programmePrecedentId" TEXT,
  "programmeSuivantId" TEXT,
  "statut" "StatutAdaptation" NOT NULL DEFAULT 'APPLIQUEE',
  "noteCoach" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "programme_adaptations_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "programme_adaptations" ADD CONSTRAINT "programme_adaptations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "programme_adaptations_userId_createdAt_idx"
  ON "programme_adaptations"("userId", "createdAt");
