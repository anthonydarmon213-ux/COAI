-- Suivi de récupération par groupe musculaire (19/08/2026). Migration
-- additive : aucune donnée existante n'est renommée, supprimée ou réécrite.
DO $$ BEGIN
  CREATE TYPE "GroupeMusculaire" AS ENUM ('DOS', 'PECTORAUX', 'EPAULES', 'BRAS', 'JAMBES', 'FESSIERS', 'ABDOMINAUX', 'MOLLETS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "NiveauRecuperationMuscle" AS ENUM ('COURBATURES_FORTES', 'COURBATURES_LEGERES', 'LEGERE_FATIGUE', 'FRAIS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "recuperations_musculaires" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "groupe" "GroupeMusculaire" NOT NULL,
  "niveau" "NiveauRecuperationMuscle" NOT NULL,
  "date" DATE NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "recuperations_musculaires_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recuperations_musculaires_userId_groupe_date_key" ON "recuperations_musculaires"("userId", "groupe", "date");
CREATE INDEX IF NOT EXISTS "recuperations_musculaires_userId_groupe_idx" ON "recuperations_musculaires"("userId", "groupe");
DO $$ BEGIN
  ALTER TABLE "recuperations_musculaires" ADD CONSTRAINT "recuperations_musculaires_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- L'application accède à cette table uniquement via Prisma côté serveur.
-- RLS reste une défense supplémentaire si la table est exposée par erreur.
ALTER TABLE "recuperations_musculaires" ENABLE ROW LEVEL SECURITY;
