# Priorité COAI : prêt à soumettre à l'App Store

## État courant — 4 octobre 2026

**Séance quotidienne : confirmation de sauvegarde durcie localement.**
Le composant acceptait un corps 200 vide/invalide comme nouvel état quotidien,
avec risque de réinitialisation ou de crash sur une date invalide. Il exige
maintenant identité, date valide, repères reconnus et séance structurée avant
de remplacer l'état. Les erreurs gardent le snapshot affiché et libèrent le
bouton ; le message dit « non confirmé », pas « non enregistré ».
`test-daily-confirmation.cjs` teste le vrai gestionnaire avec transport simulé :
null/tableau/objet vide, dates invalides, repères invalides, JSON illisible,
hors ligne, erreur serveur, confirmation valide et ressenti valide : PASS.
Ressenti douleur explicite : PASS. Types, lint (six avertissements existants),
build QA séparé 132 pages, audit 356 médias : PASS.
Le test UI de connexion sur simulateur iPhone 17 vierge a révélé que le clavier
pouvait masquer le champ mot de passe sur les petits écrans. Tous les écrans
d’accès mobile commencent maintenant en haut du viewport, et les champs gardent
une marge de défilement sous le clavier ; les champs de connexion se centrent
également lors du focus. `build-for-testing` passe. `/tmp/coai-login-clean-1004.xcresult` : le
test réel ouvre l’écran de connexion, saisit email et mot de passe clavier
ouvert, se connecte, navigue vers Nutrition, Récupération et Recettes, puis
vérifie la déconnexion après relance : 1 test, 0 échec. Le premier essai était
pollué par une session déjà ouverte et un relais qui injectait volontairement
une erreur 503 ; ces deux causes sont corrigées dans les conditions du test.
Le correctif de sauvegarde quotidienne, lui, n’a pas encore été exercé par un
parcours UI iPhone avec réponse défectueuse. Aucun déploiement ni test en
production ; iPhone physique et achats Apple réels restent à valider.
`/tmp/coai-signup-keyboard-1004.xcresult` : le formulaire d’inscription complet
sur le simulateur iPhone 17 passe (1 test, 0 échec), confirmation email locale
reçue ; compte et message de test supprimés après vérification.

**Contrôle distant en lecture seule, 14 h 50.** Les 29 tables publiques COAI
ont RLS activée ; les rôles clients gardent néanmoins TRUNCATE sur 22 tables.
Aucune exploitation HTTP démontrée ni action destructive tentée. Les migrations
locales de retrait des droits restent non appliquées à distance. Aucune vue ni
fonction publique ; une politique INSERT de liste d'attente. Conseiller : 28
informations de refus RLS sans politique et un avertissement sur la protection
des mots de passe compromis. Détails dans `DATA-ACCESS-READINESS.md`.
Registres photos et tables Apple toujours absents de la liste distante.
`devicectl list devices` confirme l'iPhone antho 17 pro `unavailable` ;
la première tentative sandbox n'avait pas accès au service CoreDevice, la
lecture autorisée a fourni cet état. Aucun test physique, changement distant,
abonnement ou soumission dans ce contrôle. Le problème des envois photos admis
mais non confirmés reste ouvert, sans relâcher la preuve de suppression.

**Catalogue et persistance, 14 h 43 : contrôles locaux renouvelés.**
`/tmp/coai-exercise-catalogue-1004.xcresult` : SE, recherche du rowing exclu
(zéro résultat), recherche gainage (un résultat), clavier fermé, filtre Dos,
compteur et remise à zéro ; un test PASS, 31,593 s. Capture gainage inspectée.
Le test média est renforcé : les 59 exercices visibles exigent chacun une
photo, une vidéo et un poster locaux non vides, avec les URL du module réel.
`check-video-compatibility.cjs` : 90 fichiers H.264/yuv420p PASS (sonde de
format, pas décodage intégral ni validation du mouvement). Filtres/recherche,
absence des replis stock et composant vidéo : PASS. Pas de lecture intégrale
de toutes les vidéos dans l'app ni de validation éditoriale nouvelle.

Adaptations : test moteur avec PostgreSQL local réel PASS pour confirmations
concurrentes, rejet concurrent, rollback, versions et isolation propriétaire.
Premier essai refusé par l'accès réseau sandbox ; reprise autorisée réussie.
Fournisseur IA simulé, aucune génération payante ; fixtures aléatoires nettoyées.
Tests isolés du ressenti douleur explicite, historique d'adaptation, séries
effectuées, brouillons isolés par compte/prescription et cycle du repos PASS.
Ces tests ne remplacent pas le parcours complet de séance sur appareil physique.
Types et lint : zéro erreur, six avertissements existants. Aucune publication.

**Catalogue natif, 14 h 32 : présentation d'achat corrigée localement.**
`ProgrammePurchaseButton` distingue le marqueur natif (présentation seulement,
jamais un droit d'accès) : lien `/compte/abonnement` sans prix web ni formulaire
Stripe dans l'app ; offre web inchangée dans le navigateur. Avant hydratation,
état d'attente sans formulaire ; garde supplémentaire avant tout fetch Stripe.
Tests des rendus web/natif/SSR et de la garde réelle PASS, types/lint PASS
(six avertissements existants), build 132 pages, build iOS tests, 356 médias
présents. `/tmp/coai-native-catalogue-offer-1004.xcresult` : parcours connecté
SE, un test PASS en 73,114 s, absence du formulaire web et présence du lien
vérifiées ; capture inspectée. `/tmp/coai-offer-routing-1004.xcresult` : lien
de fixture `/pricing` ouvrant puis fermant l'écran natif PASS en 10,173 s.
Le parcours connecté local ne touche pas le lien d'abonnement : le mode local
conserve volontairement son blocage d'achat. Ces tests ne prouvent ni achat
réel Apple, ni produit disponible, ni déploiement en production. Droits serveur
et tarifs Stripe non modifiés. Aucun paiement ni publication.

**Couvertures programmes, 14 h 19 : correction locale vérifiée sur SE.**
Le bouton de couverture ciblait un élément dans une section `details` fermée.
Il ouvre désormais la cible et ses sections parentes avant de défiler, sans
déclencher d'achat. Test du gestionnaire réel : cibles verrouillée/déverrouillée
et cible absente PASS. Build web 132 pages, build-for-testing, TypeScript,
lint (zéro erreur, six avertissements préexistants), 356 médias présents : PASS.
`/tmp/coai-cover-action-isolated-1004.xcresult` : un test, zéro échec,
73,296 s ; recette, filtres récupération, toucher couverture, contenu visible,
Club. Capture extraite et inspectée. Le premier essai attendait une connexion
alors que la session locale persistait ; ce test utilise maintenant un magasin
WebKit éphémère sans supprimer la session persistante. Non publié/non vérifié
en production. L'ouverture de la cible déverrouillée reste testée unitairement,
pas encore dans le simulateur.

**Constat initial, corrigé localement ci-dessus : offre web dans le catalogue natif.** La capture du parcours
précédent montre « Acheter ce programme · 19 € » et le choix d'un programme
offert dans l'app. Ce n'est pas une preuve de paiement Apple fonctionnel.
Vérifier le routage natif et la présentation des droits avant toute distribution,
sans modifier les tarifs Stripe ni inventer de produit Apple. Aucun achat effectué.

**Nutrition / récupération / Club, 13 h 56 : parcours connecté local réussi.**
`/tmp/coai-nutrition-recovery-club-1004.xcresult` : un test SE/iOS 26.5,
zéro échec, 68,688 s. Connexion de la fixture préexistante (non écrasée), filtre
petit-déjeuner, ouverture de recette avec ingrédients/préparation, catalogue
récupération et ouverture/fermeture des filtres, puis Club avec accès à la
préparation de question. Captures récupération et Club extraites et inspectées.
Aucun message WhatsApp, réservation, choix de programme ni achat déclenché.
Le compte fictif préexistant est conservé pour les autres contrôles locaux.
Tests catalogue : 189 recettes, 189 images locales déclarées présentes,
120 combinaisons de filtres, rendus avec/sans image, intégrité des listes : PASS.
Rendus cibles nutritionnelles, listes nutrition/récupération incomplètes et
Club : PASS. Ces preuves ne valident pas la justesse nutritionnelle/allergènes,
la correspondance visuelle de chaque plat, l'activation d'un programme de
récupération, la date du direct ou le comportement en production.

**Distribution, contrôle frais à 13 h 49.**
`bash scripts/check-ios.sh --device-release` termine avec succès : 51 tests
Swift, 65 contrôles core, compilation effective des règles WebKit macOS sans
chargement réseau, syntaxe/plists/schéma, cinq cas négatifs de confidentialité,
puis build Release iphoneos arm64 sans signature. Manifeste inclus à l'identique,
nom COAI, plateforme iPhoneOS ; marqueurs de fixtures, localhost et ressources
StoreKit de test absents selon les gardes du script.
Binaire : `ios/DerivedDataDevice/Build/Products/Release-iphoneos/COAI.app`.
Ce n'est ni une archive signée, ni une installation physique, ni une validation
App Store. Les contrôles de chaînes ne constituent pas un audit de sécurité total.

App Store Connect : l'onglet ancien affichait « Utilisateurs et accès » mais
la navigation réelle vers `/apps` redirige vers
`/login?targetUrl=%2Fapps&authResult=FAILED` et le formulaire de connexion Apple.
Session expirée/inutilisable constatée ; reconnexion demandée, sans saisir de
secret ni modifier le compte. Catalogue, adhésion et accords restent non vérifiés.
Mac verrouillé constaté par l'inventaire des applications ; le navigateur intégré
et les compilations locales restent utilisables. Aucun achat/upload/soumission.

**Diagnostic, lien unique : vérifié dans l'app à 13 h 39.**
Serveur natif local recompilé et relancé, tests iOS recompilés.
`/tmp/coai-diagnostic-single-offer-1004.xcresult` : inscription, confirmation
email via services locaux, consentements, diagnostic complet, relance, reprise
et sauvegarde ; un test, zéro échec, 146,600 s. L'assertion vérifie explicitement
l'absence de « Voir les accompagnements » quand « Choisir mon accompagnement »
est présent. Capture finale extraite et inspectée : un seul lien.
Contrôle indépendant des réponses exactes et des deux consentements en base,
puis suppression de cette seule fixture Auth/profil/email : PASS.
Build Next 132 pages, build-for-testing, types, lint sans erreur (six warnings
existants), deux tests diagnostic et 356 références médias présents : PASS.
La validation locale visuelle demandée ci-dessous est donc effectuée ; restent
la validation sur appareil physique et la publication autorisée en production.

Fin du diagnostic : doublon de liens vers les offres supprimé localement quand
le résultat de sauvegarde propose déjà « Choisir mon accompagnement ».
La sortie demandée en bas de page reste présente avant sauvegarde et lorsque
le premier lien n'est pas affiché. Aucun changement de prix ou de droits.
`test-diagnostic-offer-exit.cjs` exécute la condition réelle de rendu dans les
différents états ; `test-diagnostic-profile-save.cjs` conserve les scénarios
d'échec/reprise et refus d'accès. PASS, types/lint sans erreur, build QA réussi.
Validation visuelle du correctif dans l'app et déploiement encore À FAIRE ;
le serveur iOS 3050 conserve intentionnellement son build précédent.

**Contrôles natifs SE à 13 h 21 / 13 h 25 : quatre tests, zéro échec.**
`/tmp/coai-keyboard-regression-1004-current.xcresult` : connexion publique,
email non couvert par le clavier, cinq onglets masqués pendant la saisie ;
inscription, saisie fictive sans envoi, mot de passe affiché/masqué et bouton
accessible. Deux captures extraites et inspectées. Ces tests anonymes utilisent
`coai.fr` dans le conteneur natif de développement, pas le serveur local ; aucun
compte créé, session personnelle modifiée ou achat envoyé.
`/tmp/coai-subscription-accessibility-1004-current.xcresult` : écran natif
d'abonnement indisponible en XXXL, liens empilés et cibles de 44 points, fermeture
possible ; retour au compte depuis l'offre indisponible. Fixture de navigation
interne, pas validation d'un achat StoreKit ni de prix en production.
Ce sont des simulateurs SE/iOS 26.5, pas un iPhone physique ni un binaire distribué.

Rapport antérieur d'inscription/diagnostic recontrôlé :
`/tmp/coai-native-diagnostic-after-rls-1004-1258.xcresult`, un test réellement
exécuté et réussi, zéro échec ou test ignoré. Le parcours local inclut création
du compte, consentements, diagnostic, relance et sauvegarde ; ne pas le confondre
avec les quatre contrôles anonymes ci-dessus.

Complément de régression local : restrictions directes confirmées sur 24 tables,
export serveur toujours utilisable. Suite HTTP complète réussie, y compris
historique quotidien, PDF, programme concurrent et panne Storage lors d'une
suppression (aucun faux succès ni perte du compte). Fixtures corrigées pour
terminer réellement l'inscription avec consentements, cookies adaptés au serveur
natif localhost, tableau de bord testé sans redirection masquée.
Types OK ; `npm run lint` : zéro erreur, six avertissements existants.
Build QA séparé : 132 pages ; 356 références médias, aucun fichier manquant.
`next lint` n'existe plus dans Next 16 : utiliser la commande ESLint du projet.
Aucune migration distante, publication ou validation sur appareil physique.

Photos : une réservation abandonnée AVANT admission au stockage ne bloque plus
la suppression. Admission atomique unique, fermeture durable et refus du vieil
appelant testés avec PostgreSQL/Storage locaux réels, dont processus interrompu.
Douze scénarios passent ; les cas incertains APRÈS admission restent bloquants.
Migration locale préparée, non déployée. Voir `PHOTO-DELETION-READINESS.md`.
Régressions HTTP photo/suppression, réponses perdues et retraits d'avatars,
build Next 132 pages, types/lint et 356 médias réussis.

**Point sécurité local corrigé, distant non vérifié :** audit du 4 octobre révèle 17 tables
anciennes sans RLS avec des droits anon/authenticated dans la base de test.
Lecture HTTP anonyme indûment autorisée reproduite, puis migration locale
`20261004104308_secure_legacy_server_tables` : RLS + révocation des droits clients.
Lectures directes refusées pour les deux rôles sur les 17 tables, CRUD `users`
refusé, export serveur authentifié et régressions HTTP photo/suppression réussis.
Conseiller sécurité local sans warning/error après correction. Aucun constat de
configuration distante n'est déduit de ce test local ; migration non déployée.
Voir `DATA-ACCESS-READINESS.md` pour le périmètre et les limites.

**Retour réseau sans relance : PASS à 12 h 17**, iPhone 17 Pro simulé.
`testLocalNetworkRestorationLoadsLoginWithoutRelaunch` : serveur 3050 arrêté,
erreur réelle affichée, puis serveur rétabli pendant les tentatives explicites.
La page de connexion et son champ email reviennent, le panneau d'erreur disparaît,
sans relancer COAI. Un test, zéro échec (69,425 s, incluant l'attente volontaire
du serveur), `/tmp/coai-network-restoration-1004-1215.xcresult`.
Cela couvre la reprise anonyme locale, pas une session expirée en production.
Compilation Release iphoneos arm64 actuelle également réussie, sans signature,
dans `/tmp/coai-release-1004-current` ; ce n'est pas une archive distribuable.

**Rotation SE rétablie et vérifiée à 12 h 06.** Après redémarrage du seul
simulateur QA SE, sans effacement ni changement produit, le même test
`testNativeNavigationWithLargeTextAndRotation` passe (17,230 s).
Rapport `/tmp/coai-se-rotation-after-reboot-1004-1205.xcresult` : un test,
zéro échec. Portrait → paysage → portrait en XXXL, cinq onglets sans
chevauchement, cibles de 44 points minimum et accès aux réglages vérifiés.
Capture paysage inspectée. Ce résultat remplace le statut rotation non validée
ci-dessous ; il ne couvre ni tous les écrans ni un appareil physique.

**Réseau indisponible vérifié à 12 h 07.** Serveur local 3050 réellement arrêté :
`testUnavailableNetworkKeepsRecoveryControlsAccessible` passe (9,929 s),
rapport `/tmp/coai-offline-recovery-1004-1207.xcresult` : un test, zéro échec.
Message d'erreur, bouton Réessayer et minuteur natif restent utilisables.
Le serveur a ensuite été relancé. Ce test ne valide pas encore le retour du
réseau sans relancer l'application. Aucun paiement ni publication effectué.

Comparaison à 12 h 01 : le même `testNativeNavigationWithLargeTextAndRotation`
**passe sur iPhone 17 Pro simulé**, 17,7 s, même binaire, aucun correctif produit.
Portrait → paysage gauche → portrait, cinq onglets accessibles sans chevauchement,
44 points minimum, réglages et fermeture Explorer accessibles.
Rapport `/tmp/coai-rotation-iphone17-control-1004-1200.xcresult`.
Avec l'échec indépendant de Safari sur SE, cela pointe vers l'état de ce
simulateur SE, sans valider pour autant le paysage petit écran. Ce dernier
contrôle reste à refaire après diagnostic de l'environnement ; pas d'iPhone
physique couvert par cette preuve.

Contrôle indépendant rotation à 11 h 57 : Safari reste lui aussi en portrait
sur le même SE, après demande LandscapeLeft. Capture inspectée, sans dialogue
système bloquant visible. `testSimulatorSafariRotationControl` échoue réellement
(1 test), rapport `/tmp/coai-safari-rotation-enumerated-1004-1156.xcresult`.
La première invocation avait exécuté zéro test et n'est pas une preuve ; la
découverte Xcode puis l'identifiant exact avec parenthèses ont permis l'exécution.
Ce constat oriente vers l'environnement/simulateur, sans prouver l'absence de
défaut COAI. Contrôle sur autre simulateur/appareil requis. Aucun verrouillage
portrait ajouté au produit, assertion paysage conservée. Build de tests, types,
lint sans erreur et 356 références médias présentes vérifiés.

**Rotation grand texte : NON VALIDÉE au 4 octobre 11 h 47.**
`testNativeExplorerReplacesWebSidebarWithoutHidingContent` passe, mais
`testNativeNavigationWithLargeTextAndRotation` échoue au passage paysage :
la zone WebView reste en portrait. Reproduit dans le lot
`/tmp/coai-native-navigation-rotation-1004-1139.xcresult` puis en test isolé
`/tmp/coai-rotation-isolated-1004-1145.xcresult` (pas seulement l'effet de la
feuille d'abonnement précédente). Vidéo inspectée : écran effectivement portrait.
Le plist compilé autorise Portrait/LandscapeLeft/LandscapeRight ; aucune correction
produit déduite de ce seul constat. Les cinq onglets restent accessibles et
dans l'écran en portrait XXXL. Cause application/simulateur à distinguer par
un contrôle d'orientation indépendant ; ne pas supprimer l'assertion paysage.

**Parcours natif complet corrigé : PASS le 4 octobre à 11 h 31**, 147,2 s,
`testLocalNewAccountDiagnosticReachesResult` sur SE/iOS 26.5, serveur 3050
reconstruit avec les corrections actuelles. Inscription fictive neuve,
confirmation SMTP locale, consentements, questionnaire, résultat non enregistré,
fermeture/relance, Explorer → Mon bilan COAI, reprise du résultat puis sauvegarde.
Rapport `/tmp/coai-full-diagnostic-explorer-1004-1126.xcresult`.
Contrôle indépendant en lecture seule : huit valeurs attendues et les deux
consentements présents en base locale. Captures du raccourci d'enregistrement
et de la fin inspectées : contenu lisible, navigation basse distincte ; deux
liens d'accompagnement redondants restent visibles à la fin (polish à traiter).
Ce PASS remplace l'échec de navigation du précédent scénario, pas les autres
gates : achats Apple réels, appareil physique et production non validés.

Régression abonnement native le 4 octobre à 11 h 36 : deux tests réussis
(`testWebOfferLinkOpensNativeSubscription`, `testSubscriptionSmallScreenLargeText`),
rapport `/tmp/coai-subscription-navigation-1004-1134.xcresult`.
Lien web de fixture → écran natif → fermeture, et SE en texte accessibilité XXXL :
Réessayer/Conditions/Confidentialité accessibles, zones de 44 points minimum,
liens légaux empilés et fermeture utilisable. Capture inspectée. Ces tests
utilisent une fixture et l'état d'indisponibilité, pas un achat ni un catalogue
Apple réel ; ils ne prouvent pas le paiement en Sandbox ou en production.

Reprise native du diagnostic : accès permanent « Mon bilan COAI » ajouté à
Explorer. Le précédent scénario complet a échoué après relance parce qu'il
cherchait le bouton de bienvenue sur la page entraînement, point d'entrée réel
du processus. Le scénario suit maintenant le menu natif et s'arrête explicitement
si la reprise manque. Test ciblé sur le brouillon réellement laissé par ce
scénario : **PASS**, résultat complet restauré, bouton d'enregistrement présent,
pas de retour à la question âge, sans injection de stockage ni nouvelle saisie.
Rapport : `/tmp/coai-existing-diagnostic-explorer-1004-1115.xcresult` (10,2 s).
Build-for-testing réussi ; 51 tests Swift, 65 contrôles directs, règles WebKit,
types et lint (six avertissements existants) passent ; 356 médias référencés,
aucun fichier manquant. Cela ne valide ni la sauvegarde finale du bilan natif,
ni le scénario complet corrigé, ni l'appareil physique, ni la production.
L'inspection manuelle du simulateur est bloquée par le verrouillage du Mac ;
XCTest reste exécutable. Aucune publication effectuée.

Vérification suivante : **PASS** sur `testLocalExistingDiagnosticResultCanBeSaved`
(13,7 s), même compte fictif et même vrai brouillon. Relance → Explorer → bilan →
reprise → raccourci d'enregistrement → confirmation « Choisir mon accompagnement ».
Aucun accès fictif à la première séance accordé au compte sans abonnement.
Rapport : `/tmp/coai-existing-diagnostic-save-1004-1119.xcresult`.
Le brouillon est désormais consommé : ces deux tests ciblés nécessitent un nouveau
scénario préparatoire pour être rejoués. Lecture indépendante du profil en base
et parcours complet corrigé restent à faire ; pas de validation en production.

Lecture indépendante locale effectuée après ce test : âge 35, taille 178,
poids 75, sexe Homme, 45 minutes, 3 séances/semaine, salle de sport et objectif
prise de muscle / journée mixte correspondent aux saisies du scénario natif.
Les deux consentements du compte sont présents. Contrôle en lecture seule
réussi, puis vérification identité Auth/profil/consentements par le nettoyeur
local. Compte fictif `coai-ui-signup-20260927@example.test` et son seul courriel
SMTP local supprimés ; précontrôle d'adresse disponible réussi. Aucun compte
réel concerné. Le serveur natif local 3050 a été arrêté explicitement après la
fin des tests pour reconstruire les corrections courantes avant le nouvel E2E.

Présentation des exercices : écart observé dans le navigateur QA entre les
77 annoncés dans la découverte et les 59 réellement proposés par le catalogue
filtré. Le chiffre historique a été retiré du descriptif, qui renvoie maintenant
au nombre à jour du catalogue. Aucun exercice ni filtre média modifié.
Build QA, types et lint sans erreur ; texte corrigé vérifié dans le navigateur
connecté sur 3051. Pas de publication ni validation en production.

Même protection ajoutée au clic « Retour au tableau de bord » après bilan
enregistré : test du véritable gestionnaire JSX en stockage refusé, échec avant
et réussite après. Types, lint sans erreur (six avertissements existants) et
build QA 132 pages réussis. Les deux seuls accès directs au stockage dans ce
composant sont désormais protégés. Vérification simulée, pas Safari physique.

Clic de création de compte après diagnostic : exception reproduite lorsque
`localStorage.setItem` refuse le marqueur facultatif d'introduction. Ce seul
marqueur est maintenant protégé ; aucun changement de navigation ou de droits.
Test exécutant le véritable gestionnaire extrait du composant : échec avant,
réussite après, stockage normal et refusé, transfert des réponses toujours
tenté. Build QA complet réussi (132 pages), types et lint vérifiés. Ce test
simule le refus de stockage ; pas encore de preuve sur appareil ou en production.

Contrôle interactif connecté complété sur 3051 : les onze questions ont été
remplies via l'interface avec le compte fictif distinct du XCTest. Résultat
complet affiché, page rechargée avant enregistrement, puis « Continuer mon
diagnostic » : le résultat complet et l'action d'application sont restaurés,
sans refaire le questionnaire. Application du bilan : confirmation « Profil
mis à jour », retour au tableau de bord puis lecture de `/compte/profil`.
Le profil rechargé affiche bien 39 ans, 180 cm, 78 kg, intermédiaire, prise de
muscle, journée mixte, 3 séances de 45 minutes, salle de sport, repas structurés
et bon sommeil. Preuve interactive locale de persistance via le profil ; pas
une validation de production ni du transfert pré-inscription inter-comptes.
Le compte fictif reste disponible pour la suite des vérifications.

Build web des corrections de diagnostic réussi le 4 octobre dans `.next-qa`
(132 pages générées), sans remplacer `.next` du parcours XCTest actif.
Option locale `COAI_LOCAL_QA_BUILD=1`, limitée à `http://localhost:3051` et
refusée sous Vercel ; configuration normale inchangée lorsque l'option est absente.
Tests de configuration : défaut inchangé, sortie isolée correcte, origine distante
et environnement Vercel refusés. `tsconfig.qa.json` isole les types générés.
Services Auth/PostgreSQL locaux uniquement. Vérification interactive toujours
requise ; ce build ne constitue ni déploiement ni validation de production.
Premier contrôle interactif de `.next-qa` réussi dans le navigateur intégré,
port 3051 : visiteur anonyme, valeurs fictives 38 ans / 179 cm / 77 kg,
passage à la question 2, rechargement, proposition de reprise, retour à la
question 2 puis retour à la question 1 avec les trois valeurs intactes.
Cela vérifie le vrai stockage navigateur anonyme, pas encore la reprise connectée,
la séparation entre deux sessions ni le transfert pré-inscription complet.
Contrôle connecté sur le même navigateur et la même origine 3051 : connexion
au compte fictif distinct `coai-ui-20260924-http@example.test`. L'ancien brouillon
anonyme n'est pas proposé ; les champs du nouveau diagnostic sont vides.
Saisie 39 ans / 180 cm / 78 kg, étape 2, rechargement et reprise : étape 2
retrouvée puis valeurs intactes à l'étape 1. Compte fictif conservé provisoirement
pour poursuivre jusqu'au résultat/enregistrement ; aucune réponse nouvelle
enregistrée dans le profil à ce stade. Le compte XCTest d'inscription reste distinct.

Compilation iOS Release du 4 octobre à 09 h 40 réussie, destination générique
iPhoneOS, signature désactivée, sortie isolée `/tmp/coai-release-check-20261004`.
Paquet inspecté : `COAI`, `fr.coai.mobile`, 0.1.0 (1), arm64, iOS minimum 16.0,
famille iPhone, icône référencée et quatre descriptions de permissions présentes.
PrivacyInfo.xcprivacy embarqué et syntaxiquement valide. Recherche de chaînes
`localhost:3050`, `COAILocalIntegration`, `COAI · test local` dans le binaire :
aucune correspondance. Taille locale du paquet 2,1 Mo, hors contenu web distant.
Cette preuve couvre la compilation native, pas les nouvelles modifications web,
ni l'exhaustivité des déclarations de collecte, la signature, l'installation,
une archive distribuable ou l'approbation Apple. Aucune soumission effectuée.

Confidentialité des questions intermédiaires : défaut reproduit par test de
stockage (le compte B pouvait lire le brouillon de A avant le résultat).
Correctif en cours : propriétaire explicite à chaque étape, brouillon anonyme
distinct du contexte connecté, expiration 24 h pour toutes les étapes ; anciens
brouillons sans propriétaire retirés à la lecture plutôt qu'attribués arbitrairement.
Cela impose de recommencer ces anciens brouillons non enregistrés, sans toucher
aux profils sauvegardés. Tests de stockage et effets réels réussis avant/après,
TypeScript et lint réussis (six avertissements existants). Build et vérification
interactive du nouveau correctif restent à faire : le serveur utilisé par le
test natif en cours reste volontairement sur 97b125d. Le pont pré-inscription
est distinct et n'est pas couvert par cette correction de progression.
Le lecteur de `/bienvenue` a également été adapté : identifiant du compte
transmis depuis le serveur dans les deux branches de l'accueil, composant
remonté si le compte change. Test du composant : A retrouve sa reprise, B
ne la reçoit pas, aucun PUT profil ni génération déclenché pour cette reprise.
Les scénarios d'erreur de bilan et de génération restent réussis ; TypeScript
et lint repassés après ces changements. Revue React : identifiant primitif,
pas d'objet utilisateur complet ajouté aux props, stockage indisponible toléré.
La page diagnostic utilise maintenant elle aussi une clé liée à l'identité :
un changement de compte remonte le questionnaire au lieu de conserver ses
réponses en mémoire sous le nouveau propriétaire. Test de structure exécutant
l'expression de clé : échec avant correction, identités anonyme/A/B distinctes
après correction. Cela ne remplace pas un test interactif de changement de compte.

Pont pré-inscription : enveloppe versionnée et expiration 24 h ajoutées localement.
Les anciens transferts sans date fiable, le JSON cassé et les enveloppes invalides
sont retirés à la lecture ; les profils déjà sauvegardés ne sont pas modifiés.
Test de stockage en échec avant changement, réussi après ; tests ActivationFlow
et typage réussis. Enveloppe portée à v2 : adresse destinataire normalisée,
comparée à l'adresse du compte fournie par la page serveur avant toute lecture.
Une autre adresse ou un lecteur sans adresse ne reçoit aucune réponse ; le
transfert valide est conservé pour son destinataire. Test combinant le vrai lecteur
et le vrai composant : B n'émet aucun PUT et A conserve ses réponses. Cette
association locale évite la réattribution accidentelle ; elle n'est pas un mécanisme
d'autorisation serveur. Si Google utilise une autre adresse, aucun transfert
automatique : l'accueil sans diagnostic explique la différence, propose de se
reconnecter avec l'adresse d'origine ou de commencer son propre diagnostic.
Test du rendu du composant réussi : message et CTA présents, aucune adresse
destinataire ni réponse étrangère affichée, aucun PUT émis. Rendu interactif
dans l'application encore à vérifier.
Préremplissage email : un nouveau brouillon sans adresse conservait celle du
précédent dans sessionStorage. Régression reproduite, puis corrigée : une adresse
absente ou invalide efface uniquement cette ancienne suggestion. Tests de stockage
et d'activation réussis ; pas de modification des adresses des comptes en base.
Build et test interactif de ce changement restent à faire après le test natif actif.

À 09 h 05 le 4 octobre, contrôle physique en lecture seule : iPhone 17 Pro
`available (paired)` ; `COAI test`, identifiant `fr.coai.mobile`, version 0.1.0,
build 1 toujours installé. Cela remplace le constat d'indisponibilité du 2 octobre,
mais ne prouve pas sa signature encore valide ni les correctifs locaux installés.
Aucune signature renouvelée, installation ou interaction avec un compte réel.
Lecture du profil embarqué dans `ios/DerivedDataDevice/Build/Products/Debug-iphoneos/COAI.app`
: expiration le 19 septembre 2026 à 21:22:02 UTC. Ce dossier de compilation
est donc périmé ; cette lecture ne permet pas de dater le profil de l'application
actuellement installée sur l'iPhone, ni de conclure au statut de l'adhésion Apple.

Le test natif du 2 octobre n'a pas validé le diagnostic : le retour Safari
est resté sur « Ouvrir dans COAI test ? ». L'email avait bien été confirmé,
mais le test cherchait le bouton dans `alerts` alors qu'iOS le présente comme
une feuille. Constat visuel confirmé le 4 octobre ; compte jetable et email
nettoyés après révocation. Harness corrigé : lecture du seul email local
attendu, validation de son URL locale, ouverture Safari et bouton `Ouvrir`
indépendant du type de fenêtre, attente asynchrone bornée et retour immédiat
si la session ne revient pas. Compilation des tests réussie. Nouvelle exécution
en cours : `/tmp/coai-diagnostic-safari-sheet-1004-0845.xcresult`.
Ne pas compter ce parcours réussi avant son résultat et le contrôle en base.
À 08 h 51, le journal confirme le clic sur la feuille Safari et l'arrivée sur
« Finalise ton compte » avec l'adresse jetable attendue : retour dans la session
d'origine réussi. Le test continue ensuite ; nombreuses attentes XCTest de
60 s sur les animations, qui ne prouvent pas une latence utilisateur équivalente.
Contrôles indépendants du 4 octobre : 51 XCTest unitaires Swift, 65 contrôles
directs, règles WebKit compilées, configuration de confidentialité et cinq cas
négatifs réussis. Navigation/cadence/saisies/stockage pré-inscription restent
réussis ; audit fichiers média : 356 références, zéro manquante (pas une preuve
de correspondance visuelle). Pas de publication ni de validation physique.

## Preuves précédentes — 2 octobre 2026

Contrôle interactif navigateur local du correctif diagnostic 97b125d réussi :
onze étapes avec compte fictif existant, résultat non sauvegardé, rechargement,
reprise directe du même bilan puis enregistrement. PostgreSQL confirme les
valeurs distinctes du profil initial : 37 ans, 181 cm, 79 kg, 30 minutes,
trois séances/semaine et objectif exact. Un seul programme préexistant conservé,
aucune régénération. Nouveau rechargement : plus de proposition de reprise.
Aucune erreur console capturée. Compte fictif et sessions nettoyés.
Test iOS du diagnostic enrichi avec fermeture/relance avant sauvegarde ; son
exécution et la validation physique/production restent à réaliser.

Diagnostic connecté : perte du brouillon reproduite au niveau des effets réels
du composant (résultat affiché → effacement avant sauvegarde). Correctif local :
résultat reprenable directement avec ses réponses ; effacement seulement après
réponse positive de sauvegarde du profil, même si l'accès programme est ensuite
refusé. Échec réseau/HTTP de sauvegarde : brouillon conservé. Le nouveau résultat
reprenable est lié au compte et expire après 24 h d'inactivité ; il n'est pas
lisible par le lecteur anonyme ou un autre compte. Cela ne constitue pas un
audit complet des anciens brouillons de questions ou du pont pré-inscription.
Tests des effets/gestionnaire avant-après, stockage, navigation, saisies physiques,
TypeScript, lint (six avertissements) et build 132 pages réussis. Aucun test
interactif de ce nouveau correctif ni validation production à cette étape.
Prochaine preuve nécessaire : résultat → fermeture/reprise → sauvegarde dans
le profil, avec compte fictif, puis contrôle indépendant des réponses en base.

Correction des bornes de série désormais compilée localement : test de
composant avant/après, brouillons, échelle du graphique, TypeScript, lint
(six avertissements existants), build 132 pages et audit 356 médias réussis.
Serveur local redémarré avec ce correctif après fin du test natif précédent.
Contrôle interactif local du correctif d123a89 réussi le 2 octobre : les
corrections charge/répétitions à 10001 laissent la série à 10 × 20 kg ; une
correction valide à 8 × 12,5 kg est conservée après rechargement, avec le message
« Brouillon retrouvé ». Enregistrement puis second rechargement : séance
retrouvée dans « Reprendre une séance passée », repère exact 8 × 12,5 kg,
volume 100 kg et champs préremplis correctement, sans recopier les séries
comme déjà réalisées. Aucune erreur console capturée. Compte fictif local
uniquement ; validation sur iPhone physique et en production encore à faire.
Vérification PostgreSQL indépendante : exactement une séance REPCOUNT, un
exercice et une série 8 × 12,5 kg. Compte fictif et sessions ensuite nettoyés.

Recontrôle iOS du 2 octobre à 12 h 28 : `bash scripts/check-ios.sh --device-release`
réussi (51 XCTest Swift, 65 contrôles directs, compilation réelle des règles
WebKit macOS hors réseau, configuration de confidentialité et cinq cas négatifs).
Release arm64 iPhone compilée sans signature ; aucune installation, archive,
publication ou validation App Store déduite de ce résultat.

Contrôle profil → bibliothèque relancé avec Auth/HTTP/PostgreSQL locaux réels :
les requêtes concurrentes conservent les trois mêmes programmes, les profils
hors cadre sont orientés vers la relecture et la révocation d'accès est respectée.
Test renforcé pour inspecter le contenu persisté, pas seulement les statuts HTTP :
trois séances avec exercices et prescriptions, quatorze jours de repas avec
portions, quatorze jours de récupération et protocoles renseignés. Réussi ;
ce contrôle structurel ne vaut ni approbation éditoriale ni vérification des médias.
Fixtures nettoyées. TypeScript, lint (six avertissements), build 132 pages et
audit 356 chemins média réussis. iPhone physique toujours `unavailable` à 12 h 30.

Test de reprise RepCount terminé avec succès à 03 h 01 :
`/tmp/coai-repcount-relaunch-1001-2120.xcresult`, 1 test, zéro échec.
Saisie de deux exercices et notes, fermeture/reprise du brouillon, sauvegarde,
seconde relance et présence de l'historique vérifiées par XCTest. Contrôle
indépendant PostgreSQL réussi : une seule séance REPCOUNT, deux exercices,
trois séries exactes (10 × 20 kg deux fois, 10 × 12,5 kg une fois), notes exactes.
Compte fictif et sessions nettoyés. Capture extraite dans
`/tmp/coai-repcount-relaunch-proof-1002` inspectée : navigation lisible mais détail
de l'historique sous le pli ; elle ne prouve pas seule la lisibilité des séries.
Durée XCTest 20 415 s, incluant les longues attentes d'animations signalées ;
ne pas interpréter cette durée comme une latence du parcours utilisateur.
Ce test porte sur le build précédent, pas sur les bornes de correction ajoutées
pendant son exécution. Aucune validation production ou appareil physique.

## Historique — 1er octobre 2026

À 21 h 20 : test natif RepCount reprise de brouillon puis historique après
relance lancé sur le simulateur petit écran, résultat attendu dans
`/tmp/coai-repcount-relaunch-1001-2120.xcresult`. Compte fictif local créé ;
à vérifier indépendamment avec `repcount-native-verify`, puis nettoyer avec
`ui-cleanup`. Exécution encore en cours, attentes XCTest d'animations de 60 s.
Ne pas reconstruire le serveur pendant ce parcours et ne pas le compter réussi.
Contrôle HTTP/Auth/PostgreSQL réalisé pendant l'attente sur deux autres comptes
fictifs : trois POST concurrents produisent une seule séance (201/200/200),
lecture par jeton réussie, autre compte isolé, jeton invalide refusé, JSON
malformé refusé sans altérer la séance. Fixtures nettoyées. Premier essai 401
causé par le harness utilisant 127.0.0.1 pour Auth alors que le build utilise
localhost ; variante `verify-native` du harness local ajoutée pour aligner
les cookies, puis contrôle réussi. Aucun changement d'authentification produit.

Pendant cette exécution, défaut distinct reproduit par le test de composant :
la correction d'une série acceptait 10001, alors que le brouillon refuse les
charges/répétitions supérieures à 10000. Correction des bornes de saisie pour
préserver la reprise ; test avant/après réussi, types et lint réussis.
Cette modification source n'est pas dans le serveur compilé testé actuellement.
Build, contrôle interactif et validation production de ce correctif à faire.

Contrôle complémentaire de l'échelle RepCount : le rendu réel du composant
ChandeliersCharges produisait neuf coordonnées SVG `NaN` et une graduation
`Infinity` pour une charge historique finie égale à `Number.MAX_VALUE`.
La marge de 10 % de l'échelle est maintenant bornée à la capacité numérique,
sans modifier les valeurs enregistrées. Nouveau test
`scripts/test-chandeliers-scale.cjs` réussi pour zéro, décimales et valeurs
extrêmes : coordonnées finies dans le cadre SVG, charge originale conservée.
Types, lint (six avertissements existants), build 132 pages et audit 356 médias
réussis. Preuve limitée au rendu serveur du composant ; contrôle interactif,
iPhone et production toujours à faire. Aucun déploiement.

Après 20 h 55 : débordement numérique RepCount reproduit avec une ancienne
série `2 × 1e308` : volume `Infinity`, malgré des opérandes finis. Le calcul
filtre désormais une série dont le produit ou la somme déborde, sans modifier
les logs stockés. Test avant/après : série valide `10 × 20` conservée à 200,
et addition de deux volumes extrêmes maintenue finie. Tests maintien/rendu,
TypeScript, lint (six avertissements), build 132 pages et audit 356 médias
réussis. Vérification de ce cas dans l'interface native/production encore
à faire ; ce contrôle ne valide pas toutes les échelles des graphiques.

À 20 h 55 : journal avec historique malformé vérifié dans l'app simulée SE :
`/tmp/coai-journal-malformed-1001.xcresult`, un test réussi, zéro échec.
Les deux captures de `/tmp/coai-journal-malformed-proof-1001` ont été inspectées :
avertissement lisible, maintien 45 s et série 10 × 20 kg visibles au-dessus de
la barre native. L'exécution a duré 1 281 s car XCTest attendait 60 s entre
gestes pour les animations ; ce n'est pas une mesure de latence utilisateur.
Contrôle PostgreSQL indépendant réussi : une seule séance et JSON strictement
inchangé, y compris les entrées invalides. Compte fictif et sessions nettoyés.
Le navigateur local compilé montre aussi le journal sans erreur de console.
Les tests de cache privé, réponses d'historique concurrentes, profil appris,
garde d'adaptation et maintien RepCount passent avec dépendances simulées.
Correctif local `7bb96e5` ; aucune validation production ni publication.

À 20 h 33 : nouveau plantage du journal reproduit hors ligne avec un historique
contenant un exercice null : `Cannot read properties of null (reading 'sets')`.
Correction locale : filtrage des détails JSON illisibles, conservation des
mesures valides et des anciennes séries, exclusion des nombres négatifs/non
finis et totaux débordants, avertissement explicite si détails incomplets.
Aucune modification des séances stockées. Le test réel de rendu passe ensuite
avec maintien 45 s, séries 10 × 20 kg et ancien format ; total valide 440 kg.
Types, lint (six avertissements existants), build 132 pages, progression et
356 médias passent. Test natif lancé dans
`/tmp/coai-journal-malformed-1001.xcresult` : en cours, ralentissement XCTest
attendant la fin d'animations ; ne pas compter ce parcours comme validé.
Fixture locale dédiée à nettoyer après vérification indépendante. Aucune
validation en production, aucun déploiement.

Complément après les contrôles de 20 h 07 : navigation journal immédiatement
après connexion réussie dans `/tmp/coai-journal-immediate-login-1001.xcresult`
(24 s), sans attente de la destination finale. Le conflit de redirection
supposé plus bas n'est pas reproduit avec un ciblage précis du menu natif ;
aucune modification de l'authentification sur cette seule hypothèse.
Contrôle indépendant des mesures PostgreSQL réussi et compte fictif nettoyé.
`check-ios.sh --device-release` réussit : 51 tests Swift, 65 contrôles directs,
validation des manifests et compilation Release iPhone arm64 non signée.
Ce résultat n'est ni une archive distribuable ni une validation App Store.
Tests de retour email iOS et de fin de session réussis.
Le test des pages légales avait conservé la date du 28 septembre pour les deux
pages : il vérifie désormais séparément les CGV et la confidentialité mise à
jour le 1er octobre, ainsi que les exclusions explicites de l'export (photos
et données séparées des prestataires). Rendu réel testé hors ligne : réussi.
Tests hors ligne du chargement check-in (dont réseau/JSON invalide), du score
de progression (données absentes et historiques malformés) et du Club réussis.
Ils ne remplacent pas les parcours en production. Aucun changement publié.

À 19 h 57 : journal chronométré vérifié dans l'app simulée sur SE :
`/tmp/coai-journal-timed-scroll-1001.xcresult` (26 s). Navigation Explorer →
Historique des séances → Voir mon historique ; affichages `45 s de maintien`
et `10 × 20 kg` visibles, capture inspectée. PostgreSQL confirme que les deux
mesures sont inchangées, une seule séance ; compte fictif supprimé. Types,
lint, build 132 pages, test de rendu et audit 356 médias passent.
Essais intermédiaires non concluants : navigation avant fin de connexion,
session précédente encore active, puis défilement XCTest dépassant la ligne
native. Le dernier test attend la destination et défile par petits gestes.
Le conflit potentiel navigation rapide/redirection de connexion reste à
reproduire séparément ; ce test stabilisé ne prouve pas son absence.
Validations locales uniquement, aucune publication ni validation production.

À 19 h 43 : parcours natif complet réussi après correction du clavier :
`/tmp/coai-guided-keyboard-visible-fixed-1001.xcresult` (150 s). Champ de
répétitions entièrement visible au-dessus du clavier sur SE, saisie de dix
répétitions, bilan accessible du titre au bouton Terminer, puis cinq exercices
retrouvés dans l'historique RepCount après relance. Quatre captures inspectées
dans `/tmp/coai-keyboard-final-proof-1001` : clavier, haut/bas du bilan,
historique. Débordement horizontal décoratif absent sur ces captures.
PostgreSQL confirme indépendamment une seule séance de cinq exercices,
quinze séries validées et dix répétitions saisies ; compte fictif nettoyé.
Correction et tests enregistrés dans `82f5dfa`, sans publication.

Journal : erreur de présentation confirmée par test en échec avant correction :
un maintien de 45 s était rendu `0×0kg`. Le rendu distingue maintenant secondes
et répétitions/charge ; test de rendu corrigé (`workoutHistory` simulé) réussi
avec contrôle des deux types. Vérification native du journal chronométré encore
à effectuer ; ceci n'est pas une validation production. Les guides React/Next.js
ont été appliqués pour limiter le correctif clavier au lecteur et nettoyer ses
écouteurs/tâches différées à la fermeture.

À 19 h 14 : bilan de séance corrigé sur petit écran (centrage vertical sûr,
noms d'exercices non tronqués, absence de charge distinguée du poids du corps).
Test natif `/tmp/coai-guided-summary-fixed-1001.xcresult` réussi (137 s), puis
contrôle PostgreSQL indépendant : une séance, cinq exercices, quinze séries,
dix répétitions explicitement saisies. Compte fictif supprimé après contrôle.
L'inspection de la capture a révélé un débordement horizontal de l'anneau
décoratif : correction supplémentaire du centrage et du débordement en cours
de vérification dans `/tmp/coai-guided-history-visible-input-1001.xcresult`.
Le test étendu vérifie également l'historique après relance. Un essai précédent
(`/tmp/coai-guided-summary-history-1001.xcresult`) a échoué avant le bilan :
XCTest visait le champ masqué sous le pied fixe. Le ciblage contrôle maintenant
ses bornes visibles avant l'appui. **Nouveau défaut observé pendant le retest :
le clavier peut masquer le champ de répétitions sur SE** ; ne pas considérer
l'ergonomie de saisie comme validée même si la valeur est enregistrée.
Build, types, lint (six avertissements existants), tests brouillons/sauvegarde/
séance condensée et 356 médias passent. Aucun changement publié.

À 19 h 38 : essai `coai-guided-history-visible-input-1001` interrompu
explicitement après constat visuel du champ masqué par le clavier ; XCTest
attendait aussi 60 s par geste pour la stabilisation. Ce n'est pas une réussite
du parcours. Correction locale préparée : recentrer uniquement l'input actif
du lecteur après ouverture/redimensionnement du clavier, sans écouteur restant
après fermeture. Test de cycle de vie `test-runner-keyboard-visibility.cjs`
réussi (événements simulés, isolation, annulation, absence de VisualViewport),
types et lint réussis ; contrôle natif renforcé à exécuter après recompilation.
Autre point détecté : `test-journal-navigation.cjs` échoue car sa doublure
`workoutHistory` manque ; journal à retester, notamment le rendu des maintiens.
Recompilation corrigée réussie (132 pages), tests brouillons, confirmation de
sauvegarde, séries réalisées et séance condensée réussis. Nouveau parcours
natif lancé : `/tmp/coai-guided-keyboard-visible-fixed-1001.xcresult` ; résultat
encore à contrôler. Il exige le champ dans la fenêtre au-dessus du clavier,
puis conserve les contrôles du bilan, de la relance et de l'historique.

À 19 h 04 : séance guidée parcourue jusqu'au bilan puis app relancée :
`/tmp/coai-guided-save-1001.xcresult` (134 s). Vérification PostgreSQL locale
indépendante réussie avec `verify-native-first-programme.cjs --completed-workout` :
une séance PROGRAMME, cinq exercices, quinze séries validées, une série détaillée
avec les dix répétitions saisies ; pas de répétitions inventées pour les autres.
La capture finale révèle toutefois deux points à corriger : titre du bilan coupé
en haut sur SE, et « poids du corps » affiché quand aucune charge n'a été saisie.
Ce parcours ne prouve pas encore l'affichage de la séance dans l'historique après
relance (il vérifie le retour au programme et la persistance en base).

À 18 h 57 : parcours lecteur étendu réussi sur SE : ajustements et consigne
ouverts/fermés en paysage puis portrait, saisie de 10 répétitions, clavier
fermé, relance et programme disponible. Preuve :
`/tmp/coai-reader-content-bounds-1001.xcresult` (81 s). Contenu central avec
centrage sûr et enfants non rétrécis pour préserver le défilement des grands
visuels. Les essais intermédiaires ont également révélé des faux ciblages
XCTest : homonymes hors lecteur et éléments signalés hittable sous le pied fixe.
Le test cible le dialogue et contrôle la zone visible avant l'appui. Ne pas
présenter ces faux appuis automatisés comme une preuve de clic traversant lors
d'un geste humain. Build/types/lint et tests brouillons/sauvegarde passent ;
compte fictif nettoyé. Saisie vérifiée à l'écran, pas encore son enregistrement
dans une séance guidée complète. Non publié, non validé en production.

À 18 h 36 : ajustements pendant un exercice contrôlés en paysage sur SE.
Le texte des conditions débordait de la fenêtre (échec natif
`/tmp/coai-reader-modal-exercise-1001.xcresult`). Hauteur des panneaux Ajuster
et Consigne bornée au conteneur, contenu défilable. Test natif réussi après
correction : `/tmp/coai-reader-modal-fixed-1001.xcresult`, conditions entièrement
dans la WebView, fermeture après défilement interne, retour portrait, relance.
Le panneau Consigne partage la correction CSS mais son ouverture n'est pas
couverte par ce test. Build, types, lint et séances condensées passent.
Validation locale seulement ; aucune publication.

À 18 h 28 : lecteur de séance rendu défilable lorsque la fenêtre mesure au
plus 500 px de haut. Sur simulateur iPhone SE, « C'est fait » était inaccessible
en paysage (deux échecs avant correction, dont attente de stabilisation).
Le parcours portrait → paysage → portrait réussit désormais, avec défilement
dans la zone web, contrôle des bornes du bouton, retour à Fermer, ouverture
d'Ajuster puis persistance après relance. Preuve locale :
`/tmp/coai-reader-rotation-scroll-1001.xcresult`. Le pilote de défilement a aussi
été corrigé pour ne plus balayer hors de la WebView en paysage. Build, types,
lint (six avertissements existants) et tests sauvegarde/brouillons réussis.
Base vérifiée indépendamment : trois piliers version 1, aucun doublon ; compte
fictif nettoyé. Pas encore validé en production ni sur iPhone physique.

À 18 h 05 : création de programme robuste aux confirmations incomplètes.
Le composant acceptait un succès HTTP avec `{ echecs: 0 }` sans aucun pilier ;
le nouveau test échouait avant correction. Il exige désormais trois piliers
distincts, identifiés et de statut reconnu, limite l'attente réseau à 20 secondes
(en-têtes et corps), bloque les doubles appuis et n'affiche pas d'erreur technique
brute. L'action « Vérifier mon programme » consulte le serveur sans recréer.
Deux parcours natifs avec Auth/PostgreSQL locaux et confirmation remplacée après
commit réel réussis : reprise manuelle sans doublon
`/tmp/coai-first-programme-unconfirmed-retry-1001.xcresult` (18 h 00), puis
consultation sans seconde requête de création
`/tmp/coai-first-programme-check-after-loss-1001.xcresult` (18 h 05).
Chacun ouvre ensuite le lecteur et retrouve le programme après relance.
Contrôle indépendant : trois piliers, version 1, aucun doublon. Captures d'erreur
inspectées. Tests simulés complémentaires : réponses malformées, timeout en-têtes
et corps, double appui, nouvelle tentative, confirmation de recréation conservée.
TypeScript, lint, build 132 pages, tests ciblés et 356 médias réussis.
Fixtures nettoyées, proxy de panne arrêté et serveur normal rétabli sur 3050.
Ces preuves ne valident pas la perte de connexion physique ni la production.

À 17 h 49 : débordement du bouton Ajuster du lecteur corrigé sur petit iPhone.
Avant : bord droit mesuré à 379 points pour un écran de 375, test en échec
`/tmp/coai-runner-header-before-1001.xcresult`. Après : titre sur sa propre ligne
sur mobile et commandes pouvant revenir à la ligne. Même parcours réussi dans
`/tmp/coai-runner-header-fixed-1001.xcresult` : bouton entièrement contenu avec
marge, hauteur au moins 44 points, clic ouvrant réellement les ajustements,
programme retrouvé après relance. Capture inspectée. Cinq tests de non-régression
du lecteur (brouillons, séries effectuées, voix simulée, condensation et sauvegarde),
TypeScript, lint et build réussis ; 356 médias présents. Aucune donnée personnelle
utilisée, fixture nettoyée. Correction locale non publiée ; gros texte, paysage
du lecteur et validation physique restent à vérifier.

À 17 h 42 : premier programme corrigé et testé sur simulateur SE/iOS 26.5.
Le bouton de création, auparavant enfoui dans les ajustements avancés, est
visible avant les menus secondaires pour un compte autorisé sans programme.
La première création utilise le mode de reprise sans doublon et ouvre la
première séance explicitement, même un jour de repos, sans modifier le planning.
Test réel `testLocalFirstProgrammeCreationSurvivesRelaunch` réussi : connexion,
création, lecteur ouvert, redémarrage et programme toujours disponible.
Preuve : `/tmp/coai-first-programme-player-1001.xcresult`, 1 réussite, 0 échec.
Contrôle PostgreSQL indépendant : exactement trois piliers SOCLE_COAI, version 1,
statut conservé GENERE_IA, aucune validation humaine inventée. Compte fictif nettoyé.
Tests de placement/droits/relecture et de navigation ajoutés ; test HTTP local
des profils exclus, accès et créations concurrentes réussi. TypeScript, lint
(six avertissements préexistants), build 132 pages et 356 médias contrôlés.
Trois captures inspectées. Le pilote initial attendait un démarrage sur un jour
de repos ; le second cherchait un titre sensible à la casse. La dernière preuve
valide le lecteur ouvert, pas une séance terminée ni une mise en production.
La capture révèle encore un bouton Ajuster trop proche du bord droit du lecteur
sur petit écran : prochaine correction. Aucun déploiement ni soumission.

À 17 h 19 : parcours RepCount natif connecté validé sur simulateur SE/iOS 26.5
avec backend local réel. Deux mouvements sélectionnés dans la liste native,
deux séries à 20 kg puis une à 12,5 kg saisie avec virgule française, notes,
fermeture complète, reprise du brouillon, enregistrement, nouvelle relance et
ouverture de l'historique. Résultat :
`/tmp/coai-repcount-draft-history-1001.xcresult`, 1 test réussi, 0 échec.
`scripts/verify-native-repcount.cjs` relit PostgreSQL : exactement une séance
REPCOUNT, deux exercices, trois séries de 10 répétitions aux charges attendues
et notes exactes. Compte jetable nettoyé après contrôle. Capture inspectée.
Les échecs de pilotage précédents concernaient la liste native (saisie derrière
le sélecteur, défilement trop large) et un historique non déplié. L'hypothèse
d'un correctif clavier a été abandonnée : aucune modification produit retenue.
Sept tests ciblés RepCount, TypeScript, lint (six avertissements préexistants),
build Next 132 pages et 356 chemins média vérifiés. Restent la saisie libre hors
suggestions, les coupures réseau natives, les corrections/retraits de séries,
l'isométrique natif, le physique et la production ; pas de validation générale
de tous les parcours RepCount.

À 16 h 57 : récupération de mot de passe complète réussie sur simulateur SE
iOS 26.5, Auth et SMTP exclusivement locaux. Demande dans l'app, ouverture du
lien reçu dans Safari (stockage de session distinct), saisie du nouveau mot de
passe, retour à la connexion, refus du lien déjà utilisé et retour utilisable
vers une nouvelle demande. Reconnexion dans l'app et session après relance
vérifiées. Test `testLocalPasswordRecoveryAcrossSafariAndApp`, 1 réussite,
0 échec : `/tmp/coai-password-recovery-reuse-1001.xcresult`.
Le contrôle indépendant `scripts/verify-native-password-recovery.cjs` confirme
l'ancien mot de passe refusé, le nouveau accepté et le même profil conservé.
Sessions révoquées, seul compte fictif et ses emails locaux supprimés.
Les essais antérieurs échouaient dans le pilote sur la proposition native de
mot de passe robuste de Safari ; le test la ferme explicitement, sans supprimer
cette fonction du produit. Capture de connexion inspectée. TypeScript, lint
(six avertissements préexistants), build Next 132 pages, tests de navigation
de récupération et 356 chemins média contrôlés. Ce résultat ne valide pas
la délivrabilité email distante, un iPhone physique ou la production.

À 16 h 27 : échec réel de suppression dû à une photo non confirmée vérifié
dans l'app sur simulateur SE, backend local. Message lisible, nouvelle tentative
possible, session conservée après relance et export disponible. État de la base
contrôlé indépendamment, fixture nettoyée. Preuve :
`/tmp/coai-photo-delete-unresolved-retry-1001.xcresult`.
La reprise automatique de l'envoi reste NON RÉSOLUE. L'étude du stockage local
v1.72.1 écarte une simple révocation RLS comme barrière aux envois déjà admis ;
voir `PHOTO-DELETION-READINESS.md`. Aucun code applicatif ni service distant modifié.

À 16 h 11 : parcours HEIC par Fichiers réussi sur simulateur SE/iOS 26.5
avec backend local réel (`/tmp/coai-heic-files-local-1001.xcresult`). Sélection,
sauvegarde, relance et affichage de la miniature vérifiés ; une seule mesure
et pixels du fichier relus indépendamment dans Storage. Données de compte
fictives nettoyées. Validation sur iPhone physique, iCloud et production encore
ouverte ; ce succès ne résout pas les envois incertains lors d'une suppression.

Photos de suivi : filtre HEIC/HEIF corrigé localement ; test du formulaire
échoué avant correction, réussi après. Décodage d'un vrai HEIC synthétique et
réencodage validés dans WebKit macOS (pixels/dimensions contrôlés), sans réseau
ni photo personnelle. Validation HEIC du sélecteur iPhone/iCloud et publication
restantes ; détails dans `PHOTO-DELETION-READINESS.md`. Aucun verrou serveur
de suppression levé par cette correction d'interface.

À 15 h 47 : annulation du sélecteur photo vérifiée sur iPhone 17 Pro/iOS 26.1,
avec la page Mesures en ligne et la session existante. Test
`testPhysicalPhotoPickerCancellationKeepsFormUsable` réussi (1 test, 0 échec),
preuve `/tmp/coai-physical-photo-cancel-1001.xcresult` : ouverture Photothèque,
annulation, valeur du poids inchangée, bouton d'enregistrement accessible,
retour à Séance. Aucune photo sélectionnée ni mesure soumise. Ce contrôle
ne valide pas l'envoi, HEIC/iCloud, la suppression ou les correctifs serveur
locaux non déployés. Build iPhone signé, TypeScript, lint (six avertissements
préexistants), build Next 132 pages et 356 chemins média contrôlés.

Contrôle Apple après reconnexion d’Anthony : App Store Connect reconnaît le
compte, mais les vues Apps et Utilisateurs ne présentent aucune liste exploitable.
Le portail authentifié `https://developer.apple.com/account` du même compte
affiche explicitement « Rejoindre l’Apple Developer Program » et « S’inscrire
dès aujourd’hui », avec les seuls outils gratuits. L’accès de distribution
n’est donc pas activé dans le compte observé ; ce n’est plus une simple
déduction à partir du certificat local. Aucun formulaire d’adhésion ouvert,
contrat accepté ou paiement effectué. Inscription/activation à traiter par
Anthony ; ne pas réessayer la création d’app tant que cet état reste inchangé.
Ce contrôle ne lève aucun autre blocage produit, média ou de production.

À 14 h 58 : Explorer et l’indisponibilité des abonnements vérifiés sur
iPhone 17 Pro/iOS 26.1, test
`testNativeExplorerReplacesWebSidebarWithoutHidingContent` réussi dans
`/tmp/coai-physical-explorer-subscription-1001.xcresult` (1 test, 0 échec).
Les destinations natives restent accessibles, les anciennes navigations web
sont masquées sans cacher celle du contenu, et les feuilles se ferment.
Aucun bouton d’achat affiché ; restauration désactivée en état indisponible.
Les deux captures ont été inspectées. Le contenu web est une fixture Debug :
ce résultat ne valide ni les destinations connectées ni un paiement réel,
ni la cause distante de l’indisponibilité. Aucun achat ou changement de compte.

À 14 h 47 : App Store Connect recontrôlé dans le navigateur, redirection vers
`/login?targetUrl=%2Fapps&authResult=FAILED`, formulaire Apple visible. Connexion
demandée à Anthony ; aucun identifiant saisi, contrat accepté ou achat réalisé.
L’accès de distribution distant reste inconnu (ne pas déduire une non-adhésion).

Contrôle Release renforcé dans `scripts/check-ios.sh` : ajout des marqueurs
`COAIDownloadFixture`, `native-download-fixture` et `coai-ui-storage-fixture`
aux exclusions du binaire livré. Contrôle positif : marqueurs détectés dans
le dylib Debug réellement installé ; absents du binaire Release arm64.
`bash scripts/check-ios.sh --device-release` réussi : 51 XCTest, 65 contrôles
cœur, compilation des règles WebKit, manifeste et compilation Release non
signée. Syntaxe shell et diff vérifiés. Aucun défaut produit nouvellement
démontré ; garde de non-régression élargie. Pas d’archive distribuable ni dépôt.

À 14 h 37 : deux reprises physiques réussies sur iPhone 17 Pro/iOS 26.1,
`/tmp/coai-physical-navigation-rest-1001.xcresult`. Navigation native très gros
texte en portrait/paysage/portrait : cibles >=44 points, sans chevauchement,
dans l’écran, Explorer et fermeture accessibles (fixture web Debug, pas tous
les écrans connectés). Minuteur : pause, fermeture, relance du processus,
reprise puis arrêt, persistance réelle. Captures inspectées. Ces contrôles
étaient ouverts depuis le 28 septembre ; ils ne sont plus bloqués par une vidéo
flottante. Profil embarqué actuel expirant à 16:39:21 UTC le 1er octobre
(18:39:21 Paris), lu via `security cms` ; aucune archive de distribution créée.

À 14 h 30 : iPhone 17 Pro de nouveau disponible, appairé et déverrouillé
(iOS 26.1). Build Debug signé installé et tests physiques exécutés avec
`DEVELOPMENT_TEAM=33L78928V3`. Sans ce paramètre, la cible UI échouait avant
compilation ; consigne ajoutée au README. Une identité Apple Development
observée, pas de Distribution ; aucune conclusion sur l’adhésion distante.

- `/tmp/coai-physical-wellness-1001.xcresult` réussi : navigation Nutrition,
  Récupération, Recettes, Coach puis Séance sur les pages en ligne et session
  existante. Captures inspectées. Nutrition/récupération affichent EN_ATTENTE :
  ceci ne valide pas leurs programmes complets ni une réponse IA (aucun envoi).
- `/tmp/coai-physical-pdf-1001.xcresult` réussi : lien PDF du programme réel,
  présentation du partage iOS identifié PDF, fermeture et retour utilisable.
  Aucun destinataire choisi, aucun envoi. Pas une relecture du contenu PDF.
- `/tmp/coai-physical-catalogue-team-1001.xcresult` échoué : clavier toujours
  ouvert après Entrée. Hiérarchie et vidéo montrent aussi le rowing unilatéral
  encore présent en ligne. Le code local possède déjà le formulaire qui ferme
  le clavier et l’exclusion média : publication des corrections non prouvée.
  Ne pas transformer cet échec en succès en supprimant les assertions.

Autorisation explicite du déploiement Vercel demandée, en attente. Aucun
déploiement, achat, migration distante ou envoi App Store effectué. L’ancienne
mention « iPhone indisponible » ci-dessous est désormais historique, pas un
blocage actuel pour les contrôles en lecture seule.

À 14 h 13 : réponse d’export malformée maintenant vérifiée dans l’app native
sur simulateur SE, et non seulement dans le test de composant. Le proxy local
`scripts/ios-export-failure-proxy.cjs` remplace une première réponse authentifiée
200 par un objet JSON sans identité. Erreur attendue affichée, aucun partage
proposé, bouton réutilisable, puis vraie réponse 200 et sauvegarde dans Fichiers :
`/tmp/coai-export-invalid-1001.xcresult` réussi. Le JSON sauvegardé de 5 171 octets
a été lu séparément : identité fictive exacte, profil et programme présents.
Capture de destination locale inspectée ; aucun destinataire ni cloud choisi.
Compte fictif révoqué/supprimé et absence vérifiée, proxy arrêté, serveur local
normal rétabli. Tests de composant RGPD et lint ciblé réussis. Aucun changement
produit, déploiement ou validation physique/production dans ce lot.

À 14 h 05 : parcours natif de correction d’un mot de passe vérifié sur le
simulateur SE dédié, avec Auth/PostgreSQL locaux réels. Rejet du mauvais mot de
passe, email conservé, bouton réutilisable, affichage/masquage, correction,
accès aux réglages puis maintien de session après fermeture/relance : test
`testLocalIncorrectPasswordCanBeCorrectedWithoutRestart` réussi dans
`/tmp/coai-login-correction-final-1001.xcresult`. Les essais initiaux ont révélé
des erreurs du pilote (curseur au milieu du mot de passe, contrôle exposé comme
interrupteur et confusion avec le champ EMAIL des réglages), pas un défaut
d’authentification démontré. Compte fictif révoqué et supprimé ; vérificateur
indépendant confirmant son absence et le refus de l’ancien mot de passe réussi.
Test OAuth simulé actualisé : profil absent ou consentement manquant redirigé
vers la finalisation, deux consentements présents autorisant la destination.
Tests auth async/confirmation, TypeScript et lint ciblé réussis. Aucune
modification produit dans ce lot ; validation physique et production restantes.

À 13 h 40 : défaut natif HTTP reproduit puis corrigé. Après une réponse 503,
l’annulation WebKit remplaçait le message serveur par « Vérifie ta connexion ».
Le gestionnaire conserve désormais le message déjà classifié ; une nouvelle
navigation le réinitialise comme auparavant. Nouveau proxy local
`scripts/ios-page-failure-proxy.cjs` : premier GET entraînement 503, puis vrai
Next sur 3051. Test natif réussi dans `/tmp/coai-http503-fixed-1001.xcresult` :
message temporaire, minuteur accessible, reprise sans relance, connexion réelle
(journal proxy : 307 puis sign-in 200). Capture après reprise examinée.
Test réseau coupé également réussi : `/tmp/coai-network-regression-1001.xcresult`.
Premier test avant correction échoué dans `/tmp/coai-http503-retry-1001.xcresult`,
message erroné observé dans sa vidéo. 51 XCTest, 65 contrôles cœur et build Release
arm64 non signé réussis. Proxy et serveur intermédiaire arrêtés, serveur normal
rétabli. Aucun compte créé, aucune publication ; vérification production et
physique du correctif restantes.

Contrôle distribution du 1er octobre : `devicectl list devices` indique toujours
l’iPhone 17 Pro indisponible ; `security find-identity -v -p codesigning` trouve
une seule identité Apple Development, aucune Apple Distribution. Cela ne prouve
pas le statut d’adhésion du compte Apple distant. Aucun certificat créé, achat,
changement de compte, publication ou soumission effectué. Le tableau de parcours
ci-dessous est corrigé pour ne plus présenter les tarifs approuvés et le
raccordement local StoreKit comme des décisions ou développements manquants.

À 13 h 27 : export natif après correction revalidé sur SE simulé iOS 26.5.
`testLocalConnectedAccountExportShares` réussi, zéro échec dans
`/tmp/coai-export-fresh-1001.xcresult` : partage, fermeture, second export,
renommage et sauvegarde dans « Sur mon iPhone ». JSON réellement enregistré
`COAI-connected-export-D5872EBA-D1A0-4283-AEEF-02A85BE7EDFA.json`, 5 171 octets :
identité fictive, profil, programme et séance contrôlés indépendamment.
Capture de destination examinée dans `/tmp/coai-export-fresh-proof-1001/`.
Deux tentatives précédentes échouées, non comptées : clavier Fichiers non actif,
puis session du compte de test conservée. Attente bornée du clavier et garde
destination locale ajoutées au test ; compte recréé avant le dernier essai.
Compte local nettoyé et absence Auth/DB vérifiée. Le fichier synthétique reste
dans Fichiers du simulateur comme preuve. Pas de validation production ou iPhone
physique ; la réponse API malformée reste couverte par le test de composant.

Export du compte : défaut reproduit dans le gestionnaire réel avec réponse API
simulée (`null` téléchargé comme fichier). Correction locale : rejet des réponses
null/tableau/non-objet ou sans identifiant de compte textuel non vide avant création
du fichier ; message existant et nouvelle tentative conservés. Tests
`test-rgpd-actions.cjs` et `test-account-export.cjs`, TypeScript et ESLint ciblé
réussis. Cette garde ne prouve pas l’exhaustivité du contenu exporté. Validation
native du correctif et production restent à faire ; aucun déploiement effectué.

À 13 h 12 : huit scénarios StoreKit locaux réussis, zéro échec dans
`/tmp/coai-storekit-restore-auth-1001.xcresult`. Deux régressions ajoutées :
restauration d’un historique vide sans ancienne confirmation ni nouvel achat ;
autorisation COAI échouée sans livraison, puis restauration réussie avec les
mêmes transactions après rétablissement. Aucun correctif produit nécessaire :
l’écran efface déjà sa confirmation avant chaque opération. Ces tests portent
sur le service réel, la boutique Xcode et un serveur simulé, pas sur un véritable
changement de compte Apple, une révocation serveur ni une validation production.

À 13 h 03 : suite StoreKit Xcode étendue à l’arrêt de renouvellement puis
expiration. Achat fictif livré, arrêt du renouvellement sans perte anticipée
de la période payée, expiration forcée et réconciliation des droits inactifs.
Six scénarios réussis, zéro échec dans
`/tmp/coai-storekit-expiry-settled-1001.xcresult` (serveur simulé, environnement
Xcode exigé, transactions fictives nettoyées). La première version du test
étendu lisait trop tôt le reçu et a échoué ; attente bornée ajoutée puis retest.
Cette preuve ne valide PAS les signatures serveur réelles, Sandbox Apple,
App Store Connect, notifications Apple ni facturation réelle.
`bash scripts/check-ios.sh --device-release` réussi : contrôles cœur,
confidentialité et build iPhone arm64 Release non signé, absence des modes et
catalogues de test. Version du binaire vérifiée : 0.1.0 (1).
Ce n’est ni une archive de distribution signée, ni un dépôt TestFlight.

À 12 h 54 : correction locale du formulaire mesures : une réponse HTML/null
ou un succès sans identifiant ne vide plus la saisie ; message de confirmation
manquante lisible, bouton réutilisable, même identifiant de tentative conservé.
Les erreurs de champs reçues sont filtrées avant rendu. Tests du vrai gestionnaire
avec réseau simulé couvrent aussi les réponses photo illisibles et succès incomplets.
Test natif `testLocalMeasurementRetriesUnreadableConfirmation` réussi après
redémarrage du simulateur : proxy `--html` transforme la première réponse 201
en HTML 502 APRÈS sauvegarde, nouvelle tentative 200, historique après relance.
Résultat `/tmp/coai-measure-html-reboot-1001.xcresult`, capture erreur examinée
dans `/tmp/coai-measure-html-proof/`, PostgreSQL indépendant : exactement une
mesure de 75 kg. Compte fictif nettoyé, absence DB/Auth vérifiée.
Premier essai interrompu (143), non compté comme réussite : échantillon de pile
`/tmp/coai-ui-runner-sample-1001.txt` montre XCTest bloqué dans
`waitForQuiescence` au toucher du champ mot de passe, avant sauvegarde.
Compilation Next locale 132 pages, TypeScript, tests mesures/retry, audit 356
chemins médias réussis. ESLint global : 0 erreur, 7 avertissements ; deux noms
de variables dans les scripts rappels/recettes corrigés et scripts retestés
(registre PostgreSQL local, fournisseur email simulé ; 189 recettes/120 filtres).
Ce correctif n’est PAS déployé ni validé en production ou sur iPhone physique.

À 12 h 33 : contrôle de confidentialité photo depuis la photothèque iOS locale.
PNG synthétique magenta 3200 × 2400, marqueur Artist/ImageDescription fictif
et répertoire GPS vérifiés avant import ; test natif complet réussi dans
`/tmp/coai-photo-privacy-magenta-1001.xcresult`, puis vérification indépendante
des pixels magenta, d’une seule mesure et d’un seul fichier 1600 × 1200 PNG.
Le fichier téléchargé ne contient ni le marqueur injecté ni le répertoire GPS.
Des EXIF techniques subsistent : ce résultat ne prouve pas « zéro métadonnée ».
Capture après relance examinée dans `/tmp/coai-photo-privacy-magenta-proof/`.
Scénario : générateur `--private-metadata`, puis vérificateur du harnais
`ui-measures-verify --with-photo --private-metadata`. Le lecteur EXIF de test
est couvert sur les deux ordres d’octets, préfixe, GPS/non-GPS et entrées tronquées.
Compte, photo et registre locaux nettoyés ; absence compte/Auth vérifiée.
Cela valide ce parcours PNG sur SE simulé, pas les autres formats, l’import
iCloud ou un envoi API direct. Aucun changement du code produit ni publication.
L’iPhone physique reste `unavailable` lors du contrôle du 1er octobre à 12 h 32.

À 12 h 19 : envoi réel depuis Photothèque dans l’app SE simulé/iOS 26.5,
confirmation système, sauvegarde de 75 kg avec image, relance et historique
avec vignette turquoise observé. `testLocalProgressPhotoPersistsAfterRelaunch` :
1 réussi / 0 échec, `/tmp/coai-photo-positive-done-1001.xcresult`.
Capture examinée : `/tmp/coai-photo-done-proof/EC07AA94-FADE-4397-A79C-8BA2F0D754D7.png`.
Vérification indépendante PostgreSQL + téléchargement Storage : une mesure,
un fichier, pixels synthétiques attendus, 1600 × 1200 PNG / 36 268 octets
depuis un PNG 3200 × 2400. Safari utilise ici le repli PNG, pas WebP.
Des balises EXIF techniques sont présentes après canvas : ne pas affirmer
« aucun EXIF ». Le retrait des métadonnées GPS d’une vraie photo reste à tester.
Compte fictif, fichier et registre locaux nettoyés ; absence Auth/DB vérifiée.
Aucun déploiement, appareil physique, HEIC ou accès iCloud validé par ce test.
Les trois essais préparatoires échoués relevaient de l’automatisation
(type AX, vignette déclarée non cliquable, confirmation système manquante).
Reproduction : générer `node scripts/create-native-photo-fixture.cjs`, importer
le PNG comme dernière photo du simulateur dédié avec `simctl addmedia`, créer
le compte jetable local, lancer le test, puis appeler le vérificateur
`scripts/verify-native-progress-photo.cjs` via le harnais local avec
`ui-measures-verify --with-photo`. Le vérificateur refuse un endpoint distant.

À 11 h 56 : sélecteur photo système ouvert puis annulé dans l’app sur SE
simulé/iOS 26.5. Valeur fictive 75 kg conservée, sauvegarde possible ensuite,
historique retrouvé après relance. `testLocalPhotoPickerCancellationPreservesMeasurement`
réussi en 63,191 s (1/0) dans `/tmp/coai-photo-library-cancel-1001.xcresult`.
Captures photothèque et historique examinées dans
`/tmp/coai-photo-library-cancel-proof/`. Contrôle PostgreSQL indépendant :
une mesure 75 kg, `photoPath` nul. Compte de test nettoyé et absence vérifiée.
Le sélecteur affiche l’accès privé aux seuls éléments choisis ; aucune photo
n’a été sélectionnée, envoyée ou supprimée. Cela ne valide PAS encore l’envoi
d’une photo depuis la photothèque, HEIC/iCloud, ni l’appareil physique.
Les essais précédents ont échoué dans l’automatisation (défilement clavier,
puis menu intermédiaire) et ne sont pas comptés comme succès. Le test ferme
le clavier par sa coche sur SE avant d’ouvrir Photothèque → Cancel.

À 11 h 39 : reprise après confirmation perdue vérifiée dans l’app sur SE
simulé. Proxy local coupe la connexion APRÈS réponse serveur 201, sans
modifier le réseau du Mac ou un service distant. Message de reprise présent,
valeur 75 conservée, geste explicite de nouvelle tentative → réponse 200,
puis relance et historique accessible. Résultat 1 réussi, 0 échec en 58,847 s
dans `/tmp/coai-measures-loss-1001.xcresult`. Captures erreur et historique
examinées dans `/tmp/coai-measures-loss-proof/`. Contrôle PostgreSQL séparé :
exactement une mesure. Scénario reproductible : serveur local compilé sur
3051, `node scripts/ios-measure-loss-proxy.cjs` sur 3050, compte jetable
`ui-create --registered`, test `testLocalMeasurementRetriesLostResponseWithoutDuplicate`.
Ce n’est pas un test hors ligne prolongé, photo, production ou iPhone physique.

À 11 h 32 : `testLocalMeasurementPersistsAfterRelaunch` passe sur iPhone SE
simulé / iOS 26.5, app SwiftUI + WebKit et services Auth/PostgreSQL locaux.
Saisie fictive 75 kg, bouton accessible clavier ouvert, enregistrement,
fermeture/relance et retour à l’historique : 1 réussi, 0 échec en 53,160 s
(`/tmp/coai-measures-native-scroll-1001.xcresult`). Deux captures examinées
dans `/tmp/coai-measures-native-success-proof/`. Contrôle indépendant en
base : exactement une mesure 75 kg, sans photo ni doublon. Compte supprimé
ensuite et vérification indépendante Auth/profil/ancien mot de passe réussie.
Précondition : `/tmp/coai-local-http-0924.cjs ui-create --registered` ; contrôle
indépendant `ui-measures-verify`. Les deux premiers essais ont révélé des
erreurs de sélection/défilement du test (libellé majuscule puis geste trop
long), corrigées sans modification de l’app. Un lancement antérieur avec un
identifiant de simulateur mal saisi a terminé 70 avant tests. Aucune de ces
tentatives n’est comptée comme réussite. Pas de photo choisie, pas de test
hors ligne, sur appareil physique ou en production dans ce scénario.

TERMINÉ LOCAL : contenu réel des avatars et photos de progression décodé
avant stockage ; fichier illisible refusé. Parcours HTTP photo → mesure →
historique et nouvel essai sans doublon réussi. Suppression de 101 fichiers
et suppressions concurrentes revalidées après ce changement. Build/tests
réussis ; validation native/production toujours À FAIRE. Voir
`PHOTO-DELETION-READINESS.md`. L’iPhone est encore `unavailable` au recontrôle.

Photos de profil : remplacement et tâche de nettoyage désormais atomiques ;
reprise locale après SIGKILL vérifiée avec PostgreSQL/Storage réels. Tests HTTP
du remplacement et de suppression de 101 fichiers réussis, ainsi que les deux
suppressions simultanées. Détails et limites dans `PHOTO-DELETION-READINESS.md`.
TERMINÉ LOCAL : nettoyage des nouveaux avatars remplacés et régressions.
TERMINÉ LOCAL : traitement privé de reprise par lots, validé via HTTP avec
PostgreSQL/Storage réels, arrêt brutal et reprise. Désactivé par défaut et non
planifié en production ; détails et preuves dans le même document.
EN COURS : activation autorisée, anciens fichiers orphelins, envois incertains.
BLOQUÉ POUR VALIDATION FINALE : iPhone indisponible, migration/déploiement non
autorisés. Cela ne valide ni la production ni la préparation globale App Store.

Contrôle supplémentaire du catalogue réel préparé :
`testPhysicalCatalogueExcludesMismatchedRowing` recherche le rowing exclu puis
un exercice disponible. Exécution physique NON démarrée : Xcode termine avec
code 70, destination absente ; `devicectl list devices` confirme l'iPhone
`unavailable`. `/tmp/coai-device-catalogue-1001.xcresult` ne constitue donc
aucune preuve de test réussi. Lecture HTTP anonyme du catalogue : redirection
vers `/sign-in?redirect_to=%2Fprogramme%2Fexercices`, impossible de contrôler
ses résultats sans connexion. Ne pas assimiler ce contrôle au test local
précédent. Reconnexion de l'appareil demandée ; aucun compte déconnecté.

À 09 h 43, les raccourcis des piliers EN_ATTENTE sont vérifiés dans l'app
sur simulateur iPhone SE (3e génération), iOS 26.5, avec serveur compilé
et Auth/base locaux : Nutrition → Recettes, Récupération → bilan du jour.
`/tmp/coai-pending-pillars-1001.xcresult` : 1 réussi, 0 échec, 0 ignoré.
Deux captures examinées dans `/tmp/coai-pending-pillars-proof-1001/` :
boutons lisibles et accessibles avant la carte. Aucun contenu non relu ni
lien PDF disponible pour ces programmes. Build Next complet et tests de
rendu/régression réussis. Compte jetable supprimé, identité Auth absente et
ancien mot de passe refusé par contrôle indépendant. Aucun appel IA.
Précondition reproductible du test : harness local `ui-create --registered
--pending-pillars --without-checkin`. Production et appareil physique avec
ce correctif restent à vérifier ; aucune publication effectuée.

À 09 h 17, parcours physique en session existante : Nutrition, Récupération,
Recettes (bouton de détail accessible), Coach (sans envoi) puis retour Séance.
`/tmp/coai-device-wellness-1001.xcresult` : 1 réussi, 0 échec, 0 ignoré.
Trois captures examinées dans `/tmp/coai-device-wellness-proof-1001/`.
IMPORTANT : Nutrition et Récupération affichent EN_ATTENTE sur ce compte ;
ce test valide la navigation, PAS la disponibilité des programmes personnalisés.
Correctif local : raccourcis recettes / bilan sommeil-forme / exercices avant
la carte d'attente. Relecture et accès aux PDF inchangés. Test de rendu isolé
`node scripts/test-pillar-pending-actions.cjs` et TypeScript sans émission réussis.
Rendu iPhone du correctif et production NON vérifiés ; aucune publication.
La relecture réelle des programmes reste à effectuer, pas à contourner.

À 09 h 14, lecture du conteneur de l'app sur l'iPhone après fermeture du
partage PDF : `tmp/COAIExports` contient zéro fichier. Nettoyage temporaire
confirmé pour ce parcours ; aucune suppression manuelle effectuée.

À 09 h 09, téléchargement PDF depuis la session persistante existante sur
iPhone 17 Pro / iOS 26.1 : 1 réussi, 0 échec, 0 ignoré dans
`/tmp/coai-device-pdf-1001.xcresult`. Capture examinée dans
`/tmp/coai-device-pdf-proof-1001/` : partage iOS présentant un document PDF
de 640 ko, puis fermeture et retour à la séance. Aucun envoi, achat ou
changement du programme. Cette preuve valide l'ouverture du partage, pas
le contenu intégral du PDF ni son enregistrement dans Fichiers.

À 08 h 59, deux autres tests physiques anonymes réussissent sur iPhone 17 Pro :
navigation mot de passe oublié → retour → inscription, puis saisie fictive des
champs, masquage/affichage du mot de passe, champ au-dessus du clavier et bouton
d'inscription accessible. `/tmp/coai-device-registration-1001.xcresult` :
2 réussis, 0 échec, 0 ignoré. Captures examinées dans
`/tmp/coai-device-registration-proof-1001/`. Stockage éphémère Debug ; aucun
formulaire soumis, compte créé, email envoyé ni modification des cookies personnels.
Ces preuves concernent l'interface publique servie à l'appareil, pas la livraison
des emails ni la création/connexion complète d'un compte distant.

À 08 h 47, après déverrouillage confirmé, les deux tests physiques passent
sur iPhone 17 Pro / iOS 26.1 : navigation XXXL avec rotations et minuteur
conservé après fermeture/relance. Résumé Xcode : 2 réussis, 0 échec, 0 ignoré,
`/tmp/coai-device-unlocked-1001.xcresult`. Captures portrait/paysage et repos
examinées dans `/tmp/coai-device-unlocked-proof-1001/`. Navigation avec contenu
Debug fictif ; pas de parcours connecté, achat ni validation globale du site
de production. L'ancien échec d'authentification ci-dessous est historique.

À 08 h 50, deux scénarios anonymes de connexion échouent avant interaction :
le bouton Google attendu n'existe pas car la session persistante de l'appareil
ouvre déjà « Ton entraînement ». Hiérarchie Xcode examinée, aucun formulaire
envoyé et aucune déconnexion forcée. Résultat
`/tmp/coai-device-login-1001.xcresult` : 0 réussi, 2 échecs. Cela ne valide ni le
clavier ni l'annulation Google sur cet appareil ; isoler une session de test
anonyme sans toucher aux cookies personnels avant nouvelle tentative.

À 08 h 54, reprise réussie des deux tests avec `-COAIAnonymousUITest` :
stockage WebKit non persistant réservé au Debug, aucun effacement du stockage
personnel. Résultat `/tmp/coai-device-anonymous-login-1001.xcresult` : 2 réussis,
0 échec, 0 ignoré sur iPhone 17 Pro. Clavier visible, champ email accessible,
onglets masqués ; annulation de la boîte système Google puis bouton utilisable.
Capture clavier examinée dans `/tmp/coai-device-anonymous-login-proof-1001/`.
Aucun identifiant saisi ni formulaire soumis ; connexion Google complète non
testée. Release arm64 non signée recontrôlée avec 51 XCTest/65 contrôles cœur ;
le nouveau marqueur Debug est absent du binaire selon `check-ios.sh`.

Recontrôle natif à 08 h 44 : `bash scripts/check-ios.sh --device-release`
réussit (51 XCTest, 65 contrôles cœur, règles WebKit compilées, configuration
de confidentialité et cinq cas négatifs). Release iPhone arm64 non signée
compilée ; manifeste inclus et absence des ressources/marqueurs de test vérifiée.
Ce résultat n'est ni une archive de distribution, ni un test physique ou StoreKit
Sandbox, ni une validation App Store. Le test connecté du consentement coach
sur simulateur est décrit dans `PRIVACY-AUDIT.md` (08 h 41, 20,189 s).

Accès Apple recontrôlé : l'ouverture de `https://appstoreconnect.apple.com/apps`
dans le navigateur Codex redirige vers `/login?targetUrl=%2Fapps&authResult=FAILED`.
Pas de session utilisable pour vérifier l'adhésion, le catalogue ou la fiche app.
Reconnexion demandée ; aucun achat, formulaire ni soumission effectué.

Audit catalogue réexécuté : 4 variantes sur 90 ont toutes leurs références
photo/vidéo, 86 sont incomplètes (388 occurrences, sept mouvements).
Ce résultat ne constitue pas une validation pédagogique des quatre variantes.
Les tests de correspondance, de lecteur et d'absence de repli stock passent
(59 exercices référencés avec les deux médias), sans combler ce manque.
Décision demandée pour l'abduction : conserver avec sa vidéo COAI ou revoir
explicitement le bloc ; aucune substitution non équivalente appliquée.

Vidéos : 90 MP4 du répertoire `public/videos/exercices` vérifiés H.264
8 bits 4:2:0, puis intégralement décodés avec `ffmpeg -v error -xerror`
(sortie null, aucune modification de fichier) : zéro échec. Cela ne prouve
ni la correspondance pédagogique de chaque mouvement, ni la lecture réseau
sur iPhone. Les médias/remplacements non validés restent bloquants.

Deux tests physiques relancés sur l'iPhone 17 Pro redevenu accessible :
navigation XXXL/rotation et minuteur après relance. Premier lancement arrêté
avant tests car l'équipe manquait pour la cible UI ; second lancement avec
`DEVELOPMENT_TEAM=33L78928V3` (équipe existante), compilation/signature réussies.
À 08 h 27, le second lancement s'est terminé avec le code 65 avant exécution
des scénarios : initialisation UI refusée par LocalAuthentication, code -2,
« Authentification annulée / Canceled by user ». Le processus n'est plus actif.
`/tmp/coai-device-recheck-team-1001.xcresult` n'est PAS une preuve de réussite
ni un échec fonctionnel des deux scénarios. Une nouvelle tentative nécessite
l'authentification locale sur l'iPhone ; ne pas contourner cette protection.
Seule identité Apple Development détectée, aucune Distribution.

## État courant — 28 septembre 2026

Rappels/session, 14 h 50 : brouillon fictif conservé après relance puis effacé
après signal de déconnexion confirmé, test réussi (19,023 s) dans
`/tmp/coai-session-cleanup-0928-current.xcresult`. Ce résultat contient aussi
un échec du test d'activation : le simulateur petit écran avait déjà refusé
les notifications (capture examinée), précondition incompatible, pas un succès.
Le scénario dédié au refus passe ensuite (10,501 s), aucun faux message
d'enregistrement, contrôle toujours disponible et aucune nouvelle demande iOS :
`/tmp/coai-reminder-denied-0928-current.xcresult`.
Sur le simulateur dédié `COAI QA rappel hebdomadaire`, le nettoyage du rappel
après fin de session et le changement de jour conservé après relance passent
(27,744 s et 28,466 s), puis rappel désactivé par le test :
`/tmp/coai-reminder-authorized-0928-current.xcresult`.
Fixtures Debug sans compte réel ; ces contrôles valident la persistance et le
nettoyage natifs, pas la réception d'une notification une semaine plus tard,
ni tous les brouillons métiers ou une déconnexion serveur distante.

Compte, 14 h 40 : `testLocalConnectedAccountDeletionPersists` réussi (34,186 s)
sur simulateur, vraie connexion au compte jetable local, annulation de la
suppression puis export via partage iOS, nouvelle confirmation et suppression,
retour connexion conservé après relance. Vérificateur indépendant (sans nettoyage)
confirme profil et identité Auth absents, ancien mot de passe refusé.
Résultat `/tmp/coai-account-deletion-0928-current.xcresult`, avertissement Apple
examiné dans `/tmp/coai-account-deletion-proof-0928/52386565-28AE-4BB6-BBED-C3E2362954F0.png`.
Compte fictif seul supprimé ; aucune donnée réelle touchée. Les consignes
Supabase ont limité les opérations à cette fixture locale et imposé le contrôle
séparé de l'identité. Tests `test-account-export.cjs` et
`test-account-delete-billing.cjs` réussis : isolation par propriétaire, 20 relations,
erreurs sûres et protection contre suppression avant annulation Stripe confirmée.
Ces deux scripts simulent Auth/base/facturation. Le test UI ne comporte aucun
abonnement réel ni photo : ni résiliation réelle, ni purge chez les prestataires,
ni restauration d'un fichier exporté ne sont validées par ce passage.

Abonnement, 14 h 35 : trois tests UI natifs réussis (42,318 s au total) :
`testUnavailableSubscriptionCanOpenAccount`, `testSubscriptionSmallScreenLargeText`
et `testWebOfferLinkOpensNativeSubscription`. Ouverture depuis lien, fermeture,
retour au compte anonyme et accès aux contrôles/légaux en XXXL vérifiés.
Résultat `/tmp/coai-subscription-fallback-0928.xcresult`, deux captures examinées
dans `/tmp/coai-subscription-fallback-proof`. Départ sur fixture Debug ; retour
au compte via la page publique réelle, sans connexion ni transaction.
Tests serveur `test-apple-delivery`, `test-apple-transactions-route`,
`test-apple-transaction-policy`, `test-apple-catalogue` et
`test-apple-account-route-errors` réussis : liaison au compte, erreurs sûres,
ordre vérification/persistance/lecture, configuration et contrôle des entrées.
Leurs dépendances sont simulées : aucune preuve nouvelle d'achat StoreKit,
de signature de reçu réelle, de restauration Apple ou de publication.

Reprise réseau revalidée à 14 h 31 sur le simulateur QA : arrêt du seul
serveur localhost:3050, erreur WebKit réelle, message compréhensible,
Réessayer et Repos accessibles, minuteur ouvrable puis fermeture sans blocage.
`testUnavailableNetworkKeepsRecoveryControlsAccessible` passe (9,628 s),
résultat `/tmp/coai-network-unavailable-09281430.xcresult`.
Test séparé démarré serveur toujours arrêté, puis serveur rétabli pendant
les tentatives : formulaire de connexion et Google revenus sans relancer
l'application, erreur disparue. `testLocalNetworkRestorationLoadsLoginWithoutRelaunch`
passe (65,105 s, durée incluant l'attente volontaire du serveur), résultat
`/tmp/coai-network-restored-09281431.xcresult`. Aucun réseau utilisateur ou
service de production modifié. Ne couvre pas les coupures pendant sauvegarde,
achat ou transfert photo, ni les conditions cellulaires sur appareil physique.

Nutrition, 14 h 23 : défaut reproduit puis corrigé — les principes généraux
étaient masqués dès que le programme contenait des jours. Ils restent désormais
accessibles dans une section repliée ; sans jours, leur affichage initial est
préservé. Aucun conseil ni programme modifié. Rendu réel, types, lint, build,
médias des piliers et paires exercice/vidéo vérifiés. Test natif connecté
`testLocalIncompletePillarsPreserveAvailableContent` réussi (49,481 s), avec
ouverture des principes et consultation du mardi de récupération après relance.
Résultat `/tmp/coai-nutrition-overview-09281424.xcresult` ; capture examinée
`/tmp/coai-nutrition-overview-proof/1CAEFD93-CB17-4854-BA25-96A3D6E7C786.png`.
Les essais précédents ont révélé un défilement trop ample et une sélection
ambiguë du bouton dans le test, ainsi qu'une session résiduelle et un blocage
d'animations du simulateur. Test ajusté, fixture recréée, simulateur redémarré
sans effacement avant le passage réussi. Compte temporaire révoqué/supprimé,
absence Auth/application et refus de l'ancien mot de passe confirmés.
Non publié ; validation locale sur simulateur, pas en production.
Contrôle matériel : iPhone 17 Pro toujours indisponible ; seule identité
Apple Development présente, aucune identité Apple Distribution détectée.

Récupération, 14 h 02 : défaut reproduit puis corrigé — la vue ne rendait
qu'un jour et masquait les six autres jours stockés. Le jour actuel reste
en premier ; les autres sont consultables dans des sections repliées, avec
leur propre libellé de jour. Aucun conseil, protocole, droit ou programme
n'est modifié. Test du rendu réel : sept recommandations présentes exactement
une fois, six sections fermées, absence de section vide pour un seul jour,
contenus incomplets toujours tolérés. Types/lint/build et médias des piliers
passent. Test natif connecté `testLocalIncompletePillarsPreserveAvailableContent`
réussi après relance (31,553 s), ouverture et lecture du mardi vérifiées.
Résultat `/tmp/coai-recovery-week-09281411.xcresult`, capture examinée
`/tmp/coai-recovery-week-proof/CF9CD52A-2029-442E-9616-2F1C6DB56CB4.png`.
Fixture locale `--registered --incomplete-pillars` enrichie avec sept jours
et un élément nul ; compte révoqué/nettoyé et ancien mot de passe refusé.
Essai précédent interrompu pour blocage d'animations du simulateur, puis
redémarrage sans effacement. Non publié, ni test physique ni validation
du suivi d'une routine réelle sur plusieurs jours.

Découverte recettes → récupération → Club revalidée à 13 h 47 : test natif
connecté réussi (67,430 s), ingrédients/préparation visibles, filtre récupération
conservé et premier programme accessible, Club « 1 heure par mois · En groupe ·
Sans replay » et premier rendez-vous explicitement en préparation. Captures
examinées dans `/tmp/coai-discovery-final-captures`, résultat
`/tmp/coai-discovery-09281446.xcresult`. Aucun lien WhatsApp déclenché, aucun
message/réservation/achat. Compte fictif supprimé après révocation ; absence
Auth/application et refus de l'ancien mot de passe vérifiés. Ce test porte
sur la découverte, pas sur une séance complète de récupération ou un vrai direct.

Parcours natifs locaux revalidés vers 13 h 14 sur simulateur petit écran :
`testLocalNewAccountDiagnosticReachesResult` réussi (201,481 s), vraie
inscription, email Mailpit, lien ouvert par iOS, accords, diagnostic, reprise
et contrôle de saisie. Profil exact vérifié en PostgreSQL. Captures du retour
email et du résultat examinées. `testLocalConnectedDailyWorkoutPersists`
réussi (65,276 s) : check-in, séance fictive, ressenti, fermeture et relance ;
état final et réponses exactes vérifiés en base. Fixtures et email supprimés,
absence du compte de séance et refus de son ancien mot de passe confirmés.
Résultats : `/tmp/coai-signup-current-092813.xcresult` et
`/tmp/coai-workout-current-092813.xcresult`. Accès programme synthétique pour
la séance, aucun achat Apple ni IA ; pas une validation en production.
Friction corrigée localement à 13 h 45 : raccourci d'enregistrement ajouté
sous le titre pour le membre connecté sans accès programme. Visible et
utilisable sans défilement sur le simulateur petit écran ; rejoint le vrai
bouton sans sauvegarde tacite. Parcours complet réussi (130,012 s), réponses
exactes vérifiées en PostgreSQL puis compte/email fictifs nettoyés.
Preuve : `/tmp/coai-signup-shortcut-09281444.xcresult`, capture examinée
`/tmp/coai-shortcut-visible-captures/A49377AC-266F-41B3-B986-30B41C24A918.png`.
Deux essais avaient rejeté une mesure WebKit des lignes de texte (39 points),
pas de toute l'ancre ; contrôle remplacé par accessibilité immédiate et saut
réel, hauteur CSS minimale 56 px. Un essai interrompu pour attente d'animations
du simulateur a nécessité son redémarrage sans effacement. Types, lint
(6 avertissements existants), build et régressions diagnostic passent.
Non publié ; contrôle physique et production encore requis.

Recontrôle natif à 13 h 03 : `bash scripts/check-ios.sh --device-release`
réussi, 51 XCTest, 65 contrôles cœur, règles WebKit compilées sur macOS,
configuration de confidentialité et cinq cas négatifs validés. Release iPhone
arm64 non signée compilée, manifeste inclus, nom COAI vérifié, marqueurs de
test locaux absents selon le script. Ce contrôle ne charge pas le site distant
et ne valide ni signature, installation, achats réels ni publication App Store.

WhatsApp : absence de contrôle d'accord fournisseur reproduite, puis garde
serveur ajoutée avant profil/message/quota/IA. Tests de refus et quotas réussis
(dont PostgreSQL local réel, fournisseur simulé). Contrat et blocage de mise en
ligne dans `WHATSAPP-CONSENT.md` : flow ManyChat réel non inspecté/configuré,
aucun en-tête statique à ajouter. Non publié ; ce lot seul ne prouve pas le
recueil d'accord sur WhatsApp et ne doit pas être déployé sans transition validée.

Inscription : le webhook Auth fabriquait une date d'accord RGPD et créait un
compte avant le formulaire. Test de reproduction rouge, puis correction : le
webhook authentifié accuse réception sans créer de compte ni d'accord.
Callback et tableau de bord renvoient les comptes incomplets au formulaire ;
celui-ci reste accessible pour ces comptes. La validation explicite complète
uniquement les dates manquantes, sans écraser profil ni dates existantes.
Tests HTTP avec Auth, email local et PostgreSQL réels : nouvelle inscription,
ancien compte incomplet, absence de vérificateur PKCE et page de confirmation
iOS réussis ; identités/messages fictifs nettoyés. Types/build/lint/médias OK.
Pas de test iPhone ni production pour ce lot. Les anciennes dates en production
ne sont pas corrigées automatiquement : leur provenance nécessite un audit.

Coach texte et vocal : accord facultatif explicite ajouté aux trois entrées
(`/coach`, coach du jour, lecteur de séance). Sans accord, aucune dictée ni
requête IA déclenchée par ces interfaces ; l'API refuse les acquittements
absents, obsolètes ou destinés aux images avant lecture du profil et quota.
Tests des trois interfaces/gestionnaires et neuf cas de route réussis ; quota
concurrent revalidé sur PostgreSQL local. Build, typage, lint et médias réussis.
Navigateur local connecté 390 × 844 : accord initialement décoché, activation
et retrait contrôlés, retour à la séance sans accord, réponse HTTP 403 vérifiée.
Captures examinées ; compte fictif supprimé et suppression vérifiée. Aucun
appel IA payant, déploiement ou test iPhone pour ce changement. WhatsApp,
génération automatique, conservation fournisseur et preuve durable d'accord
restent à auditer. Ceci ne constitue pas une conformité globale validée.

Coach pendant la séance : défaut du format vocal reproduit (`context.source`
absent, donc refus 400 par le schéma de l’API), puis corrigé. Le test du vrai
gestionnaire extrait désormais le vrai schéma serveur et couvre échauffement
et exercice, en plus du double appui, du refus micro, du délai réseau et de la
relance. `test-runner-voice-question.cjs` réussi, voix et transport simulés.
Coach texte de séance : réponse absente/vide rejetée sans bulle « undefined » ;
brouillon suivant préservé après réponse tardive. Défaut de brouillon reproduit,
puis `test-daily-coach-response.cjs` réussi (React/transport simulés).
Typage/lint sans erreur/build local et tests médias réussis. Contrôle React :
mise à jour fonctionnelle du brouillon, pas de nouvel effet ni dépendance.
Non publié, aucune conversation IA payante ni validation physique effectuée.

Analyses d’images : accord explicite Anthropic ajouté localement sur les cinq
outils et leurs sept points d’entrée ; refus serveur sans acquittement propre à
l’outil. 31 cas de routes et tests des sept interfaces réussis, prestataire
simulé ; profil mobile connecté contrôlé dans le navigateur local sans envoi
de fichier. HealthKit structuré reste sans IA. Détails et limites dans
`PRIVACY-AUDIT.md`. Non publié, non validé sur iPhone pour ce changement ;
consentements des autres canaux/génération et rétention fournisseur encore à auditer.

Complément fiabilité photo : fichier vide et envoi interrompu maintenant
refusés proprement avant IA ; 42 cas simulés et 27 cas HTTP réels locaux
réussis, y compris HealthKit sans analyse d’image. Build/types/lint réussis,
aucun appel payant ni déploiement. iPhone 17 Pro toujours indisponible.

Nom sous l'icône corrigé : Release affichait encore « COAI test » dans son
Info.plist compilé. Variable par configuration : « COAI » en Release,
« COAI test » en Debug. Les deux valeurs sont désormais contrôlées sur les
applications compilées par `check-ios.sh`. Builds Release arm64 non signée
et simulateur réussis, tests Swift/cœur/WebKit/confidentialité réussis.
Typage web, lint sans erreur (six avertissements), build avec bases factices
et présence des 356 références médias vérifiés. Icône 1024 × 1024 sans alpha.
Journaux : `/tmp/coai-release-name-0928.log`, `/tmp/coai-debug-name-0928.log`,
`/tmp/coai-web-precommit-0928.log`. Non installé en distribution, non publié.

Le blocage de certificat historique ci-dessous est levé : trois tests sur
iPhone 17 Pro ont réussi (durées alignées, partage fictif, durées XXXL).
Deux tests supplémentaires ont échoué avec une vidéo flottante externe
recouvrant la navigation. Ils restent à reprendre sur appareil sans cette
interférence. Les deux mêmes tests réussissent après recompilation sur SE
simulé : `/tmp/coai-simulator-recheck-0928.xcresult`, 40,901 secondes ;
navigation après rotation et minuteur conservé après relance. Captures
paysage et minuteur inspectées. Cela ne valide ni production, ni achats
Apple, ni distribution. Objectif global non atteint.

## État courant — 27 septembre 2026

Complément 21 h 45 : profil corrigé sans promesse automatique de relecture du
coach ; carte programme empilée sur petit écran. Capture SE inspectée : texte
lisible et bouton contenu dans sa carte. Test natif connecté local réussi en
16,5 secondes après correction du sélecteur insensible à la casse et redémarrage
du simulateur (l'exécution précédente attendait les animations pendant 60 s).
Preuve : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_21-44-46-+0200.xcresult`.
Typage, lint sans erreur, build web et 356 références médias présents vérifiés.
L'API avatar n'est appelée par aucun composant de l'interface actuelle : les tests
HTTP ne prouvent pas une fonction de changement d'avatar utilisable par un membre.
Pas de déploiement ni validation physique pour ces changements.

Complément 21 h 20 : les deux parcours Photos (autorisation d'ajout limitée et
refus) réussissent sur simulateur SE ; retour à l'app toujours utilisable.
Le fichier IMG_0013.PNG du stockage Photos du simulateur est comparé octet par
octet au PNG fictif du test : 68 octets identiques, sauvegarde effective prouvée.
Preuve : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_21-20-29-+0200.xcresult`.
L'iPhone 17 Pro est désormais connecté et la compilation de développement signée
réussit, mais iOS refuse encore le programme de tests à 21 h 17 : certificat
développeur non approuvé. Aucun test physique exécuté. Profil valable jusqu'au
1er octobre 2026 ; aucune archive de distribution ni validation TestFlight.
Les chemins de revue sont précisés dans SOUMISSION-BROUILLON.md sans présenter
les preuves locales comme une validation de la version distribuée.

Complément avatar : envoi multipart incomplet et image vide désormais refusés
avec réponse JSON claire (400). Pannes Storage/DB/signature et URL absente
retournent une erreur réessayable (503), sans message interne ni faux succès.
`test-avatar-route.cjs` reproduisait l’exception avant correction, puis passe
avec services simulés. `test-avatar-http-local.cjs` vérifie les vrais services
locaux : upload authentifié, chemin persisté, octets identiques, refus des
envois incomplets/vides, avatar conservé, nouvel essai réussi. Compte/image
jetables supprimés. Typage/lint/build réussis ; UI avatar et production non prouvées.

Complément 20 h 59 : défaut reproduit puis corrigé sur les demandes simultanées
de suppression. Avant : une réponse 200 et une fausse erreur 503 après disparition
du profil. Après : deux réponses 200 sur deux exécutions HTTP locales, absence
du profil/Auth/photos vérifiée. Suppression SQL bornée à l’id ET l’identité Auth ;
absence Auth reconnue seulement après confirmation explicite 404/user_not_found.
Les erreurs réseau, base et identité non confirmée restent bloquantes.
Parcours natif annulation/export/confirmation/relance réussi sur le build corrigé :
`/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_20-59-03-+0200.xcresult`.
Typage, lint et build web réussis. Aucun déploiement ; concurrence avec d’autres
écritures déjà en vol et abonnements réels restent hors preuve.

Complément 20 h 44 : suppression native connectée réussie sur SE simulateur.
Annuler conserve l’accès (export réel encore possible), confirmer supprime le
compte et revient à la connexion, y compris après relance. Avertissement Apple
visible et boutons accessibles sur capture inspectée.
Preuve : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_20-43-42-+0200.xcresult`.
Contrôle indépendant : utilisateur PostgreSQL et identité Auth absents, ancien
mot de passe refusé. Régression HTTP locale réussie : 101 photos supprimées,
deux anciennes sessions refusées, autre compte et sa photo préservés.
Compte jetable uniquement, aucun abonnement réel ni production ; concurrence
et environnements distants restent à valider.

Complément 20 h 29 : export JSON du compte jetable connecté vérifié sur iPhone
SE simulateur : authentification réelle locale, paramètres, export, feuille iOS
avec JSON de 5 ko et action Fichiers, fermeture puis écran toujours utilisable.
Preuve : `/tmp/coai-native-connected-0925/Logs/Test/Test-COAI-2026.09.27_20-29-08-+0200.xcresult`.
L’exception localhost pour les blobs est réservée au Debug simulateur avec
mode local explicite ; aucune autorisation HTTP ajoutée en Release.
51 tests Swift réussis, Release arm64 non signée compilée. Complément 20 h 36 :
second export après fermeture puis sauvegarde dans Fichiers réussis
(`Test-COAI-2026.09.27_20-35-44-+0200.xcresult`). Fichier local de 5 136 octets
retrouvé dans le stockage File Provider du simulateur : JSON valide, compte
jetable attendu, profil présent et un programme. Appareil physique et
production restent à valider.

Complément 20 h 07 : cinq tests du vrai service `ApplePurchaseService` avec
StoreKit Xcode local réussis (annulation/attente, serveur indisponible puis
restauration, mauvais compte refusé, remboursement, invalidation du catalogue
après erreur). Prix français et essai consommé contrôlés. L’éligibilité se met
à jour de façon asynchrone ; test borné en attente de cette mise à jour.
Preuve : `/tmp/coai-storekit-local.zxNzAf/Logs/Test/Test-COAIStoreKitLocal-2026.09.27_20-06-53-+0200.xcresult`.
Configuration dédiée dans `StoreKitTests`, identifiants `fr.coai.localtest`,
serveur et droits simulés, aucune facturation. Cela ne valide ni App Store
Connect, ni signatures reçues par le serveur, ni feuille d’achat UI, ni Sandbox.
Release arm64 non signée, 51 tests Swift et 65 contrôles cœur revalidés ;
absence du catalogue/code de test dans Release vérifiée. Exécution documentée
dans `StoreKitTests/README.md`. Aucun push/déploiement/soumission effectué.
Non-régression UI réussie : lien d’offre → abonnement natif, fermeture et
petit écran en texte XXXL ; capture inspectée, liens juridiques empilés et
accessibles. `Test-COAI-2026.09.27_20-08-36-+0200.xcresult` (deux tests).

Complément 19 h 32 : séance native connectée complète puis relance réussies,
`Test-COAI-2026.09.27_19-28-38-+0200.xcresult` (66,4 s), compte fictif nettoyé.
Chat : préservation d’un nouveau brouillon pendant la réponse précédente,
test réel du gestionnaire avec transport simulé rouge avant / vert après.
Typage, build local et audit des 356 chemins média réussis ; lint sans erreur
(six avertissements existants). Ni réponse IA payante ni publication effectuée.

Complément 19 h 24 : parcours natif connecté recettes → récupération → Club
réussi sur simulateur SE 3 : `Test-COAI-2026.09.27_19-22-29-+0200.xcresult`.
Le Club affiche le rendez-vous en préparation, le direct collectif sans replay
et le lien de préparation WhatsApp accessible. Aucun message envoyé. La capture
confirme le bouton tactile de 44 points ; WebKit expose seulement sa ligne de
texte dans le rectangle d’accessibilité. Compte de test local supprimé.
Test des destinations et de l’unique navigation active également réussi.
Ces preuves sont locales et ne constituent pas une validation en production.

Complément soirée : Release arm64 non signée revalidée, 51 tests Swift et
65 contrôles cœur réussis, vérification WebKit et exclusion du mode local
réussies (`/tmp/coai-release-recheck-evening-0927.log`). Aucun achat Apple réel,
archive signée, déploiement ou installation physique prouvé par ces contrôles.
Suppression des recherches externes de photos inutilisées pour les anciens
programmes ; orchestration serveur et non-régression native testées (`19-00-51`).

Complément 18 h 53 : nutrition/récupération résistent aux entrées non objet
dans les listes de jours/conseils/protocoles. Rendu réel testé et parcours natif
avec données incomplètes locales réussi, relance comprise :
`Test-COAI-2026.09.27_18-52-40-+0200.xcresult`. Aucun contenu valide supprimé
en base, avertissement explicite. Pas de validation en production.
Le catalogue a également été raccourci : premier programme accessible sans
défilement sur SE 3, filtres repliables testés (`18-40-52`).

Complément 18 h 30 : parcours natif connecté local recettes (filtre, ingrédients,
préparation) puis découverte récupération vérifié. Filtres du catalogue agrandis
à 45 points observés, état sélectionné accessible et testé. Résultat
`Test-COAI-2026.09.27_18-29-04-+0200.xcresult`. Aucun achat de protocole ni test
en production ; la longueur de l'introduction du catalogue reste à améliorer.

Complément 17 h 58 : PDF connecté testé dans l’app sur simulateur local, de la
connexion au partage iOS puis au retour à la séance. Correction de la fausse
erreur réseau lors du transfert de navigation vers WKDownload. Résultat
`Test-COAI-2026.09.27_17-57-47-+0200.xcresult` dans le dossier QA connecté.
Compte jetable nettoyé ; aucun partage envoyé. Release arm64 non signé et
absence du mode local revalidés (`/tmp/coai-pdf-handoff-release-final-0927.log`).
Cela ne valide pas le contenu complet des fiches ni le téléchargement en production.

Objectif non atteint. Les sections suivantes sont des preuves historiques,
pas une validation de la version actuelle en production.

- Inscription, retour du lien e-mail, consentements, diagnostic et sauvegarde
  du profil vérifiés dans l’application sur simulateur avec services locaux.
  Résultat natif : `Test-COAI-2026.09.27_16-59-01-+0200.xcresult` dans
  `/tmp/coai-native-connected-0925/Logs/Test/`. Le parcours gratuit s’arrête
  au choix de l’accompagnement : aucun achat Apple validé par ce test.
- Test HTTP réel local : droits contrôlés, trois préparations simultanées sans
  duplication, trois piliers persistés, reprise sans recréation. Douleur,
  antécédent, allergie, grossesse et post-partum orientent vers le coach sans
  programme générique. Effacement explicite des anciennes données sensibles
  vérifié en base ; champs omis conservés. Fixtures et sessions supprimées.
- Compilation Release iPhone arm64 non signée et contrôles du script
  `check-ios.sh --device-release` réussis, journal
  `/tmp/coai-release-recheck-0927.log`. Ce n’est ni une archive signée,
  ni une installation, ni une validation App Store.
- **Blocage éditorial : 86 variantes sur 90 restent incomplètes en médias**,
  sept mouvements concernés. Une réponse HTTP 200 ne prouve pas la qualité
  du programme. Aucun média approximatif réintroduit. Rushes conformes ou
  révision éditoriale validée indispensables.
- 13 Pro détecté mais non appairé ; 17 Pro indisponible. Une identité de
  développement seulement observée. Tests physiques, achats/restauration
  Apple Sandbox, signature de distribution et vérifications de production
  restent ouverts. Pas de publication ni de soumission dans cette passe.

## Historique — 25 septembre 2026

Objectif non atteint. Aucun déploiement ni soumission Apple effectué dans cette
passe. Les preuves ci-dessous restent distinctes d'une validation en production.

Complément après les contrôles du 25 septembre au matin :

- Connexion native **locale réelle** maintenant vérifiée : saisie du mot de
  passe, sauvegarde du prénom, fermeture/relance, lecture du prénom enregistré,
  déconnexion et relance déconnectée. Contrôle PostgreSQL indépendant réussi,
  compte jetable supprimé. Voir `LOCAL-CONNECTED-TESTS.md`, résultat 03-48-07.
  Cela ne valide pas Google/Apple, la production ni les achats.
- Champ date contenu dans sa carte sur petit écran (285 × 51 points), capture
  inspectée. La modification de date reste à tester séparément.
- Les lecteurs du bilan mensuel, des alertes coach, de l'adaptation et de la
  chronologie utilisent maintenant l'historique commun. Tests locaux réussis ;
  ce n'est pas une preuve des écrans connectés en production. La fiche client
  administrateur et son total business lisent encore directement SeanceLog.
- Dernière régression : `/tmp/coai-identity-ios-regression-0925.log` (49 Swift,
  65 core, règles WebKit et Release arm64 non signée), puis deux tests UI
  clavier/brouillon dans `/tmp/coai-identity-ui-valid-0925.log`.
- Appareils et trousseau recontrôlés : 13 Pro disponible au transport, mais
  explicitement **unpaired**, DDI indisponible ; 17 Pro indisponible. Une seule
  identité Apple Development, aucune Distribution. Pas d'installation tentée.

Les listes datées ci-dessous décrivent les passes antérieures ; ne pas reprendre
leurs mentions « non raccordé » ou « aucun compte connecté » comme état actuel.
Les achats sont raccordés dans le code, mais aucune transaction Apple Sandbox
de bout en bout n'est prouvée. Le passage App Store reste ouvert.

- Régression native du 25 : 49 tests Swift, 65 contrôles core, règles WebKit
  macOS, plist/manifeste et Release iPhone arm64 non signé réussis.
  Journal : `/tmp/coai-native-release-0925.log`.
- Simulateur QA petit écran : navigation avec très grande taille de texte et
  rotation, conservation du localStorage fictif après relance puis effacement
  après signal de déconnexion réussis (2 tests). Partage de PDF/PNG fictifs,
  refus de format et refus Photos avec retour utilisable réussis (2 autres).
  Journaux : `/tmp/coai-native-regression-0925.log` et
  `/tmp/coai-native-files-0925.log`. Aucun compte connecté ni achat Apple testé.
- HTTP/Auth/PostgreSQL locaux : suite profil, mesures, séances, programmes,
  PDF et historique réussie. Carte mensuelle : vrai PNG pour membre ayant
  seulement une séance quotidienne terminée, accès privé vérifié. Journal :
  `/tmp/coai-history-e2e-0925.log`. Pas de preuve du partage connecté sur iPhone.
- Corrections locales récentes : historique quotidien inclus dans compteur,
  journal, progression, bilan hebdomadaire, profil appris, carte mensuelle et
  classement des jours d'activité. Pas de performances prescrites transformées
  en performances réalisées. Lecteurs adaptation, administration et e-mail
  mensuel restent à auditer séparément.
- Contrôle des appareils le 25 : iPhone 17 Pro **unavailable** ; iPhone 13 Pro
  détecté par câble, iOS 17.6.1, mais **unpaired**, services développeur indisponibles.
  Aucune nouvelle installation ou tentative de contournement de confiance.
  Reconnexion/déverrouillage et confiance développeur demandés à Anthony.
- Une identité Apple Development, aucune Apple Distribution listée. L'adhésion
  Developer n'est pas déduite de ce seul contrôle. Archive distribuable,
  achats/restauration Sandbox, connexion Apple réelle et confidentialité restent
  des validations ouvertes. Aucun achat autorisé implicitement.
- Autorisation explicite de publier les corrections sur le projet Vercel
  existant redemandée ; aucune réponse reçue à ce stade. Elle ne vaudrait pas
  autorisation de soumission Apple.

## Historique — 24 septembre 2026

Contrôle relancé sur le code après 5ad47b9. Les anciens comptes rendus ci-dessous
sont historiques et ne valident pas le binaire actuel en production.

- `bash scripts/check-ios.sh --device-release` : 49 tests Swift, 65 contrôles
  autonomes, compilation réelle des règles WebKit, plist/manifeste/schéma XML,
  compilation Release arm64 non signée et inclusion du manifeste réussis.
  Preuve : `/tmp/coai-release-current-0924.log`. Ce contrôle ne lance aucun
  parcours connecté et ne valide pas une archive distribuable.
- Une identité Apple Development est disponible dans le trousseau ; aucune
  identité Apple Distribution n’y est listée. Cela ne prouve pas à lui seul
  l’état de l’adhésion du compte Apple.
- iPhone 17 Pro maintenant appairé et disponible : Debug signée construite,
  signature vérifiée et installation sans désinstallation réussie. Le lancement
  reste refusé par iOS (Security ; dernière tentative à 19:53). La cause exacte
  n'est pas prouvée : vérification de la confiance développeur demandée à Anthony.
  Profil de développement valable jusqu'au 1er octobre 2026, 16:39 UTC.
  Aucune recette physique connectée validée. iPhone 13 Pro non appairé dans Xcode.
- Abonnement natif : compte/catalogue, reçus, reprise au premier plan,
  confirmation des droits et réception serveur des notifications raccordés
  dans le code. Ventes, notifications distantes et droits Apple de production
  non activés. Achat Apple réel, restauration et TestFlight toujours non prouvés.
- Connexion Apple implémentée, désactivée par défaut via
  `NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED`. Voir `APPLE-SIGN-IN.md` : fournisseur,
  identifiants distants et parcours Apple réel restent à configurer/vérifier.
  Les tests avec fournisseurs simulés ne prouvent pas une connexion Apple.
- Trois tests UI natifs sur simulateur SE (alignement, grande taille de texte,
  rotation et explorateur) réussis le 24 septembre. Données de test locales,
  sans validation des parcours serveur ou des médias réels.
- Cinq tests UI supplémentaires relancés sur SE le 24 septembre : deux exports
  fictifs (PNG/PDF/JSON, rejet de formats, reprise après fermeture/arrière-plan),
  puis trois parcours publics réels (connexion/clavier, navigation inscription
  et récupération, saisie/visibilité du mot de passe). Tous réussis, captures
  clavier et partage inspectées. Aucun formulaire soumis, aucune authentification
  complète ni demande de récupération envoyée. Journaux :
  `/tmp/coai-export-current-0924.log`, `/tmp/coai-auth-current-0924.log`.
  Ces tests ne couvrent ni panne réseau simulée ni restauration de connexion.
- Intégration HTTP locale connectée réussie : profil, sauvegardes de séance,
  contrôle inter-comptes, programmes et téléchargement de deux PDF réels.
  Les PDF ont une signature et un format valides ; leur contenu visuel complet
  et leur enregistrement physique sur iPhone ne sont pas validés par ce test.
- Anciens exercices sans médias encore observés en production. Corrections
  locales des aperçus, lecteur et exports non publiées : autorisation explicite
  de publication demandée, pas encore reçue. Ne pas annoncer ce problème résolu
  pour les utilisateurs de coai.fr.
- Manifeste présent : motif UserDefaults déclaré. Ce fichier seul ne valide
  ni la collecte du site embarqué ni les réponses de confidentialité App Store.
  Écarts ouverts : portée des données WhatsApp, usages IA, métadonnées de paiement
  et limites de l'export. Usage réel Make/Twilio à confirmer avec Anthony.

Prochaines validations prioritaires : connexion complète et persistante dans
l’app physique ; parcours Apple sandbox avec backend dédié ; contrôle des
dix parcours et des données/médias réels ; confidentialité et suppression.
La distribution demeure distincte de la compilation unsigned, des tests simulés
et de la sauvegarde GitHub. Ne pas acheter d’adhésion sans accord spécifique.

## Historique — 23 septembre 2026

Anthony confirme de poursuivre la préparation sans frais après vérification du
portail Apple : connexion établie, mais invitation à rejoindre le Developer
Program sur le compte affiché. Ne lancer ni inscription payante ni souscription.
Le dossier éditorial proposé est `ios/SOUMISSION-BROUILLON.md` ; non publié,
à confronter aux parcours réellement livrés avant toute soumission.

Code sauvegardé sur `codex/ios-release-candidate`, déploiement automatique de
cette branche désactivé. Build web séparé des migrations, compilation locale
réussie. Production toujours distincte : les anciens états ci-dessous sont
historiques et ne prouvent pas une validation actuelle. TestFlight, achat Apple
complet et validation des dix parcours restent ouverts.

Décision Anthony du 16 septembre 2026 : la préparation effective de l'app iOS
à l'App Store prend la priorité sur les effets visuels et la croissance.
Les autorisations de poursuivre restent valables, sans frais supplémentaires.
Anthony confirme le 16 septembre ne pas encore avoir souscrit l'adhésion Apple
Developer. Ne pas confondre connexion au portail et capacité de distribution.
La préparation locale continue ; TestFlight et la soumission restent à débloquer.
L'acceptation finale appartient à Apple et ne peut être garantie.

## Export PDF — correctif local, 17 septembre 2026

Bug reproduit : EN_ATTENTE visible dans l'entraînement mais exclu des deux
exports PDF (réponse 404 sans génération). La sélection des exports suit
maintenant l'accès de l'écran : entraînement en attente permis avec mention
de relecture non effectuée, refus des statuts rejetés/inconnus, priorité au
dernier validé. Nutrition/récupération en attente restent exclues. Aucun
changement des statuts stockés ou des droits d'abonnement.

Exports privés sans cache, erreurs 503 explicites sans détails techniques.
Les affirmations systématiques de supervision/validation dans l'en-tête et
le pied de page sont retirées. Aucun visuel validé ni PDF de référence modifié.
36 tests de routes sur doublures Auth/DB/rendu passent ; génération réelle
locale d'un PDF avec six exercices fictifs, sans images distantes, inspectée.
TypeScript, lint, build sur base factice et audit médias réussis.

Correctif NON publié : autorisation explicite de publication GitHub/coai.fr
demandée. Téléchargement connecté en production et enregistrement sur iPhone
restent à vérifier après publication. La présence de photos adaptées et le
contenu complet du programme ne sont pas validés par ce test de rendu fictif.

Coach : lecture du code confirme un chat et une route réservée aux abonnements
actifs, utilisant un fournisseur IA payant. Aucun appel réel lancé ; disponibilité
du fournisseur et conversation sur le compte d'Anthony non vérifiées.

## Navigation supérieure simplifiée — 17 septembre 2026

À la demande d'Anthony, le doublon `aside.coai-app-nav` est masqué seulement
dans le WebKit de l'app, via une règle cosmétique limitée à coai.fr/www.coai.fr.
Pas de changement du site, du DOM d'authentification ni de pont JavaScript.
Un explorateur SwiftUI restitue les 26 destinations du menu et des sous-menus,
regroupées par usage ; leurs routes existent dans le dépôt. Réglages conserve
la déconnexion. Les restrictions d'achat du pilote restent actives et un clic
sur Abonnement affiche leur explication, sans ouverture de paiement.
Titre natif raccourci à COAI ; mention de version de test dans l'explorateur.

Tests : 25 Swift, 61 contrôles noyau et compilation effective des règles WebKit
réussis ; deux tests UI sur SE réussis dans
`/tmp/coai-explorer-hitarea.xcresult`. Ils vérifient le masquage du doublon sans
masquer le contenu, les rubriques principales, l'accès à Réglages, la fermeture,
le clic Abonnement et son message, puis l'alignement/la sélection des onglets.
Un échec intermédiaire a révélé que les espaces vides des lignes n'étaient pas
tactiles avec le style sobre : corrigé par une zone rectangulaire complète.
Les destinations s'ouvrent après fermeture du menu pour éviter les présentations
concurrentes. Captures finales inspectées. Release arm64, Debug signée,
TypeScript, lint, build web sur base factice et audit médias réussis.

Installation sans désinstallation confirmée sur l'iPhone 17 Pro à 20:36,
lancement confirmé à 20:37. Rendu connecté sur l'appareil encore à confirmer :
les tests UI utilisent des données fictives, pas le compte personnel. Aucun
déploiement web, push GitHub, TestFlight ou envoi App Store effectué.

## Barre native — retour iPhone du 17 septembre 2026

Les captures fournies par Anthony montrent le formulaire de connexion puis
l'écran Entraînement dans l'app physique. Il s'agit de preuves utilisateur,
pas d'une validation complète de la connexion et de sa persistance par nos tests.

Correction de la barre : quatre cellules verticales identiques, pictogrammes
21 points dans un cadre 28 × 26, zones tactiles d'au moins 56 points de haut,
teintes neutres et sélection champagne sur fond discret. Repos n'est plus
horizontal. L'état sélectionné suit l'URL WebKit, y compris les changements
de page sans rechargement ; aucun onglet n'est sélectionné sur la connexion.
Masquage au clavier conservé. Navigation web supérieure en doublon encore
à simplifier : cette livraison ne prétend pas refondre tout l'écran.

Preuves : test UI sur simulateur SE réussi (alignement, largeur, zones tactiles,
sélection Séance/Compte/Connexion et ouverture/fermeture Repos), capture inspectée
dans `/tmp/coai-tabbar-alignment.xcresult`. 25 tests Swift et 54 contrôles noyau
réussis, compilation Release iPhone et Debug signée réussies. TypeScript,
lint, build web avec base factice, audit médias et diff vérifiés.
Version installée sans désinstallation sur l'iPhone 17 Pro d'Anthony à 19:59,
lancement confirmé à 20:00. Rendu physique après cette mise à jour encore à
confirmer ; pas de publication web, TestFlight ou App Store.

## Checklist globale persistante — actualisée le 1er octobre 2026

« Testé localement » ne signifie ni testé en production ni prêt à publier.
Aucun des dix parcours n'est encore déclaré terminé de bout en bout sur iPhone.
L'app actuelle combine SwiftUI et des écrans web WKWebView ; elle ne constitue
pas encore une expérience native complète validée.

| Parcours | État réel | Preuve / travail restant avant validation |
| --- | --- | --- |
| 1. Installation et ouverture | Validé partiellement sur appareil | Debug signé installé sur iPhone 17 Pro ; navigation connectée, partage PDF et persistance du minuteur vérifiés le 1er octobre. Navigation native en gros texte et rotation vérifiée avec fixture web. Archive de distribution, installation propre et TestFlight non validés. |
| 2. Compte et connexion | Validé partiellement en local | Compte fictif : confirmation email, mauvais mot de passe puis correction et session après relance vérifiés dans l’app simulée. Récupération app → email local → Safari → reconnexion persistante dans l’app, ancien mot de passe refusé et lien déjà utilisé refusé vérifiés le 1er octobre. Session existante utilisée sur iPhone, sans refaire une connexion. Récupération physique/distante, connexion Apple et parcours d’authentification en production restent à valider/compléter. |
| 3. Diagnostic et score COAI | Validé partiellement en local | Nouveau compte, email de confirmation, diagnostic, reprise, contrôle des réponses sauvegardées et raccourci d'enregistrement testés dans l'app simulée le 28 septembre. Validation physique et production restantes. |
| 4. Programme personnalisé | Validé partiellement en local | Premier programme depuis un profil éligible prérempli et droits fictifs : création dans l'app, première séance ouverte même un jour de repos, relance et trois piliers sans doublon contrôlés le 1er octobre. Refus d'accès et profils exclus vérifiés par HTTP local. Enchaînement complet depuis le diagnostic et l'abonnement réel, diversité des profils, appareil physique et production restent à valider. |
| 5. Entraînement, nutrition, récupération | Validé partiellement sur appareil | Navigation Nutrition/Récupération/Recettes/Coach/Séance et partage PDF vérifiés en ligne sur iPhone le 1er octobre ; minuteur persistant vérifié. Programmes nutrition/récupération EN_ATTENTE : contenu complet non validé. Catalogue physique en échec (clavier et rowing encore présent en ligne), corrections locales non publiées. Droits, cohérence de tous les médias et petits écrans restent à compléter. |
| 6. Séances, performances et progrès | Validé partiellement en local | Séance terminée et retour d’effort sauvegardés ; mesures et photo après relance vérifiées avec compte fictif connecté, contrôle PostgreSQL et fichier Storage réel local. Export du compte enregistré dans Fichiers le 1er octobre, JSON contrôlé. RepCount : deux mouvements, charge décimale française, reprise du brouillon et historique après relance vérifiés dans l’app simulée le 1er octobre ; trois séries exactes dans une seule séance confirmées indépendamment dans PostgreSQL. Cela ne valide pas tous les parcours RepCount ni l’ensemble en production et sur appareil physique. |
| 7. Check-ins, adaptations et mémoire | Validé partiellement en local | Check-in et séance terminée puis relance vérifiés dans l'app simulée le 28 septembre avec contrôle PostgreSQL. Cela ne valide ni toutes les adaptations ni la mémoire IA réelle ; restent ces parcours, isolation complète et production. |
| 8. Abonnements Apple | Validé partiellement en local + intervention humaine | Écran natif raccordé au service ; huit scénarios StoreKit Xcode réussis avec serveur simulé, dont reprise, compte différent, remboursement, expiration et restauration vide. Tarifs approuvés le 23 septembre : 19,99 €/mois, 119 €/an, essai de sept jours si éligible. Catalogue distant, activation, migration distante, signatures/notifications Apple réelles et parcours Sandbox de bout en bout restent à valider ; aucun achat réel effectué. |
| 9. Notifications et réengagement | En cours | Concurrence, refus de permission et réception visible en arrière-plan testés sur simulateur. Appareil physique, écran verrouillé et réengagement consenti restent à vérifier/implémenter. |
| 10. Suppression sécurisée | En cours, blocage photos | Compte jetable supprimé depuis l'app simulée, absence Auth/profil et refus de l'ancien mot de passe vérifiés indépendamment le 28 septembre. Concurrence et reprise de photos testées avec stockage local réel et pannes injectées. Arrêt avant envoi sans preuve, conservation opérationnelle, facturation réelle et production restent non validés ; voir PHOTO-DELETION-READINESS.md. |

Terminé et testé **au niveau technique local seulement** : règles de navigation,
horloge/pause persistante, séquencement des livraisons d'achats et des alertes
(24 XCTest), compilation simulateur et Release iPhone sans signature.

Blocages humains identifiés : statut d'adhésion Apple Developer à confirmer (aucun achat autorisé),
contrats/validation Apple, configuration du catalogue distant et validation juridique, autorisation
d'une éventuelle migration de production. Ces blocages n'empêchent pas les autres
travaux de développement et de test sans frais.

Restant transversal : audit confidentialité, sécurité et charge backend,
accessibilité/clavier/safe areas, captures App Store réelles, description exacte,
compte de revue, tests physiques et TestFlight. Rentabilité et croissance ne
peuvent pas être déduites d'un build : elles nécessitent des mesures réelles.

## Accès appareil et signature réévalués — 17 septembre, 19 h 25

Mise à jour 19 h 42 : Anthony confirme le déverrouillage. Le lancement réel de
`fr.coai.mobile` réussit (`/tmp/coai-iphone-unlocked-launch.json`). Le processus
est toujours présent environ une minute après, contrôle ciblé par son PID
(`/tmp/coai-iphone-process-check.json`). Aucun formulaire envoyé, préférence
réinitialisée ni donnée de compte lue. Cela prouve le lancement du binaire sur
appareil, pas le chargement du contenu web, la connexion ou la stabilité à long
terme. Confirmation de l'écran affiché demandée à Anthony.

Mise à jour 19 h 35 : Anthony a donné son accord. `devicectl device install app`
a réussi sur l'iPhone 17 Pro avec le bundle existant `fr.coai.mobile`, sans
désinstallation ni réinitialisation demandée. Résultat enregistré dans
`/tmp/coai-iphone-update-result.json`. L'app installée provient du build signé
contrôlé ci-dessous. Les données et sessions ne sont pas lues pour ce contrôle.
Le lancement a échoué avec le motif système **Locked** (FBSOpenApplicationError
7), pas une erreur applicative démontrée : `/tmp/coai-iphone-launch-result.json`.
Déverrouillage personnel demandé. Ne pas présenter l'installation réussie comme
un lancement ou un parcours connecté validé. Aucun achat ni publication Apple.

`devicectl` détecte maintenant l'iPhone 17 Pro appairé, joignable, iOS 26.1,
mode développeur activé. `fr.coai.mobile` (COAI test 0.1.0, build 1) y est déjà
installé ; cela ne démontre pas qu'il s'agit du code actuel. L'iPhone 13 Pro
apparaît aussi, mais Xcode le considère non appairé : pas de test tenté dessus.

Compilation **Debug iPhone signée** réussie avec certificat et profil déjà
présents, sans `-allowProvisioningUpdates`, création de certificat ni abonnement.
`codesign --verify --deep --strict` réussi. Binaire local :
`ios/DerivedDataSigned/Build/Products/Debug-iphoneos/COAI.app` ; artefacts ignorés
par Git. Journal : `/tmp/coai-device-signed-build.log`.
Le profil existant expire le 19 septembre 2026 à 21:22:02 UTC. C'est une signature
de développement temporaire, pas une validation des droits App Store/TestFlight.
L'ancienne mention « appareil hors ligne » ne décrit donc plus cet état.

À l'issue du premier contrôle, la mise à jour attendait l'accord d'Anthony ;
l'installation ultérieure est consignée ci-dessus. Aucune désinstallation,
réinitialisation ou lecture des données personnelles. Parcours connecté, sauvegarde, paiements et lancement du
nouveau binaire sur cet appareil non validés. Adhésion Developer toujours non
confirmée ; ne pas assimiler certificat de développement et droit de publication.

## Panne réseau : reprise native

Test réel pendant l'inaccessibilité de coai.fr depuis le Mac/simulateur QA,
sans erreur injectée ni compte connecté. L'ouverture native attendait environ
60 secondes avant d'afficher l'erreur. Les requêtes de page lancées par
`load` utilisent maintenant un délai de 20 secondes. Les soumissions de
formulaires et appels API web ne sont pas modifiés, ni rejoués automatiquement.
`testUnavailableNetworkKeepsRecoveryControlsAccessible` vérifie l'erreur en
moins de 30 secondes, ouvre/ferme Repos, puis relance le chargement par Réessayer.
Preuve avant/après : `/tmp/coai-offline-error-ui.xcresult` et
`/tmp/coai-offline-fast-error-ui.xcresult`, succès sur SE / iOS 26.5.
La restauration du réseau, le succès après reprise, les pannes en cours de
formulaire et l'appareil physique restent à tester. Ne pas confondre ce test
de panne avec un parcours connecté réussi. Exécuter ce scénario seul, uniquement
sur un simulateur QA dont la destination COAI est réellement inaccessible.

Contrôle final : `/tmp/coai-offline-accessible-ui.xcresult` réussi. Capture
inspectée, bouton Réessayer noir sur or et zone tactile d'au moins 44 points
contrôlée par le test. 25 tests Swift, règles WebKit, Release arm64 sans signature,
TypeScript, lint et build web réussis. Modification native locale uniquement,
aucune version distribuée validée.

## Notification de repos — réception vérifiée sur simulateur

Le test `testRestNotificationDeliveredInBackground` démarre un vrai repos de
30 secondes, place l'app en arrière-plan et attend la notification système.
Il vérifie son titre visible et son texte, puis capture l'écran complet.
Capture inspectée : bannière « Repos terminé », logo COAI et message exact.
Résultat réussi : `/tmp/coai-rest-delivery-visible.xcresult`, iPhone SE simulé,
iOS 26.5, appareil QA distinct réservé aux autorisations acceptées.
La page web est une fixture Debug hors réseau ; le minuteur et le service de
notification sont ceux de l'app. Aucun compte ou service payant utilisé.

Cela ne valide pas un iPhone physique, l'écran verrouillé, les modes Concentration,
l'app arrêtée de force, TestFlight ou une notification de réengagement serveur.
Les tests de refus doivent tourner sur un autre simulateur : la permission iOS
persiste. Le test remet le minuteur à zéro et désactive son option d'alerte.

## Traceurs facultatifs dans le pilote iOS — 17 septembre 2026

### Export de compte JSON — vérification native locale

Couverture serveur complétée localement : les 12 relations de suivi manquantes
(repas, avis, tests maxi, check-ins, adaptations, activité, séances quotidiennes,
récupération musculaire, achats de programmes, routines, corrections de mouvement,
retour de résiliation) rejoignent les six relations déjà exportées.
La recherche utilise uniquement l'identité authentifiée, jamais un ID demandé
par le client. Pas de jointure vers les parrains/filleuls ou notes de travail
privées du coach. Les erreurs ne renvoient ni détail technique ni export partiel.
Réponses privées `no-store`, route explicitement dynamique.
`scripts/test-account-export.cjs` réussi avec Auth/DB simulés et vraies réponses
Next.js : deux identités, données absentes, absence de session, erreurs Auth/DB.
TypeScript, lint et build web réussis. Aucun schéma ou réglage Supabase changé.
Ce lot n'est pas encore publié : lecture en base réelle et export iOS connecté
restent à valider. Ce n'est pas un export exhaustif de tous les prestataires :
binaires des photos/vidéos, données non liées par userId, journaux techniques et
éventuelles demandes d'accès aux notes demandent encore un traitement distinct.

**Mise à jour : sauvegarde locale dans Fichiers vérifiée sur simulateur.**
La capture de l'écran complet a montré que le sélecteur était bien ouvert,
avec un bouton Retour, mais sans le bouton Annuler attendu par le test.
L'échec précédent provenait donc du sélecteur XCUITest pour ce parcours, pas
d'une preuve de panne de l'app. Le test attend désormais le champ du nom,
saisit un nom unique `COAI-QA-<UUID>`, enregistre et contrôle le retour à COAI.
Réussi : `/tmp/coai-files-save-confirm.xcresult`, simulateur QA SE / iOS 26.5.
Le JSON sauvegardé dans le fournisseur local a été relu séparément et comparé
octet par octet : 26 octets identiques à `{"test":true,"seances":[]}`.
Aucune donnée réelle, aucun remplacement de fichier existant et aucun iCloud.
Ce succès ne valide ni l'export complet d'un vrai compte, ni l'appareil physique.

**Historique de l'investigation (hypothèse d'intégration désormais levée ici).**
Le test `testJSONFileSavePicker` sélectionne réellement l'action « Enregistrer
dans Fichiers », mais le sélecteur/son bouton d'annulation n'est pas observable
sur le simulateur SE après 30 secondes. Résultats en échec conservés :
`/tmp/coai-json-file-picker-v2.xcresult`, `/tmp/coai-json-file-picker-v3.xcresult`.
Le processus Apple SaveToFiles est lancé ; ses logs montrent des erreurs
FileProvider et un fournisseur iCloud non authentifié. Ce n'est pas une preuve
que l'absence de connexion iCloud soit la cause unique. Aucun compte iCloud
connecté, fichier réel enregistré ou réglage système modifié pour contourner.
Le test est resté rouge jusqu'à l'identification du mauvais élément attendu.
Les anciens résultats ci-dessous portent uniquement sur la validation du format
et la feuille de partage ; la sauvegarde vérifiée est décrite ci-dessus.

Investigation complémentaire : lancement de l'app système Fichiers puis accès
à Explorer sur le simulateur QA. « Sur mon iPhone » est disponible et vide ;
aucun document ouvert/créé et aucune connexion iCloud tentée. Refaire l'export
après cette initialisation ne résout pas l'échec du sélecteur (30 s).
Preuves : `/tmp/coai-files-initialization.xcresult` et
`/tmp/coai-files-locations.xcresult`. L'initialisation manquante de Fichiers ne
suffit donc pas à expliquer l'échec. Le code exploratoire qui journalisait
l'arbre d'accessibilité de Fichiers n'est pas conservé dans les tests réguliers.
La capture complète a ensuite permis d'isoler l'interrogation XCUITest ; la
comparaison sur appareil reste nécessaire. Ne pas activer le partage de tout le dossier Documents de l'app
pour contourner cet échec : cela pourrait exposer des fichiers privés.

Le bouton web « Exporter mes données » fabrique un Blob `application/json` qui
était refusé par le pilote. Le téléchargement accepte maintenant ce format et
valide le document complet (objet JSON, limite 15 Mio), pas seulement son nom
ou un préfixe. HTML déguisé, JSON tronqué, valeurs seules et fichiers trop gros
sont refusés. Les contrôles d'origine, de navigation et le nettoyage local restent
actifs. Aucune donnée réelle utilisée dans ces tests.

25 tests Swift réussis, Release arm64 sans signature, TypeScript, lint et build
web réussis. Deux tests UI réussis dans le simulateur SE : export JSON fictif
et refus d'un JSON invalide, plus non-régression PDF/PNG. Capture inspectée :
« JSON · 26 octets », feuille système avec « Enregistrer dans Fichiers ».
Preuve historique : `/tmp/coai-json-export.xcresult`. L'enregistrement local a
été validé ensuite (voir ci-dessus) ; l'export complet d'un compte connecté et
l'app distribuée ne sont pas validés.
La couverture des données par la route serveur reste à compléter séparément.

### Traceurs

Rapports d'erreur : filtre commun navigateur/Node/Edge ajouté et testé avec le
vrai SDK dans un transport mémoire. Voir l'inventaire PRIVACY-AUDIT. Les traces
de performance restent désactivées pendant cet audit ; les rapports d'erreur
gardent un sous-ensemble technique. Aucun échange réel Sentry validé ni nouvelle
déclaration de conformité. La synchronisation GitHub attend toujours l'accord
explicite demandé après le refus de la protection d'exécution.

Inventaire et écarts précis : [PRIVACY-AUDIT.md](PRIVACY-AUDIT.md).
Après compilation de la cible UI, trois scénarios hors réseau passent aussi
(partage et ajout/refus Photos) : `/tmp/coai-native-privacy-offline-regression.xcresult`.
Commit `8bd72c7` sauvegardé localement ; push en échec réseau. Vercel confirme
que la production est encore sur `371edfb` : nouveau comportement public non
déployé et non validé. Aucun succès production annoncé pour ce lot.

Le pilote ne demande pas ATT : les traceurs facultatifs restent désactivés,
même si un ancien accord aux cookies est enregistré. Marqueur de capacité
`COAIiOS/1` dans le User-Agent, jamais utilisé pour authentifier ni ouvrir des
droits. Le site Safari conserve ses choix habituels. Aucun consentement stocké
n'est écrasé. Les composants Google Analytics, Meta et Vercel Analytics ne sont
pas montés dans ce contexte ; les règles WebKit bloquent en complément leurs
domaines connus, ainsi que Clarity. Ce n'est pas un audit exhaustif du réseau.

Tests de consentement et rendu React réussis, notamment ancien accord positif,
premier rendu, marqueurs invalides et navigateur ordinaire. Règles compilées
par WebKit ; 24 XCTest, Release arm64 sans signature, TypeScript, lint et build
web réussis (`/tmp/coai-native-privacy-release.log`). Un scénario UI dédié est
ajouté mais **reste à exécuter contre le site déployé**. Le test complémentaire
diagnostic/marketing n'a pas pu tourner : base locale 127.0.0.1:54322 arrêtée.

Restent l'inventaire des données pour App Store Connect, les journaux techniques
et Sentry, les transmissions backend et la vérification réseau sur appareil.
Ne pas déclarer « aucune donnée collectée » : compte, coaching et services
techniques existent. Référence :
https://developer.apple.com/app-store/user-privacy-and-data-use/

## Téléchargements et partage natif — 17 septembre 2026

### Sauvegarde Photos : permission minimale vérifiée

Le test de l'action « Enregistrer l'image » a révélé une demande d'accès à
**toute la photothèque**. L'ajout de `NSPhotoLibraryAddUsageDescription` fait
désormais demander uniquement l'ajout du fichier. Dialogue système inspecté
visuellement : aucune lecture des autres photos demandée par cette action.
Le script de contrôle vérifie que cette déclaration reste présente.

Deux scénarios supplémentaires passent : accepter l'ajout d'un PNG fictif,
et refuser sans bloquer la page COAI. Le fichier créé dans Photos sur le
simulateur de test a été comparé octet par octet au PNG fictif (68 octets) :
identique. Aucune photo personnelle lue ou supprimée. Les tests remettent à
zéro uniquement la permission Photos de COAI dans leur simulateur de test.

Preuves : `/tmp/coai-photo-add-only.xcresult`,
`/tmp/coai-photo-refusal.xcresult`. Régression finale : **8 tests UI sans échec**
sur iPhone SE / iOS 26.5, `/tmp/coai-photo-regression.xcresult` ; seul le test de
saisie d'inscription déjà validé auparavant est exclu. 24 tests Swift, Release
iPhone non signée, TypeScript, lint et build web réussis. Les neuf scénarios
existent dans la cible UI. Cela ne valide pas une Story réelle connectée,
Instagram/TikTok, les autres versions d'iOS ou un appareil physique.

Référence : https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryaddusagedescription

Les liens de fichiers temporaires `blob:` étaient refusés par la navigation du
pilote. Le navigateur prend maintenant en charge les téléchargements WebKit et
ouvre la feuille de partage iOS pour les PDF, PNG et JPEG autorisés. Aucun pont
JavaScript ni copie de cookies : le téléchargement reste géré par WebKit.
Ce lot ne modifie ni le contenu, ni les visuels, ni la mise en page des fiches.

- Origines COAI HTTPS uniquement, destinations de paiement toujours refusées,
  contrôle des redirections et des types MIME, taille maximale de 15 Mio,
  vérification de l'en-tête du fichier avant partage.
- Un seul fichier à la fois ; annulation explicite et délai maximal de 60 s.
  Nom local générique, répertoire temporaire UUID propre à l'app avec protection
  de fichiers, nettoyage après fermeture et des restes au prochain démarrage.
- La feuille iOS laisse choisir l'action à l'utilisateur : aucun destinataire
  choisi, envoi, publication ou sauvegarde externe automatique.
- Un septième scénario UI utilise une page **fictive hors réseau, Debug seulement** :
  PNG, PDF, lien image sans attribut de téléchargement, refus d'un fichier HTML,
  fermeture de la feuille et conservation de la page. Réussi et capture inspectée.
  La fixture n'est pas présente dans le binaire Release (contrôle des chaînes).
- Régression finale sur iPhone SE (3e génération), iOS 26.5 : **6 tests UI,
  zéro échec**, `/tmp/coai-download-regression-ui.xcresult`. Le test de saisie
  d'inscription, déjà passé plus tôt sur ce même modèle, n'a pas été relancé dans
  ce lot à cause des longues attentes d'animation de XCUITest.
- 24 tests Swift, compilation Release iPhone arm64 non signée, TypeScript, lint
  et build web avec base factice réussis. Aucun achat ou compte modifié.

**Non validé** : export d'une vraie fiche connectée, branche HTTP
`Content-Disposition: attachment`, sauvegarde dans Fichiers,
publication Instagram/TikTok, iPhone physique et version distribuée. Ce lot ne
branche pas `window.print()` sur l'impression native et ne démontre pas que tous
les boutons de partage web utilisent ce nouveau chemin. Le parcours 6 reste ouvert.

Références Apple consultées :
- https://developer.apple.com/documentation/webkit/wkdownloaddelegate
- https://developer.apple.com/documentation/webkit/wknavigationaction/shouldperformdownload

## Saisie d'inscription dans l'app — 17 septembre 2026

Un sixième scénario UI saisit des valeurs fictives dans Prénom, Email et Mot de
passe, vérifie le clavier, la disparition de la barre native, l'affichage puis
le masquage du mot de passe et l'accès au bouton de création. Il ne soumet jamais
le formulaire et ne crée aucun compte. Test réussi sur iPhone 17 simulé :
`/tmp/coai-signup-keyboard-20260917.xcresult`. Capture exportée et inspectée :
les valeurs et le bouton sont lisibles, le mot de passe est masqué à la fin.
Ce scénario ne démontre pas la création effective du compte ni l'email reçu.

Les **6 scénarios passent aussi sur iPhone SE (3e génération), iOS 26.5**,
375 × 667 points : `/tmp/coai-small-screen-20260917.xcresult`. Captures de
connexion/clavier et d'inscription exportées et inspectées. Les champs, le
masquage et le bouton sont accessibles par défilement. Réserve : le test de
saisie a subi des attentes d'animation de 60 secondes répétées dans XCUITest
(suite : environ 18 minutes). Les actions finissent et assertions passent,
mais ces résultats ne prouvent pas la fluidité sur un iPhone physique. Ce point
reste à investiguer sur appareil avant validation des performances.

Une connexion réelle dans l'app est nécessaire pour tester ensuite diagnostic,
programme, sauvegarde des séances et persistance entre relances. La connexion
Google du navigateur de bureau n'est pas automatiquement transférée au pilote.
Ne pas extraire ses cookies ou demander de mot de passe dans la conversation.

## Alerte de repos facultative — 17 septembre 2026

### Refus de notification : message préservé

Le cinquième test d'interface vérifie un refus de notification, le commutateur
désactivé, le lien vers Réglages et le démarrage/arrêt du minuteur malgré ce refus.
Il a détecté une disparition du message : la remise à jour de la programmation
au retour au premier plan effaçait aussi l'information de permission. Les deux
messages sont désormais séparés. Résultat après correction : **5 tests UI sans
échec**, `/tmp/coai-ui-alert-message.xcresult`, 22 tests Swift et compilation
Release iPhone non signée réussis. TypeScript, lint et build web passent aussi.
Un premier refus système a été actionné lors du test précédent ; le dernier
passage vérifie également le refus mémorisé par iOS. L'autorisation et la réception
en arrière-plan restent non validées. Aucun compte ni paiement touché.

### Navigation native : retour après récupération — 17 septembre 2026

Un test réel dans le simulateur a reproduit une flèche retour désactivée après
navigation vers « Mot de passe oublié ». Les changements d'historique sans
rechargement complet n'appelaient pas `didFinish`. Le modèle observe désormais
`canGoBack`, réinstalle l'observation à chaque remplacement du navigateur et
ignore les callbacks d'une ancienne vue. Aucun script injecté.

Après correction : **4 tests d'interface réussis**, dont retour vers connexion,
accès à l'inscription et annulation de la demande système Google. Résultat :
`/tmp/coai-ui-history-fixed.xcresult`. Capture d'inscription exportée et inspectée.
Pages publiques de production chargées dans le simulateur iPhone 17 / iOS 26.5 ;
aucun formulaire envoyé, compte créé ou paiement effectué. Cela ne valide pas
une authentification réussie, une récupération email complète ou l'app distribuée.
22 tests Swift, build Release iPhone non signé, TypeScript, lint, build web et
audit des médias réussis. Le test sur appareil physique reste ouvert.

Mise à jour de vérification : un vrai test XCUITest du minuteur passe désormais
sur iPhone 17 simulé / iOS 26.5 : démarrage, pause, fermeture/réouverture,
redémarrage du processus, reprise et arrêt. Capture finale exportée et inspectée.
Résultat final : `/tmp/coai-ui-smoke-final-20260917.xcresult`, 2 tests sans échec.
Le second vérifie aussi la page publique de connexion chargée depuis COAI,
l'ouverture des touches du clavier, le champ accessible et la barre native
masquée. Aucun identifiant saisi et aucun formulaire envoyé. La capture initiale
montrait les conseils du clavier iOS : le test attend désormais les vraies touches.
La cible est conservée dans le dépôt et les instructions sont dans `ios/README.md`.
Cela dépasse les tests du calcul, mais ne prouve ni la réception des notifications,
ni le parcours connecté, ni un test sur iPhone physique ou en production.

- Permission demandée uniquement après activation explicite du commutateur.
  Aucun abonnement, serveur de notifications ni appel payant ajouté.
- Message local générique, sans données de santé ni identifiant de compte.
  Refus ou erreur ne bloque pas le minuteur ; lien vers les réglages proposé.
- Un identifiant unique, annulation à la pause/arrêt/désactivation ; une relance
  remplace l'ancienne alerte. Une réponse tardive est nettoyée avant la suivante.
- Quatre tests déterministes : arrêt pendant la vérification d'autorisation,
  pause pendant un ajout, relances rapides, erreur suivie d'une nouvelle tentative.
- Vérifications : 22 XCTest sans échec, builds simulateur et Release arm64,
  TypeScript, lint et build web avec base factice. Logs locaux temporaires :
  `/tmp/coai-reminder-simulator.log`, `/tmp/coai-reminder-release.log`,
  `/tmp/coai-reminder-webbuild.log`.
- Le contrôle visuel Simulator a expiré sans réponse. Restent donc à vérifier
  réellement : accepter/refuser, écran verrouillé, pause/relance, retour des
  Réglages, mode Concentration et réouverture. Aucune validation production.
- Pas de bannière forcée au premier plan : le décompte reste visible dans l'app.
  Cette fonction ne remplace pas le travail restant sur le réengagement.

Références Apple consultées :
- https://developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications
- https://developer.apple.com/documentation/usernotifications/scheduling-a-notification-locally-from-your-app

## Suppression des photos du compte — 17 septembre 2026

Le nettoyage ne se limite plus à la première page de 100 fichiers. Il liste les
photos avant suppression, supprime par lots et vérifie que le dossier est vide.
Les préfixes vides/invalides, entrées inattendues, erreurs Storage et suppressions
non confirmées arrêtent l'opération avant suppression du profil. Le message
explique qu'un nettoyage partiel a pu avoir lieu et permet une nouvelle tentative.
Au-delà de 10 000 entrées, arrêt sûr nécessitant assistance plutôt qu'une boucle
non bornée dans une requête serveur. Aucun compte réel supprimé pour les tests.

Tests simulés : `node scripts/test-photo-cleanup.cjs` (0, 1, 100 et 205 fichiers,
pagination, périmètre, erreurs et suppression silencieusement incomplète) et
`node scripts/test-account-delete-billing.cjs` (le profil et l'identité sont
conservés si Storage échoue). Validation production encore requise.

Ce correctif ne clôt PAS le parcours 10 : il reste notamment la révocation des
sessions et la concurrence avec de nouveaux uploads ou une recréation du profil.
Ne pas annoncer une suppression sécurisée complète avant ces travaux et un test
de bout en bout sur un compte jetable autorisé.

### Reprise de suppression de l'identité — 17 septembre 2026

La route contrôle désormais l'erreur retournée par `auth.admin.deleteUser` et
l'identifiant de l'utilisateur confirmé supprimé. Échec réseau, erreur du service
ou réponse incomplète : HTTP 503, jamais de faux succès. Une erreur Prisma avant
cette étape est également signalée sans supprimer l'identité.

Si le profil a déjà été supprimé lors d'une tentative précédente, l'utilisateur
encore authentifié peut réessayer : nettoyage des photos puis suppression de sa
propre identité, sans refaire une suppression Prisma impossible. Aucune identité
fournie par le client n'est acceptée ; la cible provient de `getCurrentUser()`.
Cela ne résout pas la concurrence avec une recréation de profil, ni le retour
après une réponse perdue alors que l'identité a réellement été supprimée.

Tests simulés étendus : erreur Auth retournée/levée, réponse sans utilisateur,
mauvais identifiant, erreur Prisma, reprise sans profil et refus non authentifié.
Les tests photos et interface RGPD passent également. Aucun effacement réel ni
validation de bout en bout en production. Référence :
https://supabase.com/docs/reference/javascript/auth-admin-deleteuser

## Critères bloquants (non validés à ce jour)

1. Connexion réelle et persistante, récupération, déconnexion et suppression
   de compte dans l'app. Examiner l'option Apple pour le parcours utilisant Google.
2. Décision du parcours commercial iOS puis achats, restauration, droits serveur,
   expiration et annulation testés en environnement Apple de test. Le pilote
   bloque encore les achats : ne pas simplement enlever cette protection.
3. Séance complète et RepCount : vidéos, séries, sauvegarde, reprise après
   interruption et réseau dégradé, sans perte ni doublon. Partage testé réellement.
4. Expérience iPhone aboutie, pas seulement une enveloppe web : navigation,
   accessibilité, clavier, petits écrans, permissions et états d'erreur.
5. Audit confidentialité web + natif, consentements, politique, déclarations
   App Privacy et manifestes cohérents avec les collectes réelles.
6. Compte développeur et droits vérifiés, identifiant, signature et archive
   Release, tests sur appareil et TestFlight, absence de plantages bloquants.
7. Fiche App Store : captures réelles, description exacte, classement d'âge,
   assistance, compte de revue fonctionnel et notes pour l'équipe Apple.

## Vérification Release et signature — 16 septembre 2026

- Compilation Release avec le SDK iPhoneOS réussie, architecture arm64.
- Une archive locale a été créée : `/tmp/COAI-readiness-20260916.xcarchive`.
  `codesign --verify --deep --strict` réussit. Le manifeste est inclus.
- Signature **Apple Development**, `get-task-allow = true` : il s'agit d'une
  archive de développement, pas d'une preuve de distribution App Store.
- L'iPhone physique connu de Xcode est hors ligne. Aucun test sur appareil,
  export App Store, transfert TestFlight ni soumission Apple effectué.
- Nouveau contrôle reproductible : `bash scripts/check-ios.sh --device-release`.
  Il compile sans signature, vérifie iPhoneOS/arm64 et le manifeste embarqué ;
  il ne contacte pas le portail pour créer des profils et ne publie rien.

## Manifeste technique

`PrivacyInfo.xcprivacy` déclare l'usage UserDefaults du minuteur (cinq clés
AppStorage propres à l'app), motif CA92.1. Il est intégré aux ressources Xcode.
Le script de compilation vérifie sa présence et son contenu dans le bundle.
Ce manifeste partiel ne déclare pas « aucune donnée collectée » : les données
du compte et du site embarqué doivent encore être auditées avant soumission.

## Préparation StoreKit — non activée

`ApplePurchaseService.swift` prépare le chargement des produits, l'achat explicite,
la restauration explicite, les transactions en attente de livraison et l'écoute
des renouvellements. Il n'est pas instancié par l'app : les achats restent gelés.
Aucun identifiant produit, prix, secret Apple ou abonnement n'a été inventé.

Le service n'accepte que les abonnements autorenouvelables du catalogue fourni,
vérifiés par StoreKit et liés au jeton du compte courant. Le JWS signé est remis
à un adaptateur serveur qui reste à implémenter. `finish()` n'est appelé qu'après
confirmation persistée correspondant à la transaction ET au compte. Le serveur
doit gérer aussi expiration/remboursement : le nombre de transactions restaurées
ne constitue pas un statut d'accès actif. Aucune donnée privée ne doit être loguée.

Raccordements obligatoires avant activation :

1. Adhésion Apple Developer à effectuer par Anthony, puis confirmer les produits
   et tarifs dans App Store Connect. Aucun achat d'adhésion ni contrat accepté
   par l'agent. Catalogue non vérifié.
2. Adapter le stockage serveur : `Subscription.stripeCustomerId` est actuellement
   obligatoire et un seul abonnement existe par utilisateur. Ne pas fabriquer
   un identifiant Stripe pour Apple. Préparer une migration séparée, à autoriser
   avant exécution en production, sans régression des abonnements Stripe.
3. Vérifier les JWS côté serveur avec les certificats Apple, bundle, environnement,
   produit et compte ; unicité de transaction et originalTransactionId, idempotence,
   expiration/révocation et notifications serveur. Aucune confiance dans un plan
   envoyé par le client. Un jeton de compte stable provient du serveur authentifié.
4. Interface de prix et conditions Apple, achats/restauration avec messages utiles,
   réconciliation au lancement et arrêt à la déconnexion. Ne pas proposer un
   second abonnement sans traiter les droits existants.
5. Tests StoreKit locaux puis sandbox Apple : annulation, attente, succès,
   réponse serveur perdue, reprise, compte différent, restauration, renouvellement,
   expiration et remboursement. Pas de vraie transaction pour les tests.

Preuves actuelles : compilation Release iPhone réussie et 22 tests XCTest (dont
confirmation de livraison persistée et liée au bon compte). La séquence commune
au service est testée : confirmation avant finalisation, erreur réseau,
confirmation incorrecte et interruption pendant la livraison. Le contrôle
`check-ios.sh` exécute désormais ces tests systématiquement. Sans catalogue,
la restauration est refusée avant de demander une connexion Apple.
Les tests unitaires
ne simulent pas une transaction Apple, et aucun paiement n'a été effectué.

## Reprise après erreur de connexion — 16 septembre 2026

Le bouton Réessayer utilisait parfois le dernier lien demandé, y compris le
retour Google contenant un code à usage unique. La reprise exclut désormais
les routes auth/API, les paramètres de jeton/code et les fragments. Une page
de séance ordinaire conserve son numéro ; sans page sûre, retour à la connexion.
Deux tests couvrent les liens sensibles, les variantes encodées, les liens
externes et la conservation d'une fiche séance. Vérification locale seulement :
le parcours Google interrompu sur iPhone physique reste à valider.

## Erreurs HTTP — 16 septembre 2026

Le navigateur natif traite maintenant les réponses principales HTTP 4xx/5xx
avant affichage : reconnexion pour 401, droits pour 403, page absente pour
404/410, attente pour 429, incident temporaire pour 5xx. Il ne remplace pas la
page pour un échec de média ou d'iframe et ne relance pas automatiquement une
requête. Les succès et redirections restent autorisés. Le panneau possède
un titre accessible ; son icône ne prétend plus que toute erreur est réseau.
Deux tests supplémentaires vérifient les statuts et messages. Compilation
simulateur et iPhone effectuée, mais déclenchement contrôlé des réponses dans
la version de production et validation sur appareil physique encore à faire.

Références d'intégration :
- https://developer.apple.com/documentation/storekit/transaction
- https://developer.apple.com/documentation/storekit/transaction/finish()
- https://developer.apple.com/documentation/storekit/appstore/sync()

Sources Apple vérifiées le 16 septembre 2026 :
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitypereasons

Ne pas acheter une adhésion, accepter un contrat, changer les tarifs, effectuer
un paiement réel ni publier la version de test comme prête. Tout point non
testé reste ouvert ; compilation réussie ne signifie pas validation production.
# Navigation cinq rubriques — 17 septembre 2026

Ordre validé par Anthony : Séance, Nutrition, Récupération, Coach, Explorer.
RepCount et compte restent dans Explorer ; minuteur disponible dans Explorer
et dans la barre supérieure. La sélection distingue recettes, récupération et
entraînement, sans présenter toute URL `/programme` comme une séance.

Vérifications : deux tests UI réussis sur le simulateur iPhone SE dédié,
alignement et cibles >= 44 points, sélection sur changements d’URL fictifs,
accès au minuteur via Explorer, accès aux réglages et garde des achats.
Capture inspectée : `/tmp/coai-five-tabs-active.png` (contenu fictif).
Contrôles Swift/core, TypeScript, lint, build web avec base factice, audit médias
et build iPhone signé réussis. Logs `/tmp/coai-navigation-five-tabs.log` et
`/tmp/coai-five-tabs-device.log`.

Ces tests ne valident pas les contenus connectés ni une réponse IA réelle.
Aucun appel IA payant réalisé. Publication App Store non effectuée.
