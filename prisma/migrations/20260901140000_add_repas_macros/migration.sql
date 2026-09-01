-- Compteur de calories : macros facultatifs sur le journal de repas.
-- Additive et sans risque : colonnes NULLABLE, aucune valeur par défaut à
-- rétro-appliquer, les entrées existantes restent valides telles quelles.
ALTER TABLE "repas_log" ADD COLUMN "libelle" TEXT;
ALTER TABLE "repas_log" ADD COLUMN "calories" INTEGER;
ALTER TABLE "repas_log" ADD COLUMN "proteines" INTEGER;
ALTER TABLE "repas_log" ADD COLUMN "glucides" INTEGER;
ALTER TABLE "repas_log" ADD COLUMN "lipides" INTEGER;

CREATE INDEX "repas_log_userId_date_idx" ON "repas_log"("userId", "date");
