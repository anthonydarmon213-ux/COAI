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

Complément local du 4 octobre : `20261004110044_revoke_remaining_server_table_grants`
retire les droits clients sur sept tables déjà protégées par RLS :
`ai_usage_events`, `billing_events`, `churn_feedback`, `coach_notes`,
`daily_sessions`, `recuperations_musculaires`, `stripe_webhook_events`.
Le test couvre désormais 24 tables et réussit. Aucun changement distant.

Régression HTTP complète rejouée après ce complément : export, séances,
mesures, bilan hebdomadaire, profil, médias historiques et deux PDF,
cycle quotidien et carte mensuelle PNG, activation concurrente du programme,
trois pages piliers, échec de suppression pendant une panne Storage : PASS.
Les fixtures terminent maintenant leur inscription via `/api/compte/register`
avec consentements explicites fictifs ; le tableau de bord est vérifié sans
suivre silencieusement une redirection. Mode `--native-origin` pour les cookies
du serveur QA compilé avec Auth localhost. Nettoyage des fixtures et remise
en service du seul conteneur Storage local confirmés.

- `scripts/test-server-table-security-local.cjs` : Auth et PostgREST locaux réels,
  un compte jetable. Pour les deux rôles, lectures HTTP des 24 tables refusées,
  sept privilèges de table contrôlés et absence de droits par colonne vérifiée.
- Sur `users`, SELECT / INSERT / UPDATE / DELETE directs refusés avec `42501`.
  L'export du même compte par la route serveur authentifiée reste HTTP 200.
  Le compte et l'identité Auth de test sont supprimés à la fin.
- Après durcissement, routes HTTP avatar/suivi et suppression de compte testées :
  conservation de l'image précédente, mesure enregistrée sans doublon,
  suppression paginée de 102 objets, ancien accès refusé et voisin préservé.
- Conseiller sécurité local : aucun résultat warning/error après correction.

## Avant production

- Inspection distante en lecture seule effectuée le 4 octobre à 14 h 50,
  projet COAI `fczkfddfgooocqqkqsqw`, région eu-west-1, PostgreSQL 17.6.1.155 :
  29 tables publiques, toutes avec RLS ; 28 sans politique (refus par défaut
  pour les rôles non privilégiés). Une politique INSERT `WITH CHECK (true)`
  sur `founder_waitlist_entries`, pour anon/authenticated. Aucun contenu
  utilisateur extrait, aucune écriture ni tentative destructive.
- Les deux rôles ont encore TRUNCATE sur 22 tables. Ce droit superflu doit être
  retiré par les migrations préparées après autorisation ; il n'est PAS une
  preuve qu'un client HTTP peut exécuter TRUNCATE. Aucun essai de destruction
  n'a été réalisé. Les rôles anon/authenticated ne sont ni superuser ni bypassrls.
- Aucune vue, vue matérialisée ni fonction dans le schéma public à cet instant.
  Cela ne couvre pas les autres schémas, les routes applicatives ou les secrets.
  Les tables Apple et registres photos locaux sont absents de cette liste
  distante : leurs migrations ne sont donc pas considérées appliquées.
- Conseiller distant : 28 informations « RLS Enabled No Policy », attendues
  pour des tables serveur, et un avertissement de protection contre les mots
  de passe compromis désactivée. Ne pas annoncer un audit entièrement vert.
  [Documentation de cette protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
  Aucun réglage changé ; disponibilité/coût à vérifier avant activation.
- Confirmer le rôle PostgreSQL utilisé par l'application et toute intégration
  externe qui pourrait dépendre d'un accès direct à ces tables.
- Autorisation explicite pour appliquer la migration distante, puis tests de
  régression des parcours réels. Aucun déploiement effectué ici.
- Cet audit ciblé ne couvre pas toutes les vues, fonctions privilégiées, buckets,
  sauvegardes ou politiques de conservation ; la sécurité globale reste ouverte.
