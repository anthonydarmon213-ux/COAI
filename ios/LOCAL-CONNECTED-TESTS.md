# Parcours natif connecté local — 25 septembre 2026

## État actuel — remplace les limites historiques ci-dessous

### Inscription réelle locale — recontrôle du 27 septembre

`scripts/test-signup-http-local.cjs` passe via le mode `signup-http` du helper
`/tmp/coai-local-http-0924.cjs`. Le helper vérifie que SMTP pointe vers le
collecteur Mailpit local et que la confirmation email est obligatoire.
Le script refuse les URL Auth/DB non locales et les clés non demo.
Création par signUp (pas création administrateur), email réellement capturé,
lien confirmé sans suivre la redirection, puis connexion par mot de passe.
Sans authentification : 401. Sans chacun des consentements : 400 sans compte
applicatif créé. Un diagnostic fixture récent est repris malgré la casse de
l'adresse ; un code parrain inexistant ne bloque pas l'inscription.
Trois répétitions concurrentes après création conservent le prénom et le profil
modifié. La page bienvenue répond 200 sans redirection. Compte, diagnostic et
message local supprimés à la fin ; aucun email externe ni paiement.
Limites : diagnostic préinséré, pas de quiz saisi, pas de callback dans WebKit,
pas de formulaire iPhone ni de production. Les tests d'interactions simulées
et de stockage du diagnostic passent également. Code produit inchangé.

### Fiche coach : contrôle HTTP connecté réel

Le mode `admin-http` du helper local passe sur le build intégrant 311c91d.
Deux comptes Auth/PostgreSQL jetables sont créés ; une séance quotidienne avec
titre unique, ressenti BIEN_DOSEE et douleur déclarée appartient au second.
Visiteur et premier membre ne reçoivent pas ce titre et sont redirigés.
Le premier compte devient administrateur uniquement dans la base locale :
la réponse HTTP 200 contient alors titre, ressenti et intensité non précisée,
avec cache-control privé/no-store. Après retrait du rôle, la même session est
de nouveau refusée et le titre n'est plus présent. Déconnexion puis nettoyage
des deux fixtures terminés avec succès. Aucun compte réel modifié.
Preuve HTTP/Auth/DB, pas une inspection visuelle sur appareil ni la production.

### Reprise après panne locale

`testLocalNetworkRestorationLoadsLoginWithoutRelaunch` passe (xcresult
06-38-53). Démarrer serveur localhost:3050 arrêté, attendre l'erreur réelle et
les tentatives « Réessayer », puis démarrer `serve-native` pendant le test.
Le test est borné à 30 tentatives avec attente de trois secondes chacune.
Il exige erreur initiale et formulaire absent, puis retour du vrai champ EMAIL
et du bouton Google, sans relance ni HTML injecté. Aucun identifiant saisi.
Ne pas exécuter simultanément avec un test nécessitant le serveur disponible.
Cette preuve porte sur panne/reprise de navigation, pas sur une sauvegarde
interrompue en cours d'envoi ni une synchronisation hors ligne.

- Navigation web des piliers dupliquée : masquée dans l'app native, contrôlée
  sur pages connectées ; le site Safari conserve sa navigation.
- `testLocalConnectedLoginSurvivesRelaunch` : Nutrition/Récupération, recettes
  (ouvrir/fermer, Vegan, réinitialiser), prénom sauvegardé, relance et
  déconnexion. Deux passages réussis : résultats 05-33-30 et 05-36-43.
- `testLocalConnectedDailyWorkoutPersists` : bilan initial réellement saisi,
  aperçu puis confirmation, démarrage/fin de séance, ressenti sans douleur,
  relance et état accompli conservé. Résultat 06-08-29.

Ces résultats sont dans `/tmp/coai-native-connected-0925/Logs/Test/` avec le
préfixe `Test-COAI-2026.09.25_` et le suffixe `-+0200.xcresult`.

### Fixtures distinctes obligatoires

Le test de connexion utilise `ui-create`. Le test quotidien utilise
`ui-create --without-checkin` : ne pas préenregistrer sa DailySession, car cela
contournerait précisément le formulaire à vérifier. Après chaque test, contrôler
respectivement `ui-verify` ou `ui-workout-verify --checkin`, puis `ui-cleanup`.
Recréer le compte avant le test suivant, même après un échec : les cookies du
test précédent peuvent persister. Ne pas exécuter ces deux tests en parallèle
avec le même compte. Toutes ces commandes visent uniquement le helper local
et la pile jetable décrits ci-dessous, jamais les comptes réels.

Le contrôle quotidien en base exige une seule séance, les cinq valeurs saisies
(NORMALE, BON, false, 40 minutes, salle complète), completedAt et BIEN_DOSEE,
feedbackPain false. Le programme est encore précréé : ceci ne prouve pas
l'inscription, le diagnostic initial, l'achat ou la génération d'un programme.

### Distribution : contrôle actuel

Release arm64 non signée réussie (`/tmp/coai-ios-release-recheck-0925.log`).
Le 25 septembre, devicectl détecte le 13 Pro mais indique `pairingState: unpaired`
et `ddiServicesAvailable: false` ; le 17 Pro est indisponible. Une identité
Apple Development est présente, aucune identité Distribution n'est retournée.
Cela ne permet pas de conclure sur l'état de l'adhésion Developer.
L'installation physique, la signature de distribution, TestFlight et les
transactions Apple réelles restent non vérifiés. Aucun envoi autorisé par ces tests.

## Onglets Nutrition et Récupération connectés

Le test visite maintenant les deux onglets natifs après connexion réelle locale,
attend le titre propre à chaque page et refuse l'écran « Page indisponible ».
Résultat réussi : xcresult `2026.09.25_04-34-49-+0200` dans le même dossier Test.
Captures inspectées dans `/tmp/coai-pillars-attachments-0925` : titres et sélection
native cohérents, pas de débordement visible. Navigation web des trois piliers
encore répétée au-dessus du contenu : friction à simplifier séparément.
Ce test valide l'accès aux pages, pas les recettes, journaux de repas ni routines
complètes. Aucun programme nutrition/récupération injecté. Sauvegarde du prénom,
relance et déconnexion passent toujours ; contrôle DB réussi, compte nettoyé.

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
