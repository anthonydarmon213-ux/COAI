-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "tailleCm" DOUBLE PRECISION;
ALTER TABLE "profiles" ADD COLUMN "morphologie" TEXT;
ALTER TABLE "profiles" ADD COLUMN "entrainementActuel" TEXT;
ALTER TABLE "profiles" ADD COLUMN "habitudesAlimentaires" TEXT;
ALTER TABLE "profiles" ADD COLUMN "consommationCafe" TEXT;
ALTER TABLE "profiles" ADD COLUMN "consommationAlcool" TEXT;
ALTER TABLE "profiles" ADD COLUMN "qualiteSommeil" TEXT;

-- AlterTable
ALTER TABLE "mesures" ADD COLUMN "masseGrassePourcent" DOUBLE PRECISION;
ALTER TABLE "mesures" ADD COLUMN "masseMusculaireKg" DOUBLE PRECISION;
ALTER TABLE "mesures" ADD COLUMN "frequenceCardiaqueReposBpm" INTEGER;
