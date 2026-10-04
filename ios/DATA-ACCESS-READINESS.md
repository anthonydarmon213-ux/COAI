# Accès directs aux données — 4 octobre 2026

## Corrigé et testé localement, non déployé

Le conseiller de sécurité puis une lecture des permissions PostgreSQL ont
identifié 17 anciennes tables sans RLS et avec droits `anon` / `authenticated`
dans la base locale de test. Une requête HTTP HEAD anonyme a reproduit un 200
au lieu du refus attendu, sans extraire de données utilisateur.

La migration préparée `20261004104308_secure_legacy_server_tables` active RLS
et retire les droits `PUBLIC`, `anon`, `authenticated` sur une liste explicite :

- `_prisma_migrations`, `users`, `profiles`, `subscriptions` ;
- `activite_journaliere`, `mesures`, `seances_log`, `repas_log`, `tests_maxi` ;
- `programmes_generated`, `programme_adaptations`, `weekly_checkins` ;
- `avis`, `diagnostic_leads`, `founder_waitlist_entries`, `videos`, `whatsapp_events`.

Ces tables passent par les routes serveur Prisma dans le code inspecté ; aucun
accès client Data API n'est nécessaire à ces parcours. Aucune politique permissive
ajoutée, aucun rôle privilégié accordé, aucune table Auth/Storage modifiée.
Le propriétaire serveur conserve son accès ; RLS n'est pas forcée sur celui-ci.

## Preuves

- `scripts/test-server-table-security-local.cjs` : Auth et PostgREST locaux réels,
  un compte jetable. Pour les deux rôles, lectures HTTP des 17 tables refusées,
  sept privilèges de table contrôlés et absence de droits par colonne vérifiée.
- Sur `users`, SELECT / INSERT / UPDATE / DELETE directs refusés avec `42501`.
  L'export du même compte par la route serveur authentifiée reste HTTP 200.
  Le compte et l'identité Auth de test sont supprimés à la fin.
- Après durcissement, routes HTTP avatar/suivi et suppression de compte testées :
  conservation de l'image précédente, mesure enregistrée sans doublon,
  suppression paginée de 102 objets, ancien accès refusé et voisin préservé.
- Conseiller sécurité local : aucun résultat warning/error après correction.

## Avant production

- Inspecter en lecture seule les droits/politiques réellement distants : ce
  constat local ne prouve ni exposition ni protection des données en production.
- Confirmer le rôle PostgreSQL utilisé par l'application et toute intégration
  externe qui pourrait dépendre d'un accès direct à ces tables.
- Autorisation explicite pour appliquer la migration distante, puis tests de
  régression des parcours réels. Aucun déploiement effectué ici.
- Cet audit ciblé ne couvre pas toutes les vues, fonctions privilégiées, buckets,
  sauvegardes ou politiques de conservation ; la sécurité globale reste ouverte.
