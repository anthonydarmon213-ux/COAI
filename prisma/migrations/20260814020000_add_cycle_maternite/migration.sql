-- Additive : nouvelles colonnes nullables, aucune donnée existante impactée.
CREATE TYPE "StatutMaternite" AS ENUM ('ENCEINTE', 'POST_PARTUM');

ALTER TABLE "profiles" ADD COLUMN "cycleMenstruelSuivi" BOOLEAN;
ALTER TABLE "profiles" ADD COLUMN "dateDernieresRegles" TIMESTAMP(3);
ALTER TABLE "profiles" ADD COLUMN "dureeCycleJours" INTEGER;
ALTER TABLE "profiles" ADD COLUMN "reglesDouloureuses" BOOLEAN;
ALTER TABLE "profiles" ADD COLUMN "statutMaternite" "StatutMaternite";
ALTER TABLE "profiles" ADD COLUMN "dateReferenceMaternite" TIMESTAMP(3);
