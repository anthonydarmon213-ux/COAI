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

**Friction corrigée dans ce lot** : le résultat du bilan d'un abonné actif ne repropose plus un nouvel essai. L'état ACTIVE vient de la page serveur, distinct du simple état connecté, et oriente vers l'action existante d'application du bilan. Six statuts testés avec Auth/Prisma simulés (`test-diagnostic-abonnement.cjs`). Les autres offres et les contrôles serveur d'accès restent inchangés. Les intermèdes du bilan et l'absence d'explication du lien expiré restent à traiter.

`node scripts/check-local-test-env.mjs` contrôle uniquement les variables du processus, sans lire de fichier `.env`, sans appel réseau et sans afficher de secret. Il refuse les adresses non locales, les clés Stripe réelles et les intégrations externes de génération, notification et suivi. Tests : `node scripts/test-local-test-env.mjs`.

Ce contrôle n'est **pas** un pare-feu ni une protection intégrée à l'application : il ne démarre pas le serveur, ne vérifie pas les identifiants auprès des fournisseurs et ne couvre pas des variables chargées ultérieurement par Next.js. Avant un test complet, vérifier aussi les fichiers `.env*`, les services locaux, les prix Stripe de test et le webhook. Ne pas utiliser les identifiants Supabase de production. Ne pas lancer `npm run build` pour tester : ce script exécute des migrations.

| Étape | Preuve obtenue | À vérifier encore |
| --- | --- | --- |
| Bilan / recommandation | Tests locaux de cadence et de recommandation réussis | Parcours mobile complet, résultat et reprise |
| Création de compte | Compte fictif local créé et confirmé via Mailpit | Ordre bilan avant inscription et conservation des réponses |
| Paiement / essai | Checkout Stripe test, webhook HTTP 200, souscription locale et retour navigateur vérifiés | Cas refus, annulation et redélivrance réelle du même événement |
| Activation | Essai actif, bilan connecté puis génération socle locale réussis | Corriger le contenu débutant avant validation qualité |
| Première séance | Navigation actualisée vue en production ; tests locaux des remplacements et du suivi | Compte connecté actuellement en attente de validation coach ; lecture, reprise et fin réelles non vérifiées |
| RepCount | Série enregistrée, historique retrouvé après rechargement, persistance SQL vérifiée | Enregistrement depuis une séance PROGRAMME complète |
| Mesure | Ouverture du lecteur distinguée de première séance enregistrée | Réception effective des événements ; agrégation du tunnel |
| Relances | Test de cadence et 32 assertions du registre réussis sur SQL local (doublons, délai, rollback, statut incertain) | Concurrence distribuée, schéma effectivement déployé, exécution des crons et réception fournisseur non vérifiés ; aucun email envoyé dans cet audit |

## Sémantique des événements

- `workout_player_opened` : clic qui ouvre le lecteur, via le mécanisme GA4 existant. Peut inclure une reprise ; ne prouve pas une séance réalisée. Aucune donnée d'exercice transmise.
- `first_workout_completed` : première séance PROGRAMME enregistrée par l'API. Remplace le libellé trompeur `first_workout_started` dans les logs serveur à partir de ce lot ; ne pas mélanger les deux séries historiques.
- `workout_completed` : séance PROGRAMME enregistrée, événement existant.

Les logs serveur ne constituent pas à eux seuls un tableau de conversion. Les événements navigateur peuvent être absents quand GA4 n'est pas chargé.

## Reproduire le test des relances

`node scripts/test-delivery-registry.cjs /chemin/vers/@electric-sql/pglite/dist/index.js`

Le 9 septembre, le module existant `/tmp/coai-local-db-P9se0u/node_modules/@electric-sql/pglite/dist/index.js` a permis d'exécuter le test. Ce chemin temporaire n'est pas une dépendance durable. Le test crée une base en mémoire et simule le fournisseur ; il ne se connecte pas à la base de production.
