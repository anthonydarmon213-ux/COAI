# Photos — préparation locale, 28 septembre 2026

Statut : correction de concurrence intégrée localement, NON PUBLIABLE EN L'ÉTAT.

Le registre réserve un envoi avant le stockage. La suppression ferme durablement
les admissions et refuse de poursuivre tant qu'un envoi reste non confirmé.
La fermeture est validée dans une transaction avant de renvoyer l'erreur ; une
nouvelle tentative ne peut donc pas rouvrir les envois. Les transactions ne
contiennent aucun appel au stockage. Aucun identifiant client en clair, photo,
adresse email ou donnée de santé dans les deux tables.

## Vérifié

- 1er octobre, après changement des chemins d'avatar : parcours HTTP de
  suppression réussi avec 99 fichiers fictifs et deux avatars successifs
  créés par `/api/profil/avatar` (101 objets, donc pagination réelle).
  Compte/profil/identité Auth et les 101 objets disparaissent ; deux anciennes
  sessions et le mot de passe sont refusés, les routes photo refusent tout
  nouvel envoi, l'ancienne URL signée ne sert plus l'objet. Un autre compte
  et son fichier restent intacts, même avec un identifiant forgé dans la
  demande. Test `test-account-delete-http-storage-local.cjs`, services locaux
  réels uniquement. Ce test ne prouve pas la résolution d'un envoi incertain.

- 1er octobre : les nouveaux avatars utilisent maintenant un chemin UUID par
  opération et `upsert: false`, comme les photos de suivi. Un remplacement ne
  détruit plus la preuve d'un envoi précédent, ni l'ancien avatar du même format
  avant persistance du nouveau chemin. Test PostgreSQL/Storage réels locaux :
  première confirmation interrompue, second avatar enregistré, deux fichiers
  distincts retrouvés puis supprimés ; admissions toujours fermées ensuite.
  Les cinq scénarios de `test-photo-lost-response-local.cjs` et les huit scénarios
  d'arrêt/concurrence passent. Tests avatar simulés et TypeScript réussis.
  Après recompilation Next complète, test HTTP de la route réussi avec
  Auth/PostgreSQL/Storage locaux réels : 401 sans session, chemin UUID persisté,
  image relue à l'identique, refus des formulaires incomplets et images vides,
  nouvel envoi avec chemin distinct et ancienne image encore disponible.
  Compte, fichiers et lignes du registre de cette fixture supprimés après test.
  Production et parcours de sélection de photo sur iPhone restent non vérifiés.
  Les anciens chemins `avatar.jpg/png/webp` restent compatibles avec la suppression.
  ATTENTION : les anciens avatars restent conservés jusqu'à suppression du compte ;
  prévoir une purge sûre des versions inutilisées avant publication pour éviter
  une accumulation. Ce correctif ne résout pas un arrêt avant l'envoi au stockage.

- 1er octobre : réponse d'envoi perdue puis lecture des métadonnées indisponible,
  pour avatar et suivi. Aucun succès d'envoi ni de suppression sans preuve ;
  après rétablissement des lectures, suppression réussie et admissions toujours
  fermées. `test-photo-lost-response-local.cjs` passe ses quatre scénarios.
  PostgreSQL et fichiers Storage réels locaux ; réponses 503 injectées dans
  le transport du client de test, pas une panne réelle de l'infrastructure.
  Fixtures aléatoires nettoyées à la fin. Aucun compte réel ou service distant.

- 1er octobre : deux courses envoi/suppression supplémentaires passent avec
  PostgreSQL et Storage locaux réels (avatar et suivi). Le test retient la
  requête HTTP avant son départ, après réservation en base : suppression refusée,
  admissions fermées, puis vrai envoi libéré et fichier effectivement présent.
  La nouvelle tentative supprime ce fichier et les admissions restent fermées.
  Le processus d'envoi est attendu avant nettoyage, même si une assertion échoue.
  `test-photo-process-crash-local.cjs` couvre désormais huit cas au total.
  Ce retard contrôlé dans le transport client n'est pas une panne du serveur
  Storage ni une preuve de récupération d'un processus mort avant l'envoi.

- Reprise d'une réponse d'envoi perdue, même avec Storage local réel : chaque
  envoi porte un UUID serveur dans les métadonnées. Après erreur seulement,
  l'app consulte `info` et exige UUID + chemin + bucket exacts avant confirmation.
  Le test `test-photo-lost-response-local.cjs` fait réellement enregistrer un
  PNG fictif puis perd sa réponse HTTP ; avatar et photo de suivi récupérés et
  supprimés ensuite. Ancien marqueur, mauvais chemin/bucket, métadonnées absentes
  et panne de lecture restent refusés dans les tests unitaires.
- Les photos de suivi utilisent désormais l'UUID d'envoi, et non une date à la
  milliseconde, pour éviter la collision de deux envois simultanés.
- Reprise après arrêt brutal testée dans six scénarios avec Storage/PostgreSQL
  locaux réels : un processus enfant quitte immédiatement après l'enregistrement,
  avant confirmation. Le processus suivant retrouve la preuve et efface le
  fichier (avatar et suivi). Arrêt avant envoi et marqueur remplacé restent
  explicitement refusés. Test : `test-photo-process-crash-local.cjs`.
- La suppression ferme d'abord les admissions, cherche les preuves exactes des
  opérations en attente, recontrôle le registre puis refait la liste avant tout
  effacement. Aucun appel Storage dans la transaction de verrouillage.
- Test des vrais modules avec PostgreSQL local et stockage simulé : lecture du
  fichier retardée, envoi déjà en cours, nouvelle tentative de suppression,
  reconnexion, confirmation inconnue, isolation des propriétaires.
- Tables privées : RLS activée et droits clients révoqués ; conseiller sécurité
  local sans erreur. Tests de conservation de l'avatar, nettoyage paginé et
  garde de facturation réussis.
- TypeScript et lint passent (six avertissements préexistants).
- Compilation locale réussie avec une base factice.
- Parcours HTTP avec Auth/PostgreSQL/Storage locaux réels réussis : avatar
  stocké et relu à l'identique, entrées invalides refusées, nouvelle tentative
  réussie ; suppression de 101 fichiers paginés, anciennes sessions refusées,
  autre compte et fichier conservés, deux suppressions simultanées réussies.
  La course envoi/suppression est également testée avec un départ HTTP retardé
  vers le stockage réel local (voir contrôle du 1er octobre ci-dessus), sans
  proxy de panne du service. Aucun test en production.

## Obligatoire avant publication

1. Compléter la reprise opérationnelle des envois incertains. Un timeout
   ne prouve pas que le stockage a refusé le fichier : NE PAS supprimer la
   réservation sur délai, NE PAS marquer settled sans preuve. La réponse perdue
   et l'arrêt après enregistrement sont récupérés si la preuve exacte existe.
   Un arrêt avant envoi, un écrasement de la preuve ou un stockage indisponible
   restent sans résolution automatique. Cette limite
   empêche de considérer la suppression prête pour production.
2. Compléter le parcours HTTP local réussi par les scénarios de panne et de
   concurrence avec stockage réel, puis sur l'environnement autorisé. Les
   tests simulés ne couvrent pas les pannes réelles du service.
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
