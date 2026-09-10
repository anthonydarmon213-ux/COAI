# Parcours COAI — état des preuves au 10 septembre 2026

Le parcours complet n'est pas encore validé. Une compilation réussie ne prouve ni un paiement, ni une activation, ni une séance réelle.

## Préparation du test isolé — 10 septembre

Supabase local tourne désormais dans Colima `coai-test`, réseau `coai-e2e-loopback` limité à `127.0.0.1` (ports 54321/54322/54324 vérifiés avec lsof). CLI épinglé à 2.117.0 ; configuration temporaire `/tmp/coai-e2e-supabase-sloAPQ`. Les 81 migrations ont été appliquées uniquement à cette base locale vide. Le serveur Next local utilise le port 3050, sans clés de génération ou notifications externes. Stripe utilise désormais la clé de test existante, chargée en mémoire par un lanceur local, sans copie dans le dépôt.

Test navigateur réel : inscription fictive, réception dans Mailpit, identité confirmée en base, connexion par mot de passe réussie. **Bug corrigé** : identité Auth sans ligne `users` → dashboard vide. Redirection vérifiée vers `completer-inscription`, prénom conservé et consentements initialement non cochés. Finalisation du compte fictif ensuite réussie. La réouverture du lien déjà consommé affiche la connexion sans expliquer `otp_expired` : friction encore à traiter.

Checkout réellement ouvert depuis le bouton mensuel : carte fictive Stripe, session `cs_test_a1nVAScDdbhXDQqcCE8MWs05VoyAllFCiEjWW23b3EXWMySo8C2Ik3Ipe9`, `livemode=false`, `status=complete`, `amount_total=0`. Webhooks `checkout.session.completed` et `invoice.payment_succeeded` reçus et traités en HTTP 200 par le serveur local. Retour navigateur « Essai activé ». Base locale : une souscription ACTIVE/PASS_IA/MONTHLY, 1999 centimes EUR récurrents, fin d'essai au 17 septembre. Aucun débit réel. Les prix sont créés inline par Checkout : le catalogue vide n'était pas un obstacle.

RepCount : presse à cuisses, 10 répétitions à 20 kg, enregistrées via le navigateur. Rechargement puis recherche de l'exercice : historique retrouvé. Ligne `seances_log`, source REPCOUNT, contrôlée en SQL local. Ce n'est pas une séance PROGRAMME terminée.

Suite du 10 septembre : le lecteur d'historique RepCount éliminait les maintiens (`reps=0`). Correction de la conservation des secondes, du format des séries, de la courbe et de la saisie suivante. Sélection explicite répétitions/maintien ; préremplissage selon la dernière série ; comparaisons séparées par unité. Le changement de nom est bloqué tant que des séries attendent leur enregistrement, pour éviter de les attribuer à un autre exercice. `test-repcount-maintien.cjs` vérifie les données historiques et le rendu serveur du vrai composant (états fictifs injectés), notamment l'absence de champ charge et de chandeliers kg en mode maintien. Cela ne remplace pas un test des interactions : le Mac est encore verrouillé, la sauvegarde/relecture navigateur du maintien reste à vérifier.

Bilan connecté : les 11 questions ont été parcourues (homme fictif, 40 ans, débutant, reprise, salle, 45 minutes, 2 séances/semaine, aucune contrainte). Résultat Full Body x2 ; mise à jour du profil et création effective des trois piliers via le socle local sans API IA payante. Accès à un programme et à ses contrôles vidéo obtenu, mais lecture vidéo et fin de séance restent à vérifier.

**Socle Full Body corrigé, périmètre limité** : pour les débutants à 1 ou 2 séances/semaine, le moteur reprend désormais la référence validée du 9 septembre : presse, développé couché haltères, tirage horizontal machine, Superman, planche et crunch. Formats estimés 45/60 minutes, préparation et retour au calme, séries simples et isométrie explicite. Tests par le véritable point d'entrée du socle : 4 combinaisons et 36 occurrences d'exercices avec médias existants. Les autres niveaux/fréquences et l'homogénéité homme/femme des illustrations ne sont pas validés par ce lot. Le format minimal de cette référence reste 45 minutes.

**Lecteur, contrôle du 10 septembre** : programme régénéré sur le compte fictif local ; vidéo de presse réellement lue et mise en pause. Échauffement puis six séries synthétiques renseignées (presse, développé, tirage). Le chronomètre interprète maintenant « 1 min 15 s » comme 75 secondes, et non 600. La saisie isométrique a révélé un champ répétitions incorrect : corrigée en maintien en secondes, conservé par le schéma API sans tonnage/répétitions fictifs. Tests unitaires réussis. La fin de séance PROGRAMME et le retour à son historique restent NON vérifiés : le Mac s'est verrouillé avant la reprise du contrôle navigateur. Aucun programme client de production modifié.

**Friction corrigée** : le résultat du bilan d'un abonné actif ne repropose plus un nouvel essai. L'état ACTIVE vient de la page serveur, distinct du simple état connecté, et oriente vers l'action existante d'application du bilan. Six statuts testés avec Auth/Prisma simulés (`test-diagnostic-abonnement.cjs`). Les autres offres et les contrôles serveur d'accès restent inchangés. Les intermèdes du bilan restent à traiter.

**Confirmation email, 10 septembre** : prise en charge des erreurs de lien (query et fragment), maintien de la destination interne après erreur du callback, formulaire de renvoi explicite sur l'écran d'attente et à la connexion après erreur. Corriger son adresse et se connecter à un compte déjà confirmé restent possibles. Temporisation 60 s et blocage double clic côté interface ; limites fournisseur conservées. `test-auth-confirmation.cjs` teste helpers, route réelle avec Auth simulée et handler réel du formulaire sans fournisseur. `test-confirmation-local.cjs /tmp/coai-e2e-supabase-sloAPQ` a créé un compte fictif non confirmé et reçu les deux emails dans Mailpit, lien local et destination bienvenue vérifiés. Requête HTTP réelle du callback local expiré : 307 vers `/sign-in?error=otp_expired&redirect_to=%2Fbienvenue`. Aucun email externe, aucune configuration Auth de production modifiée. Ouverture du nouveau lien puis reprise complète du bilan dans le navigateur encore à vérifier (Mac verrouillé).

`node scripts/check-local-test-env.mjs` contrôle uniquement les variables du processus, sans lire de fichier `.env`, sans appel réseau et sans afficher de secret. Il refuse les adresses non locales, les clés Stripe réelles et les intégrations externes de génération, notification et suivi. Tests : `node scripts/test-local-test-env.mjs`.

Ce contrôle n'est **pas** un pare-feu ni une protection intégrée à l'application : il ne démarre pas le serveur, ne vérifie pas les identifiants auprès des fournisseurs et ne couvre pas des variables chargées ultérieurement par Next.js. Avant un test complet, vérifier aussi les fichiers `.env*`, les services locaux, les prix Stripe de test et le webhook. Ne pas utiliser les identifiants Supabase de production. Ne pas lancer `npm run build` pour tester : ce script exécute des migrations.

| Étape | Preuve obtenue | À vérifier encore |
| --- | --- | --- |
| Bilan / recommandation | Tests locaux de cadence et de recommandation réussis | Parcours mobile complet, résultat et reprise |
| Création de compte | Compte fictif local créé et confirmé via Mailpit | Ordre bilan avant inscription et conservation des réponses |
| Paiement / essai | Checkout Stripe test, webhook HTTP 200, souscription locale et retour navigateur vérifiés | Cas refus, annulation et redélivrance réelle du même événement |
| Activation | Essai actif, bilan connecté puis génération socle locale réussis ; Full Body débutant 1/2 séances corrigé | Autres variantes, cohérence des illustrations et qualité globale |
| Première séance | Deux séances synthétiques complètes enregistrées depuis le lecteur local, 12 séries chacune ; reprise après rechargement et bilan facultatif vérifiés | Équivalence production, autres variantes, reprise réseau dégradé avec check-in |
| RepCount | Historique PROGRAMME retrouvé après rechargement ; planche 2×30 s, courbe 60 s et saisie en maintien | Parcours complet mobile au-delà de cet écran, toutes les variantes |
| Mesure | Agrégats de premiers usages par cohorte de comptes, requêtes réelles testées sur SQL local ; sources séparées et déduplication par membre | Rendu administrateur connecté, réception effective des événements externes, consentement traceurs, attribution complète avant compte |
| Relances | Test de cadence et 32 assertions du registre réussis sur SQL local (doublons, délai, rollback, statut incertain) | Concurrence distribuée, schéma effectivement déployé, exécution des crons et réception fournisseur non vérifiés ; aucun email envoyé dans cet audit |

## Sémantique des événements

### Mesure des premiers usages — audit du 10 septembre

`trackServerEvent` écrit seulement dans les logs serveur ; il ne constitue pas un collecteur persistant. L'événement navigateur de première séance terminée n'est pas émis. La présence de `GoogleAnalytics` directement dans le layout, sans contrôle de consentement trouvé dans les composants inspectés, empêche de considérer la mesure publicitaire comme validée. Aucun nouveau traceur ni envoi GA4 n'a été ajouté dans ce lot ; consentement et réception externe restent à traiter avant certification du tunnel.

Le tableau administrateur ajoute une lecture des données métier : cohorte de comptes créés depuis 30 jours, membres avec programme validé/généré, séance source PROGRAMME, saisie source REPCOUNT et bilan de séance renseigné. Les requêtes comptent les utilisateurs avec une relation `some`, jamais les clics ni le nombre de logs. RepCount est un indicateur indépendant (possible avant abonnement), pas une étape obligatoirement postérieure à la séance. Aucun statut d'abonnement n'est présenté comme paiement encaissé dans ce nouveau bloc. Accès dans la page existante après contrôle administrateur ; pas de nouvelle API ni migration.

`node scripts/test-activation-cohort.cjs --local` : requêtes réelles sur la base loopback, compte fictif avec deux séances PROGRAMME → 1 membre actif, 1 utilisateur RepCount, 1 bilan. Cohorte locale : 1 compte / 1 programme / 1 séance / 1 RepCount / 1 bilan. Tests supplémentaires des fenêtres temporelles, sources et propagation des erreurs (pas de zéro inventé). Le rendu du nouveau bloc dans une session administrateur et les statistiques de production restent à vérifier.

### Mise à jour E2E du 10 septembre — navigateur isolé

Les limitations « Mac verrouillé » décrites plus haut sont historiques : un Chromium headless indépendant, sans profil personnel, permet désormais les tests locaux. Aucun contournement de session personnelle.

- Première séance : échauffement, 12 séries, retour au calme, enregistrement source PROGRAMME `60defb58-206f-40ec-9acb-1eab816ac33e`. Rechargement après la première série puis reprise au repos, série conservée. Lecture authentifiée de `/api/seances` et navigation du récapitulatif vers RepCount ; planche 2×30 s, total 60 s après rechargement. Viewport 390×844 sans débordement horizontal.
- Lacune découverte : aucun ressenti proposé dans le lecteur. Ajout d'un bilan facultatif à la dernière étape, sans valeur précochée, sans nouvelle page ni API IA. Difficulté/énergie 1–5 et douleur/zone utilisent les champs existants de `/api/seances`. Les réponses ne sont pas copiées dans localStorage ; conservées en mémoire pour une nouvelle tentative d'enregistrement. Rechargement avant envoi : elles doivent être resaisies.
- Test navigateur du nouveau formulaire : sélection difficulté 4, énergie 2, douleur légère, genou. API après enregistrement : mêmes quatre valeurs et six exercices, séance `4dcc4891-513d-4143-b10a-fd89107c7410`. Rendu mobile inspecté. `test-seance-checkin.cjs` vérifie les vrais contrôles, remise à zéro de la zone, absence de réponses implicites, désactivation pendant envoi et compatibilité avec le véritable schéma API.
- Correction du faux message « enregistrée » en cas d'échec et verrou synchrone contre le double clic dans le lecteur.
- Ce sont des données sportives fictives et des tests accélérés, sans prescription ni durée réelle prouvée. L'adaptation automatique à partir de ces réponses et la réception analytique restent à vérifier. Des modifications tierces préexistantes du worktree ne font pas partie de ce lot ; ces tests locaux ne certifient pas à eux seuls toute la production.

- `workout_player_opened` : clic qui ouvre le lecteur, via le mécanisme GA4 existant. Peut inclure une reprise ; ne prouve pas une séance réalisée. Aucune donnée d'exercice transmise.
- `first_workout_completed` : première séance PROGRAMME enregistrée par l'API. Remplace le libellé trompeur `first_workout_started` dans les logs serveur à partir de ce lot ; ne pas mélanger les deux séries historiques.
- `workout_completed` : séance PROGRAMME enregistrée, événement existant.

Les logs serveur ne constituent pas à eux seuls un tableau de conversion. Les événements navigateur peuvent être absents quand GA4 n'est pas chargé.

## Reproduire le test des relances

### Reprise Stripe après un traitement partiel — 10 septembre

- Blocage reproduit sur le véritable handler et PostgreSQL local : `invoice.payment_failed` écrit dans `billing_events`, puis la notification simulée échoue. La réservation webhook est retirée, mais la ligne financière reste. Une nouvelle livraison du même événement échouait alors en `P2002` avant de pouvoir reprendre.
- Correction : écriture financière idempotente par `event.id`, sans modification de la ligne déjà enregistrée. Les autres étapes peuvent reprendre. Le registre webhook conserve son contrôle des événements déjà terminés.
- `node scripts/test-stripe-webhook-retry.cjs --local` : signature réellement vérifiée par le SDK Stripe, signature invalide rejetée, erreur de notification après une facture échouée, erreur d'écriture d'abonnement après une facture payée, reprise du même payload signé, un seul événement financier, puis doublon acquitté sans nouvel effet. Avant correction : `P2002` ; après : succès des deux scénarios.
- Base exclusivement `127.0.0.1:54322`, identifiants aléatoires de test supprimés à la fin. Aucun compte client touché, aucune connexion au compte Stripe, aucun email externe, aucune migration. Les défaillances sont injectées dans les dépendances du test, pas via un mode caché en production.
- Portée : tests du handler et de la persistance, pas une redélivrance depuis Stripe vers l'URL de production. Restent à vérifier : processus interrompu brutalement pendant réservation, concurrence distribuée, ordre des événements, reprise de notifications partiellement envoyées, refus de carte et annulation depuis Checkout dans le navigateur. Le parcours complet reste ouvert.

### Contrôle du suivi facultatif — 10 septembre

- Le layout ne monte plus directement GA4, Meta, Vercel Analytics ou Clarity. Une frontière client lit un choix versionné, valable 180 jours, sans traceur au rendu serveur. Audience et marketing sont séparés ; refus/acceptation au même niveau, personnalisation et réouverture disponibles. Pas de blocage du bilan.
- Clarity est désactivé, y compris sur les écrans privés : pas de réactivation tant que la capture des écrans de santé n'a pas fait l'objet d'une revue spécifique. Ce lot ne constitue pas une certification RGPD.
- Les helpers GA4/Meta et la lecture/écriture du cookie UTM vérifient l'accord. Pas de rattrapage des événements antérieurs au consentement. Le refus d'attribution supprime le cookie COAI. Un retrait d'accord recharge la page pour ne pas laisser tourner une bibliothèque déjà chargée (également lors d'un retrait dans un autre onglet ou d'une expiration détectée).
- `node scripts/test-privacy-consent.cjs` : absence de scripts au SSR, finalités indépendantes, refus, expiration, stockage invalide/bloqué, attribution conditionnelle. TypeScript, lint et compilation vérifiés.
- Chromium isolé, 390×844, application locale compilée, aucune clé de suivi réelle : pas de script optionnel ni cookie UTM avant choix ; refus → démarrage et reprise du diagnostic possibles après rechargement ; accord marketing seul → cookie UTM présent ; retrait → nouvelle navigation et cookie supprimé. Pas de débordement horizontal. Panneau initial compacté, recompilé et inspecté visuellement ; personnalisation ouvre les deux cases non cochées. Le bouton de réouverture est dans le flux de page et ne recouvre pas la navigation mobile.
- Réception réelle GA4/Meta, consentement fournisseur chargé, comportement inter-onglets en navigateur, collecte des premières séances et attribution externe restent à prouver. Aucun nouvel événement de séance ni appel IA payant ajouté. Les modifications tierces préexistantes du worktree sont exclues du commit.

`node scripts/test-delivery-registry.cjs /chemin/vers/@electric-sql/pglite/dist/index.js`

Le 9 septembre, le module existant `/tmp/coai-local-db-P9se0u/node_modules/@electric-sql/pglite/dist/index.js` a permis d'exécuter le test. Ce chemin temporaire n'est pas une dépendance durable. Le test crée une base en mémoire et simule le fournisseur ; il ne se connecte pas à la base de production.
