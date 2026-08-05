-- Ajoute l'âge et remplace le texte libre "entrainementActuel" par un champ
-- structuré "frequenceEntrainement" (RENAME préserve les données existantes).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "age" INTEGER;

ALTER TABLE "profiles" RENAME COLUMN "entrainementActuel" TO "frequenceEntrainement";
