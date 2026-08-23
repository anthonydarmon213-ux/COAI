-- Quota de génération de programme (24/08/2026, demande Anthony : "ce n'est
-- pas rentable"). Une génération complète déclenche ~21 appels IA (structure
-- + un appel par jour, sur les 3 piliers) : sans plafond, un abonné qui
-- régénère en boucle coûte plus cher que son abonnement.
--
-- Même mécanique que le quota Coach IA déjà en place : fenêtre glissante
-- depuis la date de reset, pas un calendrier fixe.
ALTER TABLE "users" ADD COLUMN "generationsUsed" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "generationsResetAt" TIMESTAMP(3);
