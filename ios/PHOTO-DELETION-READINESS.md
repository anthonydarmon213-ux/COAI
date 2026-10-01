# Photos — préparation locale, 28 septembre 2026

Statut : correction de concurrence intégrée localement, NON PUBLIABLE EN L'ÉTAT.

Le registre réserve un envoi avant le stockage. La suppression ferme durablement
les admissions et refuse de poursuivre tant qu'un envoi reste non confirmé.
La fermeture est validée dans une transaction avant de renvoyer l'erreur ; une
nouvelle tentative ne peut donc pas rouvrir les envois. Les transactions ne
contiennent aucun appel au stockage. Aucune photo, adresse email ou donnée de
santé dans les deux tables. Une tâche de retrait conserve temporairement
l'identifiant technique Auth nécessaire pour retrouver le fichier ; il est
effacé avec le nom du fichier et la date de reprise dès le nettoyage confirmé.
Les admissions fermées restent représentées par une empreinte, pas cet identifiant.

## Vérifié

- 1er octobre — erreur de suppression identifiable : la route renvoie le code
  stable `PHOTO_DELETION_UNCONFIRMED` et le compte affiche une explication dédiée
  (suppression non terminée, photos éventuellement déjà effacées, nouveaux envois
  éventuellement bloqués). Aucun détail fournisseur ou identifiant d’opération
  n’est affiché ; session et boutons restent utilisables après échec.
  Tests de composant et de route réussis, y compris JSON invalide/code inconnu.
  Test HTTP recompilé avec Auth/PostgreSQL/Storage locaux réels : réservation
  sans fichier → 503 avec code, profil/identité/101 fichiers conservés et
  admissions fermées ; arrivée ultérieure du fichier avec preuve exacte →
  nouvelle tentative réussie, 102 fichiers supprimés, anciennes sessions
  refusées, compte voisin préservé. Fixtures et leurs registres nettoyés.
  Build Next (132 pages), TypeScript, lint ciblé et 356 chemins média vérifiés.
  Ce correctif explique le blocage ; il NE résout PAS l’arrêt définitif avant
  envoi et n’est ni publié ni vérifié dans l’interface iPhone.

- 1er octobre — reprise autonome préparée : route privée
  `/api/cron/photos-retirees`, refus sans secret, désactivée par défaut
  (`PHOTO_RETIREMENT_CRON_ENABLED`), aucune planification ajoutée à `vercel.json`.
  Chaque exécution prend au maximum 20 tâches déjà retirées du profil ; deux
  traitements concurrents prennent des lots distincts. Une prise abandonnée
  peut être reprise après cinq minutes (pas une expiration des envois incertains).
  La réponse ne contient que des compteurs et renvoie 503 en cas d'échec partiel.
  Test HTTP sur serveur recompilé + PostgreSQL/Storage locaux réels : secret
  absent/incorrect refusé ; 25 retraits traités en lots 20/5 ; SIGKILL après prise
  d'un lot, reprise ultérieure ; panne d'un fichier isolée ; propriétaire falsifié
  refusé avant Storage ; réponse perdue après suppression réelle puis nouvelle
  tentative réussie. Avatar actuel et fichier non publié préservés. Identifiants
  temporaires de routage effacés, fixtures supprimées.
  `test-avatar-retirement-local.cjs --worker-http` et
  `test-avatar-retirement-cron.cjs` réussis. Remplacement HTTP et suppression de
  compte avec 101 fichiers restent réussis. Build Next, schéma Prisma, TypeScript,
  lint ciblé et conseiller sécurité local réussis. Index partiel de file contrôlé
  par EXPLAIN : utilisable sans tri supplémentaire (ce n'est pas un test de charge).
  Migration `20261001083325_avatar_retirement_worker` appliquée seulement en local.
  LIMITES : planification réelle, quotas/coûts d'hébergement et supervision restent
  à valider avant activation autorisée. Aucun cron distant exécuté ou activé.

- 1er octobre — nettoyage des avatars remplacés, vérifié localement : le
  nouveau chemin et la tâche de suppression du précédent sont enregistrés dans
  une même transaction, sous le verrou du propriétaire. Un avatar déjà publié
  ne peut pas être réintroduit par une ancienne opération. Le stockage est
  nettoyé hors transaction ; la tâche reste persistante si l'effacement ou sa
  vérification échoue. La suppression du compte efface aussi les tâches restantes.
  Migration préparée `20261001081238_avatar_retirement`, exécutée uniquement
  dans la base locale, pas dans une base distante. Aucun nouvel accès client.
  `test-avatar-retirement-local.cjs` : PostgreSQL/Storage réels, arrêt SIGKILL
  après commit puis reprise, panne de suppression injectée, trois remplacements
  concurrents, fichier encore non publié préservé, ancien format `avatar.png`,
  liste tronquée refusée comme preuve, chemin étranger refusé et rollback,
  fermeture des admissions et nettoyage du compte. Fixtures supprimées.
  Après build Next complet : `test-avatar-http-local.cjs` réussi, ancien avatar
  absent et nouveau accessible ; suppression HTTP de 101 objets restants et
  deux suppressions simultanées réussies. Les huit cas de processus interrompu
  et cinq cas de réponse perdue restent réussis. Schéma Prisma, TypeScript,
  lint ciblé et conseiller sécurité local sans erreur.
  À cette étape, le retry était déclenché par un autre remplacement ou la suppression
  du compte ; le traitement autonome suivant est préparé ci-dessus. Les anciens orphelins
  sans tâche et les envois jamais publiés ne sont pas purgés sur simple absence
  de référence. La reprise automatique de ces cas reste à finaliser.
  Pas de validation en production ni de sélection de photo sur appareil physique.

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
  À ce stade historique, les anciens avatars restaient conservés jusqu'à la
  suppression du compte ; le correctif suivant ci-dessus couvre les nouveaux
  remplacements publiés, pas les orphelins antérieurs. Aucun des deux correctifs
  ne résout un arrêt avant l'envoi au stockage.

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
5. Activer et superviser la reprise autonome des tâches d'avatar après validation
   de l'hébergement et autorisation explicite. Finaliser la gestion des fichiers
   jamais publiés / antérieurs. Ne pas supprimer un fichier uniquement parce
   qu'il n'est pas le chemin actuel : une publication peut être en cours.

La CLI Supabase a attribué le timestamp 20260928074218. `db pull --local`
refuse le décalage avec son historique indépendant ; aucun repair forcé. Le
SQL est conservé dans les migrations Prisma, mécanisme existant du projet.
Les tables de test locales ont été créées par db query sans écrire d'historique
de migration ; ne pas confondre cette expérimentation et une migration appliquée.

Commande : `node scripts/test-photo-write-registry-local.cjs --local`.
Ce test nettoie uniquement ses propres lignes aléatoires ; aucune production.
# Contrôle du contenu des avatars — 1 octobre 2026

Extension aux photos de progression : même décodage serveur avant écriture.
`test-avatar-http-local.cjs` vérifie maintenant les deux endpoints, puis
l’association photo → mesure → historique et la répétition idempotente de
l’enregistrement (201 puis 200, une seule mesure). Régression confirmée :
suppression de 101 fichiers et deux suppressions concurrentes réussies.
L’ancienne fixture PNG du test de suppression était illisible ; elle est
remplacée par une vraie image créée en mémoire avec Sharp. Comptes/fichiers
jetables nettoyés. Build Next complet, TypeScript, ESLint ciblé et tests des
deux routes réussis. Recontrôle physique : iPhone toujours `unavailable`.
Ces preuves restent locales ; aucune publication ni validation iPhone.

Le serveur décode désormais réellement les JPEG/PNG/WebP avant toute écriture.
Un fichier illisible, tronqué, dont le format ne correspond pas au type déclaré,
ou dépassant 16 millions de pixels est refusé sans modifier l’avatar existant.
La limite de 2 Mo reste applicable. Les images multipages sont refusées.

Preuves locales : `test-avatar-image.cjs`, `test-avatar-route.cjs` et
`test-avatar-http-local.cjs` passent ; le test HTTP a d’abord reproduit un
faux fichier accepté (201), puis confirmé son refus (400) après correction,
avec conservation de la photo précédente. Compilation Next, TypeScript et
ESLint ciblé passent. Aucun déploiement ni test iPhone de ce correctif effectué.
