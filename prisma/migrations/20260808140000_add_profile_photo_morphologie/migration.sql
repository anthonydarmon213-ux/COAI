ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "morphologieDetectee" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "observationsPosture" TEXT;
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "derniereAnalysePhoto" TIMESTAMP(3);
