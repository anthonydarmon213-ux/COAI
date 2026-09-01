-- Routines : modèles de séance réutilisables.
-- Migration purement additive : aucune table ni colonne existante n'est
-- touchée, donc aucun risque pour les données déjà en production.
CREATE TABLE "routines" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "exercices" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "routines_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "routines_userId_nom_idx" ON "routines"("userId", "nom");

ALTER TABLE "routines"
  ADD CONSTRAINT "routines_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
