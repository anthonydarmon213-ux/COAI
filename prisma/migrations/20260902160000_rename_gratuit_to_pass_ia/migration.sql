-- Le plan s'appelait GRATUIT alors qu'il est facturé 19,99 €/mois : à la
-- lecture des données, il se confondait avec un compte sans abonnement.
--
-- RENAME VALUE renomme l'étiquette de l'enum sur place : les lignes déjà
-- enregistrées suivent automatiquement, aucune donnée n'est réécrite ni
-- perdue. C'est l'inverse d'un DROP + CREATE, qui aurait exigé de migrer
-- chaque abonnement à la main.
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'GRATUIT' TO 'PASS_IA';
