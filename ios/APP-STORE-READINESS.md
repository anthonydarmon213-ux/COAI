# Priorité COAI : prêt à soumettre à l'App Store

## État courant — 27 septembre 2026

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

## Checklist globale persistante — 17 septembre 2026

« Testé localement » ne signifie ni testé en production ni prêt à publier.
Aucun des dix parcours n'est encore déclaré terminé de bout en bout sur iPhone.
L'app actuelle combine SwiftUI et des écrans web WKWebView ; elle ne constitue
pas encore une expérience native complète validée.

| Parcours | État réel | Preuve / travail restant avant validation |
| --- | --- | --- |
| 1. Installation et ouverture | En cours | Binaire actuel signé installé puis lancé sur iPhone 17 Pro après déverrouillage ; processus présent une minute après. Contenu de l'écran et parcours connecté non vérifiés. Archive de distribution et TestFlight non validés. |
| 2. Compte et connexion | En cours | Connexion publique, annulation Google, retour de récupération et saisie d'inscription contrôlés dans l'app simulée. Connexion persistante réelle, confirmation/récupération email et option Apple encore à valider/compléter. |
| 3. Diagnostic et score COAI | Restant : validation iOS | Écrans web existants ; tester nouveau compte, questionnaire complet, calcul, sauvegarde et reprise interrompue dans l'app. |
| 4. Programme personnalisé | Restant : validation iOS | Bibliothèque prioritaire, pas d'appel IA payant automatique. Vérifier sélection, profils exclus, sauvegarde et absence de doublon sur compte de test. |
| 5. Entraînement, nutrition, récupération | En cours | Routes existantes et minuteur natif. Vérifier droits, médias, fiches et navigation sur petits écrans avec données réelles de test. |
| 6. Séances, performances et progrès | En cours | Correctifs RepCount couverts par tests locaux. Partage natif PNG/PDF vérifié avec fichiers fictifs dans le simulateur ; vraie fiche connectée, séance complète, historique et appareil physique restent à vérifier. |
| 7. Check-ins, adaptations et mémoire | Restant : validation iOS | Moteur et routes existants. Vérifier persistance, isolation des comptes, confirmations, cohérence des adaptations et absence d'appel payant. |
| 8. Abonnements Apple | En cours + intervention humaine | Service StoreKit préparé mais non raccordé. Catalogue, droits serveur, achat, essai, restauration, expiration et résiliation restent à réaliser et tester. Tarifs/migration à valider. |
| 9. Notifications et réengagement | En cours | Concurrence, refus de permission et réception visible en arrière-plan testés sur simulateur. Appareil physique, écran verrouillé et réengagement consenti restent à vérifier/implémenter. |
| 10. Suppression sécurisée | En cours | Résiliation Stripe, erreurs Auth/Storage et reprise après profil supprimé couvertes par tests avec doublures. Restent concurrence, révocation de sessions et test intégral sur compte jetable autorisé. |

Terminé et testé **au niveau technique local seulement** : règles de navigation,
horloge/pause persistante, séquencement des livraisons d'achats et des alertes
(24 XCTest), compilation simulateur et Release iPhone sans signature.

Blocages humains identifiés : adhésion Apple Developer (coût non autorisé),
contrats/validation Apple, catalogue et conditions commerciales iOS, autorisation
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
