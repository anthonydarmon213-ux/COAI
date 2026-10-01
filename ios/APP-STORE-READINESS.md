# Priorité COAI : prêt à soumettre à l'App Store

## État courant — 1er octobre 2026

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
| 1. Installation et ouverture | En cours | Binaire actuel signé installé puis lancé sur iPhone 17 Pro après déverrouillage ; processus présent une minute après. Contenu de l'écran et parcours connecté non vérifiés. Archive de distribution et TestFlight non validés. |
| 2. Compte et connexion | En cours | Connexion publique, annulation Google, retour de récupération et saisie d'inscription contrôlés dans l'app simulée. Connexion persistante réelle, confirmation/récupération email et option Apple encore à valider/compléter. |
| 3. Diagnostic et score COAI | Validé partiellement en local | Nouveau compte, email de confirmation, diagnostic, reprise, contrôle des réponses sauvegardées et raccourci d'enregistrement testés dans l'app simulée le 28 septembre. Validation physique et production restantes. |
| 4. Programme personnalisé | Restant : validation iOS | Bibliothèque prioritaire, pas d'appel IA payant automatique. Vérifier sélection, profils exclus, sauvegarde et absence de doublon sur compte de test. |
| 5. Entraînement, nutrition, récupération | En cours | Routes existantes et minuteur natif. Vérifier droits, médias, fiches et navigation sur petits écrans avec données réelles de test. |
| 6. Séances, performances et progrès | Validé partiellement en local | Séance terminée et retour d’effort sauvegardés ; mesures et photo après relance vérifiées avec compte fictif connecté, contrôle PostgreSQL et fichier Storage réel local. Export du compte enregistré dans Fichiers le 1er octobre, JSON contrôlé. Cela ne valide pas tous les parcours RepCount ni l’ensemble en production et sur appareil physique. |
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
