-- Champ sexe optionnel sur le profil, utilisé pour personnaliser la
-- génération de programme (en plus de l'âge et de la fréquence
-- d'entraînement déjà collectés). Idempotent : sûr à rejouer.
ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "sexe" TEXT;
