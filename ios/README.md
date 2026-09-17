# COAI — pilote iPhone connecté (préparation technique)

**Compilé et lancé sur simulateur iPhone ; pas encore testé sur iPhone physique,
ni prêt pour TestFlight/App Store.**
Le projet remplace la manipulation manuelle décrite dans `ios-prototype/README.md`.
Le prototype historique reste conservé mais n'est pas inclus dans la cible iOS.

## Périmètre de ce premier lot

- Projet Xcode `COAI.xcodeproj`, schéma partagé COAI, cible iPhone iOS 16+.
- SwiftUI natif : navigation, menu, confirmations et minuteur de repos persistant.
- WKWebView : réutilisation du parcours COAI existant, sans copie des programmes
  ni nouvelle génération IA. Séance `/programme/entrainement`, RepCount
  `/suivi/repcount`, compte/suppression `/compte/parametres`.
- Le site garde son authentification et ses contrôles d'accès : aucune validation
  coach contournée, aucun abonnement attribué par le client mobile.
- Cookies propres à l'app conservés entre ouvertures ; effacement local proposé
  avec confirmation, distinct de la suppression du compte sur le serveur.
- Lecture vidéo inline configurée, démarrage par action utilisateur. Lecture,
  plein écran, reprise et verrouillage à vérifier sur l'appareil réel.
- Durées de repos en minutes et secondes, échéance conservée sur cet appareil.
  Alerte locale facultative après permission explicite, pas de prescription de repos.
- Gestion de l'échec réseau et bouton de nouvelle tentative sans rejeu de POST.
- Liens extérieurs soumis à confirmation. Pas de pont JavaScript natif, secret
  embarqué, dérogation TLS/ATS ou accès automatique aux capteurs.
- Téléchargements COAI PDF/PNG/JPEG (15 Mio maximum) vers la feuille de partage
  native, avec annulation et nettoyage temporaire. Vérifiés sur fichiers fictifs
  dans le simulateur ; vraies fiches connectées et iPhone physique à vérifier.
- « Enregistrer l'image » demande uniquement l'ajout à Photos. Acceptation et
  refus testés sur image fictive ; fichier enregistré comparé à sa source.

**L'interface principale reste web dans ce pilote**, pas une réécriture native
des séances. Ce lot sert à vérifier l'intégration et les limites WebKit avant
de fixer le périmètre final App Store. Le minuteur ne suffit pas à démontrer
à lui seul la conformité à la règle Apple 4.2.

## Achats : gel du pilote, pas un mécanisme de contournement

Les navigations vers `/pricing`, `/compte/abonnement`, `/checkout`,
`/api/stripe` et Stripe sont bloquées. Des règles WKContentRuleList bloquent
aussi les requêtes de ressources/XHR Stripe connues. Le site n'est jamais
chargé si ces règles ne peuvent pas être installées.

Ce gel temporaire ne prouve pas une conformité App Store ni l'absence de tout
autre chemin de facturation futur. Les liens d'achat peuvent encore être visibles
dans les pages web : il faut auditer le parcours réel avant distribution.
Ne pas publier ce pilote comme une app dont les achats seraient fonctionnels.
Ne pas présenter les paiements numériques Stripe du site comme automatiquement
acceptés par Apple. Séparer le contenu numérique des séances individuelles avec
coach, puis faire valider le modèle et les territoires par Anthony avant
développement StoreKit / droits serveur / restauration d'achats.

## Ouvrir / compiler

1. Installer Xcode gratuit depuis le Mac App Store, l'ouvrir et terminer sa
   configuration (licence et composants iOS). Cela ne requiert pas l'adhésion
   payante Apple pour un simulateur.
2. Ouvrir `ios/COAI.xcodeproj`, sélectionner COAI et un simulateur iPhone.
3. Run. Pour un appareil, choisir son équipe dans Signing & Capabilities.
4. `fr.coai.mobile` est un identifiant proposé, **non réservé**. Ne pas saisir
   une équipe ou un certificat appartenant à quelqu'un d'autre.

Tests disponibles depuis la racine :

```sh
bash scripts/check-ios.sh
bash scripts/check-ios.sh --simulator
bash scripts/check-ios.sh --device-release # vrai SDK iPhone, Release non signé
swift test --package-path ios  # nécessite XCTest fourni avec Xcode
```

Le premier script vérifie la logique Foundation, la syntaxe Swift, les fichiers
de projet et la compilation réelle des règles par WebKit macOS, sans charger
d'URL. Ce dernier contrôle détecte les expressions que NSRegularExpression
accepte mais que WebKit refuse (notamment les alternatives `|`). Il ne teste
**pas le rendu iOS ni l'efficacité réseau des règles dans l'app**. `--simulator`
échoue explicitement si Xcode complet manque. Le projet n'ajoute aucune dépendance
payante et ne contient pas de SDK publicitaire natif.

## Retour Google — correctif du 12 septembre 2026

Le pilote intercepte uniquement la navigation Google PKCE S256 initiée par la
page principale COAI vers son projet Supabase. `ASWebAuthenticationSession`
remplace l'ouverture générique de Safari. Le retour attendu est exactement
`fr.coai.mobile://auth/callback` : ajouter cette URL à la liste des redirections
Supabase, sans wildcard ni remplacement des URL web. Anthony a autorisé cette
configuration le 12 septembre ; elle a été enregistrée et relue dans le tableau
de bord : trois URL autorisées, les deux URL web et Site URL inchangées.

Le code à usage unique revient dans le WKWebView d'origine vers `/auth/callback`.
Le vérificateur PKCE reste dans ses cookies ; aucun jeton de session n'est lu,
copié depuis Safari ou injecté par Swift. La route web existante échange le code
et vérifie l'utilisateur. Annulation ou retour invalide réouvre la connexion ;
une réponse d'une tentative annulée est ignorée. Ce mécanisme ne traite pas
encore les liens email ni Sign in with Apple. Un changement de projet Supabase
demande une mise à jour de l'hôte explicitement autorisé dans le pilote.

Tests Foundation : URL Google valide, destination conservée, hôte usurpé,
absence de PKCE, paramètres dupliqués, erreur, fragment/token et mauvais schéma
rejetés. Compilation simulateur réussie. L'aller-retour réel Google, annulation
dans l'interface et session après relance restent à vérifier avant distribution.

## Tests manuels bloquants avant TestFlight

Diagnostic du 12 septembre : les logs Auth confirment `OAuth state has expired`
à 08:42:16 Paris, après un départ à 08:31:54. Le callback natif était bien stocké,
mais aucun code n'a été émis. Un garde-fou local de 9 minutes annule désormais
la fenêtre système et réouvre la connexion avec une explication, sans relancer
Google automatiquement. Le callback vérifie aussi l'échéance après suspension.
Chaque tentative possède son identifiant ; annulation/réussite annule le délai
et les réponses tardives sont ignorées. Aucune durée serveur ni protection PKCE
n'est modifiée. Tests unitaires de borne, reprise tardive et isolation ajoutés.
L'expiration réelle dans l'UI et une connexion Google réussie restent à vérifier.

- Compte de test expressément autorisé : connexion email/mot de passe, relance
  à froid, déconnexion, sessions expirées. Aucun vrai paiement pour tester.
- OAuth Google : mécanisme système et callback PKCE implémentés ; succès réel,
  annulation, expiration et relance à vérifier. Apple et liens email restent
  à implémenter/tester ; aucun retour universel configuré dans ce lot.
- Séance : bon utilisateur, programme autorisé, médias exacts, vidéo jouable,
  PDF/partage/téléchargement et formulaires clavier. Téléchargements natifs ajoutés,
  mais impression `window.print()` non raccordée et vrais exports non validés.
- RepCount : enregistrement unique et relecture serveur, pas seulement affichage.
- Suppression compte : annuler puis confirmer sur un compte jetable, vérifier
  serveur et déconnexion ; ne jamais tester en supprimant un client réel.
- Connexion lente/perdue, redirections et liens `_blank`, lectures vidéo externes.
- Achats : navigation, XHR, lien direct, formulaires, redirections, tous les plans.
- Minuteur : fermer la feuille, mettre l'app en arrière-plan, relancer, expiration.
- Petit écran, paysage, clavier, grandes polices, VoiceOver, gestes retour.

## Ce qui manque à une soumission Apple

- Tests interactifs simulateur/appareil et corrections issues de ces tests.
- Validation visuelle de l'icône App Store 1024 et captures d'écran réelles de
  l'app. L'icône et son catalogue d'assets sont déjà présents dans le projet.
- Audit des données réellement collectées via les pages web, manifestes de
  confidentialité (dont UserDefaults), déclarations App Privacy, tracking/ATT
  si applicable. Aucune déclaration « aucune donnée collectée » ne doit être faite.
- Parcours permissions photo/caméra/micro si conservé : descriptions préparées
  dans Info.plist, mais refus/acceptation et absence de demande au lancement à tester.
- Décision paiements numériques/StoreKit, restauration, reçus et droits serveur.
- Périmètre final apportant une vraie expérience iPhone, pas uniquement un site.
- Compte Apple individuel d'Anthony, bundle enregistré, signature, archive,
  fiche App Store, compte de démonstration pour Apple, TestFlight puis revue.

## Contrôles du 16 septembre 2026

- Compilation simulateur réussie, 40 contrôles Foundation et 7 tests XCTest
  réussis ; ces tests ne valident pas le parcours connecté complet.
- Sur iPhone 17 simulé (iOS 26.5), l'annulation du dialogue système Google
  revient au formulaire sans fenêtre « Compris » supplémentaire. Les erreurs
  autres qu'une annulation conservent leur message. Succès OAuth non testé.
- La réinitialisation locale annonce désormais explicitement la perte des
  séances et séries non synchronisées. Son intitulé ne la présente plus comme
  une simple déconnexion. Alerte native avec « Annuler » visible, vérifiée puis
  annulée dans le simulateur ; aucun effacement utilisateur effectué.
- Cette amélioration avertit du risque, elle ne synchronise pas les brouillons
  et ne remplace pas un parcours de déconnexion distinct.
- Aucun achat, coût supplémentaire ou envoi App Store. Les corrections natives
  restent à vérifier sur appareil et dans la version distribuée ; elles ne sont
  pas déclarées terminées en production.

## État historique vérifié le 11 septembre 2026

- Xcode 26.6 (17F113) installé et initialisé ; licence acceptée par l'utilisateur.
- 38 contrôles Foundation réussis et 5 tests XCTest réussis via `swift test`.
- Compilation des règles par le vrai moteur WebKit macOS réussie après correction
  d'une alternative regex non prise en charge. Aucun chargement réseau dans ce test.
- Vérification des types des cinq sources Swift avec le SDK iPhone Simulator 26.5
  réussie (`swiftc -typecheck`, cible arm64 iOS 16).
- Compilation Next.js, TypeScript, lint et audit des médias réussis ; avertissements
  préexistants img/OTel/Edge, sans erreur bloquante.
- Runtime iOS 26.5 (23F77) arm64 installé (8,52 Go). La commande
  `bash scripts/check-ios.sh --simulator` termine avec `BUILD SUCCEEDED`.
- Binaire `ios/DerivedData/Build/Products/Debug-iphonesimulator/COAI.app` installé
  et lancé avec `simctl` sur iPhone 17 Pro, identifiant
  `2F58C22F-970F-4E9E-AD75-ABEE1D53A158`. Démarrage de `fr.coai.mobile` réussi.
- Capture réelle du simulateur inspectée : page de connexion COAI chargée,
  barre native Séance / RepCount / Repos / Compte visible, pas d'erreur affichée.
  Preuve locale : `/tmp/coai-ios-first-launch-20260911.png` (fichier temporaire).
- Les interactions, le parcours connecté, les vidéos et le minuteur dans l'UI
  restent à tester : contrôle de l'interface bloqué par le verrouillage du Mac.
  Aucun compte réel utilisé, achat, installation physique ou envoi Apple effectué.

Références :
- https://developer.apple.com/documentation/webkit/wkwebview/
- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/programs/enroll/

## Test d'interface reproductible — 17 septembre 2026

Le scénario `testFileDownloadOpensNativeShareAndKeepsPage` lance une page locale
fictive avec `-COAIDownloadFixture` (compilation Debug uniquement). Il vérifie
PNG, PDF et lien `blob:` sans attribut de téléchargement dans la vraie feuille
iOS, ferme celle-ci sans choisir de destinataire, puis vérifie le refus HTML.
Il ne remplace aucun compte et n'appelle aucun service distant. La fixture est
absente du binaire Release. Dernière régression : 6 tests UI sans échec sur
iPhone SE / iOS 26.5, saisie d'inscription exclue de cette passe ; 24 tests Swift.
Les résultats et limites sont détaillés dans `APP-STORE-READINESS.md`.

Deux autres scénarios vérifient la sauvegarde Photos et son refus. Ils remettent
à zéro uniquement la permission Photos de COAI dans le simulateur de test,
et sauvegardent seulement le PNG fictif. Ne pas les lancer sur un appareil
personnel ni sur le simulateur réservé à la connexion manuelle d'Anthony.
Régression du 17 septembre : **8 scénarios sans échec**, saisie d'inscription
exclue de cette passe ; aucun compte connecté ni paiement.

La saisie d'inscription dispose aussi d'un scénario autonome :
`testSignupFieldsAndPasswordVisibilityWithKeyboard`. Il entre uniquement des
valeurs fictives et ne soumet jamais le formulaire. Il vérifie les trois champs,
le clavier, l'affichage/masquage du mot de passe et le bouton accessible.
Réussi sur iPhone 17 / iOS 26.5, avec capture inspectée. Le parcours authentifié
demande une connexion explicite dans le simulateur, distincte du navigateur Mac.
Les six scénarios sont également passés sur iPhone SE (3e génération) / iOS 26.5.
La saisie a entraîné de longues attentes d'animation XCUITest sur ce simulateur :
ne pas interpréter ce succès fonctionnel comme une validation des performances.

Le schéma COAI contient désormais la cible `COAIUITests`. Le test ouvre la vraie
app, utilise Repos, démarre deux minutes, met en pause, ferme/réouvre la fiche,
termine puis relance le processus, reprend et arrête. Il n'achète rien et ne
modifie aucun compte ; seules les préférences locales du minuteur sont modifiées.
La page web de lancement utilise le site configuré normalement, sans compte de
test injecté. Ce test ne prouve pas le fonctionnement du parcours connecté.

Exécution (remplacer l'identifiant par un simulateur retourné par `simctl`).
La réception et le refus d'alerte demandent des appareils QA distincts ; ne pas
lancer tous les tests sans sélectionner leurs prérequis. Le contrôle de
confidentialité web attend son déploiement.
Le scénario `testUnavailableNetworkKeepsRecoveryControlsAccessible` exige une
destination COAI inaccessible : l'exécuter séparément lors d'un test de panne
réseau sur QA, jamais comme une vérification normale du site disponible.
Il ne simule pas l'erreur : il contrôle l'échec WebKit réel, l'accès à Repos et
le redémarrage du chargement. Il ne valide pas le retour effectif du réseau.

```sh
xcrun simctl list devices available
xcodebuild -project ios/COAI.xcodeproj -scheme COAI -configuration Debug \
  -destination 'platform=iOS Simulator,id=IDENTIFIANT_DU_SIMULATEUR' \
  -derivedDataPath ios/DerivedDataUITests \
  -only-testing:COAIUITests/COAIUITests/testRestNotificationDeliveredInBackground \
  CODE_SIGNING_ALLOWED=NO test
```

Réception d'alerte (17 septembre) : test ci-dessus réussi seul sur le simulateur
QA alertes iPhone SE / iOS 26.5, permission vierge ou acceptée. Il démarre
30 secondes, revient à l'accueil iOS, vérifie titre visible et corps de la
notification puis capture `XCUIScreen.main` (la capture de l'app Springboard
seule peut omettre la bannière). Image inspectée : logo et message COAI présents.
Preuve : `/tmp/coai-rest-delivery-visible.xcresult`. Fixture web Debug hors réseau,
service d'alerte réel. Appareil physique, verrouillage, Concentration et arrêt
forcé restent non vérifiés. Ne pas utiliser le simulateur de connexion personnelle.

`testJSONFileSavePicker` enregistre désormais réellement le JSON fictif sous un
nom unique `COAI-QA-<UUID>` dans Fichiers, puis vérifie le retour à COAI.
Il attend le champ `DOCPicker.filenameTextField` : sur iOS 26.5 le sélecteur peut
afficher Retour et non Annuler. Le précédent échec d'attente d'Annuler ne prouvait
donc pas une panne de présentation. Capture écran complet conservée avant contrôle.
Réussi : `/tmp/coai-files-save-confirm.xcresult`. Relecture indépendante du fichier
dans le fournisseur local : 26 octets identiques à la fixture. Le test laisse
ce petit fichier fictif sur le simulateur QA ; ne pas le lancer sur un appareil
personnel ou une destination iCloud. L'export d'un vrai compte reste à vérifier.

Résultat du 17 septembre : 5 tests d'interface réussis sur iPhone 17 / iOS 26.5.
Le scénario de notifications nécessite un simulateur avec permission vierge
ou refusée et commutateur désactivé. Il refuse la demande si elle apparaît,
vérifie le message et le lien Réglages puis utilise le minuteur sans notification.
Le retour au premier plan effaçait ce message : les erreurs de permission sont
maintenant indépendantes des messages de programmation. Ce test ne couvre pas
la réception effective d'une alerte.
Deux tests supplémentaires couvrent l'annulation de la demande système Google
et la navigation récupération → retour natif → inscription. Ce dernier a révélé
une flèche retour désactivée lors des navigations sans rechargement : corrigée
par observation de l'historique WebKit, puis test repassé avec succès.
Le second charge la connexion publique réelle, ouvre le clavier (y compris la
fermeture du conseil iOS de premier usage), attend ses touches et vérifie que
la barre Repos disparaît tandis que le champ reste accessible. Aucun identifiant
saisi ni formulaire envoyé. Capture du minuteur inspectée ; captures de connexion
conservées dans le résultat de test. En complément : 22 tests unitaires Swift.
Restent les alertes système, les autres écrans, l'accessibilité étendue et
l'appareil physique. Les anciens blocages de contrôle UI ci-dessus sont un
historique, pas la situation de ce test XCUITest.
