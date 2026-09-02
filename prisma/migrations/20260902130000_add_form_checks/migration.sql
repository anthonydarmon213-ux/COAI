-- Correction de mouvement : le membre envoie une vidéo de sa série, Anthony
-- répond par un ajustement écrit.
-- Migration purement additive : aucune table ni colonne existante n'est
-- touchée, donc aucun risque pour les données déjà en production.
CREATE TYPE "StatutFormCheck" AS ENUM ('EN_ATTENTE', 'REPONDU');

CREATE TABLE "form_checks" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "exercice" TEXT NOT NULL,
  "videoPath" TEXT NOT NULL,
  "question" TEXT,
  "statut" "StatutFormCheck" NOT NULL DEFAULT 'EN_ATTENTE',
  "reponse" TEXT,
  "repondueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "form_checks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "form_checks_statut_createdAt_idx" ON "form_checks"("statut", "createdAt");
CREATE INDEX "form_checks_userId_createdAt_idx" ON "form_checks"("userId", "createdAt");

ALTER TABLE "form_checks"
  ADD CONSTRAINT "form_checks_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
