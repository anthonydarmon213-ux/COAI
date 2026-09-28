# Photos — préparation locale, 28 septembre 2026

Statut : correction de concurrence intégrée localement, NON PUBLIABLE EN L'ÉTAT.

Le registre réserve un envoi avant le stockage. La suppression ferme durablement
les admissions et refuse de poursuivre tant qu'un envoi reste non confirmé.
La fermeture est validée dans une transaction avant de renvoyer l'erreur ; une
nouvelle tentative ne peut donc pas rouvrir les envois. Les transactions ne
contiennent aucun appel au stockage. Aucun identifiant client en clair, photo,
adresse email ou donnée de santé dans les deux tables.

## Vérifié

- Test des vrais modules avec PostgreSQL local et stockage simulé : lecture du
  fichier retardée, envoi déjà en cours, nouvelle tentative de suppression,
  reconnexion, confirmation inconnue, isolation des propriétaires.
- Tables privées : RLS activée et droits clients révoqués ; conseiller sécurité
  local sans erreur. Tests de conservation de l'avatar, nettoyage paginé et
  garde de facturation réussis.
- TypeScript et lint passent (six avertissements préexistants).
- Compilation locale réussie avec une base factice.

## Obligatoire avant publication

1. Définir et tester une reprise opérationnelle des envois incertains. Un timeout
   ne prouve pas que le stockage a refusé le fichier : NE PAS supprimer la
   réservation sur délai, NE PAS marquer settled sans preuve. En l'état, une
   réponse perdue bloque l'effacement et nécessite assistance. Cette limite
   empêche de considérer la suppression prête pour production.
2. Valider le parcours HTTP avec le stockage local réel puis sur l'environnement
   autorisé. Les tests simulés ne couvrent pas les pannes réelles du service.
3. Autorisation distincte pour la migration Prisma puis le déploiement. Les
   anciennes instances sans registre doivent être arrêtées/drainées avant de
   garantir l'absence d'envoi tardif. Ne pas publier ce code sans les tables.
4. Définir la conservation minimale des empreintes de blocage et la purge des
   opérations confirmées, sans rouvrir les demandes anciennes.

La CLI Supabase a attribué le timestamp 20260928074218. `db pull --local`
refuse le décalage avec son historique indépendant ; aucun repair forcé. Le
SQL est conservé dans les migrations Prisma, mécanisme existant du projet.
Les tables de test locales ont été créées par db query sans écrire d'historique
de migration ; ne pas confondre cette expérimentation et une migration appliquée.

Commande : `node scripts/test-photo-write-registry-local.cjs --local`.
Ce test nettoie uniquement ses propres lignes aléatoires ; aucune production.
