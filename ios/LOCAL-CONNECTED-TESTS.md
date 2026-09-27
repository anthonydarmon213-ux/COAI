# Parcours natif connecté local — 25 septembre 2026

## État actuel — remplace les limites historiques ci-dessous

### Préparation des trois piliers en HTTP réel — 27 septembre, 17 h 08

`scripts/test-programme-onboarding-http-local.cjs`, lancé avec le helper local
mode `programme-http`, vérifie : profil sauvegardé par PUT, préparation refusée
sans droit, droit historique ajouté uniquement à la fixture, trois piliers
catalogue créés, deux reprises concurrentes conservant les mêmes IDs, réponses
HTTP 200 des trois pages privées, préparation refusée après retrait du droit.
Exactement trois programmes en base, statut GENERE_IA non transformé en VALIDE.
Session révoquée, utilisateur local/Auth et données associées supprimés.
Clés démo et origines loopback imposées, fournisseurs payants absents.
Complément passé : trois toutes premières demandes simultanées retournent les
mêmes trois IDs, sans doublon en base. Ce n'est ni un achat réel ni un contrôle
visuel des trois pages ; la première séance native depuis ce compte reste à tester.

### Droits du diagnostic alignés — 27 septembre, 17 h 02

La page utilise désormais contentAccessFor comme l'API de préparation : Stripe,
Apple (selon le rollout existant) et accès historiques. Seulement deux booléens
passent au composant client, aucun reçu ni détail d'abonnement. Lectures serveur
indépendantes en parallèle. En cas de vérification Apple indisponible sans autre
droit, pas de recommandation de rachat ni de lien commercial de bas de bilan.
Le compte neuf lit « Enregistrer et continuer » et sait avant le clic qu'une
offre est nécessaire. Aucun prix, droit, activation Apple ou paiement modifié.

10 cas de la vraie page serveur testés avec dépendances simulées ; politique
d'accès testée séparément (24 combinaisons de configuration/panne). Ce n'est
PAS une validation d'achat ou de restauration Apple réelle.
Parcours natif final compte neuf → diagnostic → saisie invalide/correction →
« Enregistrer et continuer » → profil vérifié en base → lien de choix d'offre :
`/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_16-59-01-+0200.xcresult`,
1 test zéro échec, 200 secondes. Fixture et email nettoyés.
Types/lint/build local et 356 références médias passent. Non publié.
À poursuivre : parcours abonné réel, profils supplémentaires, première séance
depuis diagnostic neuf, Mail/app froide, appareil physique et production.

### Diagnostic natif allégé et saisies contrôlées — 27 septembre, 16 h 52

Suppression ciblée du header/footer marketing uniquement lorsque le diagnostic
est présent dans l'app : règle cosmétique WebKit, aucun changement du site web,
des autres pages, des liens légaux dans les formulaires ou des accès.
Contrôle du menu après chargement réel, footer absent, capture inspectée :
`/tmp/coai-diagnostic-chrome-proof-0927/617B3B39-F68D-4B57-8AEB-39FF459F2F43.png`.

Âge entier, taille et poids contrôlés dès saisie selon les limites de stockage
de /api/profil (pas une évaluation médicale). Clavier décimal pour taille/poids,
erreurs accessibles, bouton Continuer désactivé si valeur invalide.
Test natif final : saisie 121 → erreur → correction 35 → questions → résultat →
profil enregistré → choix d'offre. Vérification indépendante du Profile confirme
35 ans et les autres réponses. Nettoyage exact de la fixture effectué.
`/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_16-48-49-+0200.xcresult` :
1 test, 0 échec, 191 secondes. Les essais échoués de synchronisation/navigation
et de placement du curseur du robot ne sont pas comptés comme validation.
Tests purs des valeurs numériques, sauvegarde, navigation, accès passent.
Types/lint (6 avertissements existants), build web local, 50 tests Swift,
65 contrôles core, compilation WebKit et build Release iPhone non signé passent.
Release vérifiée sans drapeau/origine locale ; 356 références médias présentes.
NON PUBLIÉ / non validé en production. iPhone 13 Pro détecté mais non appairé,
DDI indisponible ; seule identité Apple Development disponible à 16 h 49.

### Diagnostic enregistré — 27 septembre, 16 h 22

Le même test natif va désormais jusqu'à « Générer mon programme » : le compte
sans offre retrouve un lien actionnable « Choisir mon accompagnement », sans
faux programme prêt. Âge, taille, poids, sexe, objectif/activité, fréquence,
lieu et durée vérifiés indépendamment dans Profile local avant nettoyage.
Preuve finale : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_16-18-43-+0200.xcresult`.
Un test zéro échec, 205 secondes. Un essai précédent interrompu pour blocage
d'animation XCTest n'est pas compté comme succès. Aucun achat ni accès offert.

Correction additionnelle : l'échec d'enregistrement ne remet plus silencieusement
le bouton à zéro ; un message accessible annonce l'échec et invite à réessayer.
`test-diagnostic-profile-save.cjs` reproduit le défaut avant correction puis
passe sur le gestionnaire réel (réseau simulé : hors ligne, 400, 503, accès 403,
programme existant). Ce test ne prouve pas l'affichage de cette erreur sur appareil.
Types/lint/build local, 50 tests Swift, navigation/progression et 356 médias passent.
NON PUBLIÉ. Restent accès abonné réel, autres profils, appareil et production.

### Diagnostic natif depuis un compte neuf — 27 septembre, 15 h 57

`testLocalNewAccountDiagnosticReachesResult` passe : inscription réelle,
email local et retour OS, consentements, accueil, diagnostic, interruption
par Retour natif, réouverture du brouillon, Recommencer à zéro puis toutes
les questions du parcours homme sans contrainte et affichage du bilan.
Âge/taille/poids saisis au clavier ; choix explicitement validés ; écran
explicatif après fréquence inclus. Le test finit avant Générer mon programme :
il ne prouve PAS la sauvegarde du bilan dans Profile ni l'accès au programme.
La progression de diagnostic persistait entre essais : le test utilise le
bouton public de remise à zéro, pas une injection/suppression de localStorage.

Défauts corrigés : cible Recommencer à zéro mesurée à 19 points, maintenant
au moins 44 points (assertion native) ; anciennes mentions « 16 dimensions »
et « 4 capacités physiques évaluées » supprimées, car les capacités ne sont
plus demandées par le parcours actuel. Aucun résultat médical inventé :
formulations fondées sur les réponses déclarées. Pas de modification du score.
Preuve finale : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_15-55-38-+0200.xcresult`,
un test zéro échec en 127 secondes. Captures `/tmp/coai-diagnostic-final-proof-0927`.
Coordination email : `/tmp/coai-wait-email-ios-0927.cjs` attend le marqueur du
test dans un journal neuf puis ouvre le seul email local ; délai borné.
Comptes/sessions/email jetables nettoyés. Aucun fournisseur payant configuré.
Types/lint (0 erreur, 6 avertissements)/build local passent, 50 tests Swift,
navigation/progression/stockage/cadence/recommandation diagnostic verts ;
concurrence résultat testée sur PostgreSQL local avec email simulé. 356 médias présents.
À poursuivre : sauvegarde du profil puis accès programme, parcours femme et
contraintes, iPhone physique/production. En-tête marketing encore présent dans
le diagnostic natif : cohérence visuelle à améliorer. Aucun déploiement.

### Inscription complète par l'interface iPhone — 27 septembre, 15 h 13

`testLocalSignupConsentCreatesAccount` passe en 46 secondes : inscription,
confirmation email locale/retour OS, refus avec zéro consentement, refus avec
RGPD seul, puis choix explicite du second consentement et création réelle.
Accueil nominatif et bouton Faire mon diagnostic présents. Les deux cases
étaient initialement décochées. Contrôle indépendant DB : identité Auth exacte,
prénom et deux horodatages présents. Sessions révoquées puis compte applicatif,
compte Auth et unique email jetables retirés (`ui-signup-cleanup --finalized`).
Preuve : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_15-12-51-+0200.xcresult`.
Captures : `/tmp/coai-signup-complete-proof-0927`. Le titre h1 est un Other
WebKit avec plusieurs StaticText enfants ; le test initial cherchait à tort
un StaticText unique. Aucun changement produit nécessaire pour la création.
Reste : diagnostic complet depuis ce nouveau compte, appareil physique,
démarrage froid/Mail/Safari et production. Aucun achat ni publication.

### Consentements lisibles sur petit écran — 27 septembre, 15 h 05

La capture du retour email a révélé que le label flex séparait texte, lien
confidentialité et suite du texte en colonnes. Chaque texte est maintenant
regroupé dans un span min-w-0, avec case shrink-0. Texte, lien, consentements
décochés et contrôles serveur inchangés. Capture corrigée inspectée : texte
continu, bouton complet visible. Types/lint (0 erreur, 6 avertissements),
build local et tests auth/inscription passent ; 356 médias présents.
Test natif final : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_15-04-24-+0200.xcresult`,
un test zéro échec, captures `/tmp/coai-consent-final-proof-0927`.
Le test accepte la fenêtre Ouvrir ou le retour direct si iOS a mémorisé
l'autorisation ; il exige toujours la session avec l'adresse attendue.
Compte/email jetables nettoyés. Correction locale non publiée.

### Retour email via le système iOS — 27 septembre, 14 h 57

`testLocalEmailLinkReturnsToOriginalSession` passe : inscription UI réelle,
email SMTP local, confirmation Auth, ouverture du lien dédié par simctl openurl,
geste explicite Ouvrir sur la fenêtre SpringBoard, puis Finalise ton compte
avec l'adresse attendue, sans nouvelle saisie de mot de passe. Aucun cookie
injecté. Test sur simulateur QA petit écran, app déjà ouverte : un test,
zéro échec. Compte Auth confirmé et email local contrôlés puis supprimés ;
aucun compte applicatif créé. Le premier essai manquait le geste système,
le second l'inclut, sans contournement dans l'application.
Preuve : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_14-56-42-+0200.xcresult`.
Captures : `/tmp/coai-email-os-proof-0927`.
Le helper `/tmp/coai-open-email-ios-0927.cjs` doit être lancé après le marqueur
COAI_EMAIL_RETURN_READY, sur le seul simulateur validé ; ne journalise pas le code.
Préflight/cleanup SMTP via `/tmp/coai-local-http-0924.cjs` ; cleanup --confirmed.
Limites : pas de geste Mail/Safari réel, pas de démarrage à froid, pas de
finalisation UI des consentements, pas d'iPhone physique ni de production.
Le mode local dépend des arguments de lancement Debug : un démarrage OS à
froid doit être testé séparément sans prétendre conserver ces arguments.

### Raccordement email → page de retour iOS — 27 septembre

Inscription et renvoi utilisent maintenant confirmationCallback avec le
user-agent COAIiOS : destination /auth/ios-confirmation, sans changer le site.
La page autonome propose un lien explicite fr.coai.mobile vers le handler natif,
sans consommer le code. Aucun script, tracker ou cookie de session ; no-store,
no-referrer, noindex et CSP restrictive. Codes dupliqués/injectés ou paramètres
supplémentaires refusés avec une page de récupération. Destination fixe.
Revue React : lecture du user-agent uniquement dans l'événement, pas de nouveau
state/listener ni différence de rendu serveur/client. Route dédiée suivant
les consignes Next.js, sans shell marketing ni échange Auth côté navigateur.
Tests ios-email-return/auth-confirmation/signup-interactions verts. Types,
lint (0 erreur/6 avertissements), build local passent. `signup-http --native-page`
et variante --missing-verifier passent avec de vrais emails locaux et le vrai
callback serveur ; comptes/emails nettoyés. Ceci simule encore le transfert
du code entre page et callback : ouverture OS iPhone non couverte, ni production.
Avant publication, contrôler la liste des redirect URLs Supabase pour cette
nouvelle destination ; aucun paramètre du projet distant n'a été modifié.

### Réception native des liens email — implémentation partielle du 27 septembre

Le handler SwiftUI onOpenURL accepte désormais uniquement
`fr.coai.mobile://auth/email-confirmation?code=…`. Validation stricte du chemin,
autorité, code unique borné/alphanumérique URL-safe, absence de fragment et
de paramètre supplémentaire. Destination fixe /auth/callback puis /bienvenue.
Le serveur échange le code avec le cookie PKCE existant ; aucun token importé.
Avant initialisation WebKit, la destination est conservée jusqu'à installation
des règles ; en session OAuth active elle est ignorée ; doublon immédiat ignoré.
50 tests Swift passent, dont cas liens altérés/rejetés. Contrôles core/WebKit,
manifestes et Release arm64 non signée passent (`/tmp/coai-email-links-release-0927.log`).
IMPORTANT : pas encore relié à la destination email web, ni testé par ouverture
OS réelle. Ne constitue pas encore un parcours Mail → app fonctionnel complet.
Le schéma était déjà enregistré ; aucun associated domain ni achat ajouté.

### Callback email réel — 27 septembre

Le test HTTP signup suit maintenant le lien capturé jusqu'à `/auth/callback`
avec son code PKCE réel. Avec le cookie d'origine : HTTP 307 vers finalisation,
cookies de session réellement émis par le serveur, page Finalise ton compte
HTTP 200 et inscription réussie sans connexion préalable par mot de passe.
Le mode `signup-http --missing-verifier` omet ce cookie : redirection contrôlée
vers connexion, accès anonyme refusé, puis connexion par mot de passe réussie
sur l'adresse désormais confirmée. Les deux variantes passent et nettoient
leurs comptes/emails/diagnostics. Tests auth-confirmation et auth-async verts.
Pas de modification produit ; cette preuve HTTP ne démontre pas le retour
Mail → app. Aucun handler onOpenURL/associated domains trouvé dans le code iOS
actuel : le traitement ASWebAuthenticationSession existant concerne OAuth,
pas le lien email externe. Ce parcours natif reste explicitement à construire
et valider ; ne pas considérer la variante mot de passe comme son remplacement.

### Inscription dans WebKit natif — 27 septembre

`testLocalSignupReachesEmailConfirmation` saisit prénom, email et mot de passe
dans le vrai formulaire local, puis soumet avec clavier et défilement réels.
Préflight obligatoire : helper `ui-signup-preflight`, qui refuse une adresse
fixture déjà utilisée ou SMTP non local. Après le test : `ui-signup-cleanup`
exige exactement un utilisateur Auth non confirmé, un email Mailpit et aucun
User applicatif, puis supprime uniquement ces données jetables.
Premier passage 14-17-18 réussi fonctionnellement mais capture montrant le
message de confirmation hors écran : la position du formulaire était conservée.
Correctif client sign-up : retour en haut après rendu emailEnvoye, via effet
client (consignes Next.js), aucun changement de droits ni d'authentification.
Passage corrigé 14-20-45 : titre de réussite exigé visible sans geste supplémentaire,
bouton d'envoi >=44 points et pas d'erreur native. Capture inspectée dans
`/tmp/coai-native-signup-fixed-captures-0927/`. Types, lint (0 erreur/6 avertissements),
build local et test interactions signup passent ; 356 médias présents.
Cette preuve n'inclut pas l'ouverture du lien depuis Mail dans l'app, les
consentements après confirmation ni la production. Pas de publication.

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
