-- AlterTable
-- Nullable pour préserver les inscriptions collectées avant l'ajout de ces champs.
ALTER TABLE "founder_waitlist_entries"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "profile" TEXT,
ADD COLUMN "objective" TEXT;
