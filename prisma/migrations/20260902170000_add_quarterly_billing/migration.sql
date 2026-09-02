-- Palier trimestriel : marche intermédiaire entre le mensuel et l'annuel,
-- pour les indécis que l'engagement d'un an bloque.
-- Ajout d'une valeur d'enum : purement additif, aucune ligne existante
-- n'est modifiée et les abonnements en cours restent MONTHLY ou ANNUAL.
ALTER TYPE "BillingInterval" ADD VALUE IF NOT EXISTS 'QUARTERLY';
