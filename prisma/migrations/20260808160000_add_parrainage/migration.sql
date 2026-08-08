ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "codeParrainage" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "parraineParId" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "recompenseParrainageAppliquee" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS "users_codeParrainage_key" ON "users"("codeParrainage");

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_parraineParId_fkey"
    FOREIGN KEY ("parraineParId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
