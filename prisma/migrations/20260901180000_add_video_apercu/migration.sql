-- Aperçu offert des vidéos exclusives.
-- Additive : colonnes NULLABLE, les vidéos existantes restent valides et
-- continuent de n'être visibles que par les abonnés.
ALTER TABLE "videos" ADD COLUMN "youtubeIdApercu" TEXT;
ALTER TABLE "videos" ADD COLUMN "dureeMinutes" INTEGER;
ALTER TABLE "videos" ADD COLUMN "apercuMinutes" INTEGER;
