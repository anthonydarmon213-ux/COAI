CREATE TYPE "SeanceSource" AS ENUM ('LIBRE', 'REPCOUNT', 'PROGRAMME');

ALTER TABLE "seances_log"
ADD COLUMN "source" "SeanceSource" NOT NULL DEFAULT 'LIBRE';

-- Les séances guidées historiques portent déjà ce préfixe stable.
UPDATE "seances_log"
SET "source" = 'PROGRAMME'
WHERE "notes" LIKE 'Séance guidée :%';

CREATE INDEX "seances_log_userId_source_idx" ON "seances_log"("userId", "source");
