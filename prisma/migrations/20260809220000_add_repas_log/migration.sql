DO $$ BEGIN
  CREATE TYPE "StatutRepas" AS ENUM ('COMME_PREVU', 'PETIT_ECART', 'GROS_ECART');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "repas_log" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "statut" "StatutRepas" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "repas_log_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "repas_log" ADD CONSTRAINT "repas_log_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
