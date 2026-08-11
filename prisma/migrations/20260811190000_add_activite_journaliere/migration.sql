-- Phase 3, bloc NEAT (11/08/2026) : activité quotidienne hors séances
-- (marche, déplacements, escaliers, temps debout). Une entrée par jour et
-- par utilisateur, jamais écrasée pour les jours passés.

DO $$ BEGIN
  CREATE TYPE "SourceActivite" AS ENUM ('SAISIE_MANUELLE', 'MONTRE', 'APPLICATION_SANTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeJournee" AS ENUM ('TRAVAIL', 'REPOS', 'VOYAGE', 'WEEKEND');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "TypeTravail" AS ENUM ('ASSIS', 'MIXTE', 'DEBOUT', 'PHYSIQUE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "activite_journaliere" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "pas" INTEGER,
  "source" "SourceActivite" NOT NULL DEFAULT 'SAISIE_MANUELLE',
  "typeJournee" "TypeJournee",
  "typeTravail" "TypeTravail",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "activite_journaliere_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "activite_journaliere" ADD CONSTRAINT "activite_journaliere_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "activite_journaliere_userId_date_key"
  ON "activite_journaliere"("userId", "date");

CREATE INDEX IF NOT EXISTS "activite_journaliere_userId_date_idx"
  ON "activite_journaliere"("userId", "date");
