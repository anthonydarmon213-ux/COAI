# Parcours COAI — état des preuves au 9 septembre 2026

Le parcours complet n'est pas encore validé. Une compilation réussie ne prouve ni un paiement, ni une activation, ni une séance réelle.

| Étape | Preuve obtenue | À vérifier encore |
| --- | --- | --- |
| Bilan / recommandation | Tests locaux de cadence et de recommandation réussis | Parcours mobile complet, résultat et reprise |
| Création de compte | Code présent, pas de test réel dans cet audit | Confirmation email et conservation du bilan |
| Paiement / essai | Tests simulés de confirmation Stripe : authentification, propriété de session, statuts et entrées invalides | Checkout en mode test, webhook et retour navigateur |
| Activation | Tests simulés : transfert du bilan et conservation des réponses en cas d'échec | Activation avec compte de test |
| Première séance | Navigation actualisée vue en production ; tests locaux des remplacements et du suivi | Compte connecté actuellement en attente de validation coach ; lecture, reprise et fin réelles non vérifiées |
| RepCount | Pas de nouvelle preuve de bout en bout | Sauvegarde puis relecture sur compte de test |
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
