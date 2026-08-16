-- Additive : nouvelle colonne nullable, aucune donnée existante impactée.
ALTER TABLE "diagnostic_leads" ADD COLUMN "telephone" TEXT;
