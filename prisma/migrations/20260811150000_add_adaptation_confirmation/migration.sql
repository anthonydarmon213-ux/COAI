-- Point 10 de la Phase 2 (11/08/2026) : geste explicite "Accepter" / "Garder
-- mon programme actuel" AVANT que l'adaptation ne soit réellement
-- appliquée, au lieu d'une application immédiate systématique.

ALTER TYPE "StatutAdaptation" ADD VALUE IF NOT EXISTS 'PROPOSEE';
ALTER TYPE "StatutAdaptation" ADD VALUE IF NOT EXISTS 'REJETEE';
