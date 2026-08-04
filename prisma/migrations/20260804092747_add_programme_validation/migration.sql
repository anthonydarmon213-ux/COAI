-- AlterTable
ALTER TABLE "users" ADD COLUMN "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum
CREATE TYPE "StatutProgramme" AS ENUM ('EN_ATTENTE', 'VALIDE');

-- AlterTable
ALTER TABLE "programmes_generated" ADD COLUMN "statut" "StatutProgramme" NOT NULL DEFAULT 'EN_ATTENTE';
ALTER TABLE "programmes_generated" ADD COLUMN "valideAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "programmes_generated_statut_generatedAt_idx" ON "programmes_generated"("statut", "generatedAt");
