-- Phase 6.1 — Daily COAI. Migration additive : aucune donnée existante
-- n'est renommée, supprimée ou réécrite.
DO $$ BEGIN
  CREATE TYPE "DailySleep" AS ENUM ('TRES_MAUVAIS', 'MAUVAIS', 'CORRECT', 'BON', 'EXCELLENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "DailyEnergy" AS ENUM ('TRES_BASSE', 'BASSE', 'NORMALE', 'HAUTE', 'TRES_HAUTE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "DailyWorkoutRating" AS ENUM ('TROP_FACILE', 'BIEN_DOSEE', 'TROP_DURE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "daily_sessions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "programmeSourceId" TEXT,
  "programmeVersion" INTEGER,
  "sourceSession" JSONB,
  "adaptedSession" JSONB,
  "adaptation" JSONB,
  "sleep" "DailySleep",
  "energy" "DailyEnergy",
  "pain" BOOLEAN,
  "painArea" TEXT,
  "availableMinutes" INTEGER,
  "completedAt" TIMESTAMP(3),
  "workoutRating" "DailyWorkoutRating",
  "feedbackPain" BOOLEAN,
  "feedbackComment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "daily_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "daily_sessions_userId_date_key" ON "daily_sessions"("userId", "date");
CREATE INDEX IF NOT EXISTS "daily_sessions_userId_date_idx" ON "daily_sessions"("userId", "date");
DO $$ BEGIN
  ALTER TABLE "daily_sessions" ADD CONSTRAINT "daily_sessions_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- L'application accède à cette table uniquement via Prisma côté serveur.
-- RLS reste une défense supplémentaire si la table est exposée par erreur.
ALTER TABLE "daily_sessions" ENABLE ROW LEVEL SECURITY;
