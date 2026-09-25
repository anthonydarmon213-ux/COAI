# Parcours natif connecté local — 25 septembre 2026

## Sauvegarde réelle du prénom et relance

Le test connecté modifie désormais le prénom, atteint Enregistrer avec le
clavier affiché, attend « Identité enregistrée. », puis vérifie la valeur
après fermeture et relance. Vérification indépendante dans PostgreSQL local
réussie (`ui-verify`), compte jetable supprimé ensuite (`ui-cleanup`).
Résultat : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.25_03-48-07-+0200.xcresult`.
Un test, zéro échec. Les essais précédents échouaient parce que le geste
automatisé touchait la barre de suggestions du clavier : le geste passe
maintenant au-dessus. Aucun correctif applicatif de sauvegarde n'a été
nécessaire. Cette preuve concerne le prénom, pas la date ni la production.

## Correctif champ date — même jour

Débordement corrigé dans Input : min-width 0, max-width 100%, apparence du champ
date neutralisée et hauteur minimale 50px pour les valeurs vides. Le contrôle
reste type=date ; logique de saisie/sauvegarde inchangée.
Test final : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.25_03-27-05-+0200.xcresult`.
Le contrôle date réel (Other, pas le StaticText du label) est mesuré à
285 × 51 points, identique au champ prénom en largeur. Capture inspectée :
`/tmp/coai-date-final-attachments-0925/B34EF511-7A6E-4A42-ACE7-A08247F0C5B8.png`.
Un test intermédiaire mesurait le label : rejeté puis corrigé pour éviter
un faux positif. Types/lint/build web local passés, compte jetable nettoyé.
Non publié, pas de validation de sauvegarde d'une nouvelle date ou iPhone
physique sur cette passe. Le défaut ci-dessous décrit la capture historique.

`testLocalConnectedLoginSurvivesRelaunch` passe sur le simulateur QA petit écran
693D66D1-61CD-4AB1-89B8-A5CAD9CA7480, iOS 26.5. Il saisit les identifiants d'un
compte jetable dans le vrai formulaire WebKit, ouvre les réglages authentifiés,
ferme/relance l'app, retrouve les réglages, se déconnecte puis vérifie que la
relance reste déconnectée. Aucun cookie injecté, aucun HTML fictif.

Le mode `-COAILocalIntegration` est compilé uniquement avec DEBUG sur simulateur.
Origine fixe http://localhost:3050 ; autres navigations principales refusées,
achats bloqués, pas d'URL arbitraire ni de modification ATS/TLS. Le test exige
le titre « COAI · test local » avant de saisir ses identifiants. Les règles
cosmétiques de navigation sont adaptées à cette origine uniquement.
Connexion Apple, StoreKit et téléchargements ne sont PAS validés par ce mode.

Préparation utilisée : helper local `/tmp/coai-local-http-0924.cjs`, modes
`build-native`, `serve-native`, `ui-create`, `ui-cleanup`. Serveur localhost,
Auth localhost:54321, Postgres 127.0.0.1:54322 ; seules clés de démo Docker lues
en mémoire. Ne jamais utiliser un environnement ou des comptes de production.
La fixture connue du test est créée uniquement dans cette pile isolée.

Commande Xcode : configuration Debug, schéma COAI, destination ci-dessus,
`-only-testing:COAIUITests/COAIUITests/testLocalConnectedLoginSurvivesRelaunch`,
`CODE_SIGNING_ALLOWED=NO test`. Ce test nécessite les services et la fixture ;
il ne doit pas être lancé comme simple test offline.

Preuve finale :
`/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.25_03-07-14-+0200.xcresult`.
Captures exportées dans `/tmp/coai-native-connected-layout-attachments-0925`,
inspectées. Défaut visuel identifié : champ date de naissance déborde de la
carte des réglages sur petit écran ; à corriger, pas déclaré résolu.

49 tests Swift, 65 contrôles core, compilation des règles WebKit et Release
iPhone arm64 non signée passent. `check-ios.sh --device-release` contrôle
l'absence du drapeau et de l'origine locale dans le binaire Release.
Journal `/tmp/coai-local-mode-layout-release-0925.log`.
Types/lint (6 avertissements existants, 0 erreur), build web local et 356
références médias vérifiés. Aucun envoi, achat, publication, compte personnel,
connexion Google/Apple réelle, iPhone physique ou TestFlight testé ici.
