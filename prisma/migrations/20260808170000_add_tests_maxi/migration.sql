DO $$ BEGIN
  CREATE TYPE "ExerciceMaxi" AS ENUM ('DEVELOPPE_COUCHE', 'SQUAT', 'SOULEVE_DE_TERRE', 'TRACTION');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "tests_maxi" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "exercice" "ExerciceMaxi" NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "valeur" DOUBLE PRECISION NOT NULL,
  "unite" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tests_maxi_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  ALTER TABLE "tests_maxi" ADD CONSTRAINT "tests_maxi_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
