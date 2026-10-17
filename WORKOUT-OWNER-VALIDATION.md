# Protection des brouillons de séance — 15 octobre 2026

Périmètre : refuser avec 409 une sauvegarde dont l'en-tête natif
`X-COAI-Expected-Owner` diffère du membre applicatif authentifié.
Ce contrôle intervient avant toute transaction. Les clients web sans cet
en-tête conservent leur fonctionnement. Aucun tarif, migration ou média modifié.

Tests sur cette branche isolée depuis la base de production 9b70e3e :
- `node scripts/test-workout-owner.cjs` : mauvais propriétaire et valeur vide
  refusés sans écriture ; propriétaire correct et ancien client autorisés ;
  requête anonyme refusée. Services simulés dans ce test.
- `npx tsc --noEmit`, `npx next lint`, `npx next build` : réussis avec
  configuration locale factice, aucune clé de production.
- Audit d'existence des médias et `git diff --check` : réussis.

Le même contrôle a aussi passé un test HTTP/Auth/Postgres réel dans la branche
d'intégration locale : deux comptes fictifs, refus du mauvais compte,
six tentatives concurrentes et une seule séance enregistrée. Cette preuve
ne remplace pas un contrôle de production après un déploiement autorisé.

Cette PR reste brouillon : aucun merge, déploiement ou test de production.
