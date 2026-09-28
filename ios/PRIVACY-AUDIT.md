# Inventaire de confidentialité iOS — brouillon technique

Audit du code actualisé le 28 septembre 2026. Ce document prépare la déclaration App
Store Connect ; il ne constitue ni une déclaration soumise, ni une validation
juridique, ni la preuve de la configuration des services de production.
Les écrans web intégrés à WKWebView font partie du périmètre de l'app.

## Contrôle natif du 27 septembre

Recontrôle à 23 h 20 : 51 XCTest, 65 contrôles cœur, compilation des règles
WebKit et Release iPhone arm64 non signée réussis. Manifeste comparé dans le
bundle, marqueurs locaux et ressources StoreKit de test absents selon le
script. Deux tests UI SE grand texte/rotation réussis avec captures examinées
(`Test-COAI-2026.09.27_23-19-12-+0200.xcresult`). Ces tests emploient du contenu
fictif, pas un abonnement Apple réel. Pas de signature de distribution.

Les cinq clés AppStorage du minuteur et le reset UserDefaults concernent les
préférences internes COAI. Le motif CA92.1 du manifeste correspond à cet usage,
selon la documentation Apple consultée le 27 septembre :
https://developer.apple.com/documentation/bundleresources/app-privacy-configuration/nsprivacyaccessedapitypes/nsprivacyaccessedapitype

`scripts/test-ios-privacy-config.cjs`, intégré à `check-ios.sh`, vérifie ce motif,
la présence de textes de permissions non vides et l'absence d'exception ATS.
Cinq cas négatifs doivent être refusés : manifeste absent, catégorie absente,
motif modifié, texte Photos vide et connexion arbitraire autorisée. Ce contrôle
est volontairement limité : ni inventaire exhaustif des API, ni mesure des flux
réseau, ni déclaration App Privacy, ni approbation Apple.

## Données et preuves dans le dépôt

### Préparation des images — contrôle du 28 septembre, local

`compressProgressPhoto` redessine l'image dans un canvas avant envoi. Correction
du repli d'encodage : si le navigateur produit du PNG au lieu du WebP demandé,
le type MIME et l'extension suivent désormais les octets réellement produits.
Le nom de fichier d'origine n'est plus transmis par cette fonction. Images
vides, dimensions invalides et sorties vides sont refusées avec un message.

Tests : `node scripts/test-photo-compression.cjs` exerce la vraie fonction avec
encodeurs simulés (WebP/PNG/JPEG, bornes, erreurs, libération des URL).
`node scripts/test-photo-compression-webkit.cjs` exécute la fonction transpilée
dans un WKWebView macOS réel, sans connexion réseau, sur un PNG synthétique
contenant une métadonnée témoin. Décodage, dimensions, absence de cette
métadonnée, repli PNG forcé et pixels du PNG de sortie vérifiés.

Limites : pas de photo personnelle utilisée, pas d'EXIF GPS réel testé, pas de
preuve exhaustive pour HEIC/orientations/profils couleur. Cela ne prouve pas la
sanitisation des requêtes directes aux API, qui ne passent pas forcément par
cette fonction, ni des anciens objets déjà stockés. Aucun déploiement ; test
du parcours d'import iPhone et contrôle en production encore requis.

| Périmètre | Données prévues par le code | Source / point à vérifier |
| --- | --- | --- |
| Compte | Nom, email, identifiant Auth et compte, coordonnées facultatives | `prisma/schema.prisma`, `src/lib/auth/server.ts` ; finalités et durées à confirmer dans les parcours réels |
| Coaching | Profil, objectifs, mesures, antécédents, sommeil, stress, check-ins et séances | Modèles Profile, SeanceLog, Mesure, WeeklyCheckin ; données liées au compte, certaines sensibles. L'existence d'un champ ne prouve pas sa collecte effective chez chaque membre |
| Photos | Avatar et images de suivi | `src/lib/storage/progress-photos.ts` ; bucket exact `progress photos`, contrôle du préfixe propriétaire, URL signée 1 h. Vérifier en production caractère privé, règles d'accès et traitement des métadonnées des images |
| Abonnements | Identifiants et état d'abonnement Stripe ; jeton de compte et instantanés de transactions Apple | Modèles Subscription, ApplePurchaseAccount et AppleTransaction. Raccordement Apple présent dans le code, activation distante et Sandbox réel non validés. Pas de données bancaires dans ces modèles |
| Fonctionnement natif | Durée, pause et échéance du repos conservées localement ; rappel hebdomadaire facultatif | RestTimerView et PrivacyInfo.xcprivacy ; UserDefaults déclaré. Notifications locales génériques, horaire hebdomadaire relu depuis les demandes iOS |
| Export de séance | PDF/PNG/JPEG temporaires choisis par l'utilisateur | COAIDownload et DownloadPolicy ; dossier local protégé, nettoyage, feuille de partage explicite. Test actuel : fichiers fictifs, pas séance réelle connectée |
| Mesure facultative | Google Analytics, Meta, Vercel Analytics ; attribution UTM | Désactivés pour le pilote marqué COAIiOS ; règles WebKit complémentaires. Safari garde ses choix. Vérification réseau complète restant à faire |
| Diagnostic technique | Erreurs conditionnées par le DSN Sentry | Filtre commun `src/lib/analytics/error-privacy.ts` ajouté : valeurs libres et pièces jointes retirées, liste explicite de champs techniques. Traces de performance désactivées pendant l'audit. Transport mémoire du vrai SDK testé ; déploiement et flux réels restent non vérifiés |
| Événements internes | Nom d'événement, identifiant utilisateur ; indicateur first et valeurs autorisées pilier/source | `src/lib/analytics/product-events.ts` utilise une liste fermée de métadonnées : pas de texte libre, santé ou dates. L'identifiant reste journalisé : ce n'est pas anonyme. Conservation et flux de production restent à vérifier |

Ne pas déclarer « aucune donnée collectée ». Ne pas confondre absence de SDK
HealthKit natif et absence de données de santé saisies dans les écrans web.
Les déclarations caméra/micro/Photos de l'Info.plist ne prouvent pas à elles
seules que chaque usage est testé, nécessaire ou effectivement déclenché.

## Destinataires supplémentaires identifiés dans le code — 27 septembre

- Anthropic : `src/lib/ai/client.ts` transmet les prompts et, pour les appels
  vision, l'image encodée. Le coach web construit un contexte à partir du profil,
  de la question et de la mémoire de progression ; le coach WhatsApp inclut aussi
  contraintes et antécédents lorsqu'ils existent. Ce ne sont pas des données
  anonymes par simple absence d'email. Configuration, consentement et rétention
  distants non vérifiés ; aucun appel réel effectué pendant ces tests.
- Resend : `src/lib/email/client.ts` transmet destinataire, sujet, texte et HTML.
  Les notifications de diagnostic peuvent inclure coordonnées et réponses libres
  (`lead-notification.ts`). Le commentaire historique « aucune donnée de santé »
  ne prouve pas l'absence de contenu sensible dans une réponse libre.
- ntfy : ce même client transmettait sujet et texte des emails. Correction locale
  `b09a417` : alerte générique uniquement, sans coordonnées ni contenu diagnostic.
  Réponses d'erreur et exceptions des prestataires ne sont plus recopiées dans
  les logs. Tests avec transport simulé ; pas de preuve de déploiement.
- ManyChat / WhatsApp : la route entrante reçoit numéro et message et conserve
  des événements liés au compte. Elle renvoie la réponse IA au service appelant.
  Le secret d'entrée et le circuit distant réel restent à vérifier. Contrôle
  d'abonnement et quotas testés localement, sans livraison WhatsApp réelle.
- Make : `src/lib/whatsapp/client.ts` prévoit un envoi optionnel de contexte au
  webhook configuré. L'existence de ce code ne prouve pas son activation.
  Timeout de cinq secondes et absence de relance automatique déjà testés.

Ces éléments complètent l'inventaire, pas la déclaration finale App Privacy.
Les durées de conservation, régions et contrats des fournisseurs ne peuvent
pas être déduits du code et restent à confirmer par le titulaire.

## Points non clos, classés par impact

### Ajouts du 28 septembre — analyses d'images

Les cinq routes `profil/photo-morphologie`, `profil/montre`,
`programme/motion-check`, `nutrition/photo-repas` et
`nutrition/menu-restaurant` ne journalisent plus l'objet d'erreur du
prestataire. Signal technique fixe conservé ; messages utilisateur inchangés.
`scripts/test-vision-error-privacy.cjs` exécute les vraies routes transpilées :
15 cas, erreur prestataire contenant de fausses données sensibles, absence
d'écriture de profil après échec, refus sans authentification/abonnement avant
l'appel IA. Authentification, base et prestataire simulés ; aucun appel payant.
Ce contrôle ne couvre pas les journaux du SDK, de l'infrastructure ou du
prestataire, ni les autres routes IA. Non publié.

Constat initial, corrigé localement ci-dessous :
`scan-morpho-posture.tsx` et `profil-form.tsx` affichent « jamais conservée(s) »
alors que le fichier est transmis à Anthropic. La non-écriture du fichier dans
la base COAI ne prouve pas l'absence de rétention chez le prestataire. Ces
écrans déclenchent l'analyse à la sélection du fichier, sans information
explicite sur ce destinataire ni accord spécifique observé dans ce parcours.
Préparer un accord clair avant transfert, auditer aussi montre/repas/menu/
mouvement/coach et confronter les promesses de conservation à la configuration
du compte fournisseur. Ne pas conclure que la déclaration générale de
confidentialité suffit. Aucune modification des droits d'abonnement effectuée.
Référence consultée le 28 septembre : Apple, section 5.1.2(i), partage avec une
IA tierce et permission explicite :
https://developer.apple.com/app-store/review/guidelines/#data-use-and-sharing

### Accord préalable aux analyses d’images — 28 septembre, local uniquement

Les cinq outils (morphologie, montre, mouvement, repas, menu) affichent maintenant
le destinataire Anthropic, les données transmises et l’usage du résultat avant
sélection. Case décochée au départ ; import désactivé sans accord. Les sept points
d’entrée partagent ce composant. Retirer la case empêche les prochains envois ;
cela ne rappelle pas un fichier déjà transmis. Les promesses « jamais conservée »
du scan ont été retirées, aucune durée fournisseur n’étant prouvée.

Chaque route exige un acquittement versionné propre à l’outil avant lecture du
multipart/appel IA. Ce contrôle n’est ni une authentification ni une preuve
juridique durable : l’en-tête peut être fourni par un client. Droits d’abonnement
inchangés. La synchronisation JSON HealthKit reste séparée, sans appel IA.

Preuves : `test-ai-image-consent-ui.cjs` (sept entrées, état React simulé et rendu
du vrai composant), `test-vision-error-privacy.cjs` (31 cas, vraies routes
transpilées, fournisseurs/base/auth simulés), typage et build local réussis,
lint sans erreur. Navigateur connecté au build isolé, largeur 390 × 844 : trois
imports du profil bloqués au départ, activation indépendante montre/morphologie/
scan et retrait vérifiés ; aucun débordement horizontal ni erreur navigateur
détecté. Capture `/tmp/coai-consent-mobile-0928.png`. Aucun fichier envoyé.
Le compte fictif ne comporte pas de plan nutrition : les deux outils nutrition
n’ont pas été vérifiés visuellement dans ce parcours, seulement par les tests
de composants. Tests médias existants réussis.

À faire : validation native/iPhone et version publiée, chemins coach texte et
génération, politique de confidentialité complète et configuration/rétention
réelle du prestataire. Pas de conclusion de conformité App Store ou RGPD globale.

### Envois incomplets — 28 septembre, vérification locale complémentaire

Défaut reproduit : un fichier vide atteignait l’IA (502 dans le test avec
prestataire simulé) au lieu d’être refusé. Les cinq routes rejettent maintenant
les fichiers vides et les multipart illisibles avec un message JSON 400 clair,
sans appel IA ni écriture de profil. JSON HealthKit tronqué également traité.
Ce contrôle ne décode pas le contenu d’une image non vide et ne prouve pas
l’intégrité de tous les formats ni la résistance aux envois géants.

`test-vision-error-privacy.cjs` : 42 cas réussis. Nouveau
`test-vision-input-http-local.cjs` : 27 cas sur le vrai serveur compilé et les
services Auth/PostgreSQL locaux, compte/abonnement fictifs. Accord absent,
obsolète ou de mauvaise portée refusé ; envois vides/interrompus refusés,
profil intact ; mesure HealthKit structurée persistée séparément. Serveur sans
clé IA, aucune photo valide transmise. Compte, abonnement et profil fictifs
supprimés, session révoquée. Typage/lint/build et tests médias réussis.
Navigateur de connexion local sans erreur détectée après redémarrage. Aucun
déploiement ; iPhone 17 Pro indisponible lors du contrôle.

1. Vérifier les transmissions réelles des écrans connectés et les journaux
   techniques ; définir puis tester la suppression des données sensibles dans
   les erreurs et métadonnées avant déclaration définitive.
2. Suppression de compte : parcours natif connecté local vérifié le 27 septembre
   à 20 h 44 (annulation préserve l’export, confirmation puis relance déconnectée).
   Identité Auth et utilisateur PostgreSQL absents, mot de passe refusé après
   l’action UI. Test HTTP local complémentaire : 101 photos, deux anciennes
   sessions refusées, autre compte et photo préservés. Ces anciennes sessions
   reçoivent aussi 401 sur les envois avatar/photo de suivi ; un ancien lien
   signé répond « Object not found », aucun objet recréé dans le préfixe.
   Vérifications ajoutées au test HTTP réel local, pas seulement à une doublure.
   Deux suppressions simultanées ont révélé une fausse erreur 503 : corrigée et
   retestée le 27 septembre à 20 h 59 (deux succès, état final absent). L’absence
   d’identité doit être confirmée ; une panne n’est jamais assimilée à un succès.
   Restent concurrence avec d’autres écritures déjà en vol,
   abonnements réels et validation en production. Voir checklist.
3. L'export de compte (`src/app/api/compte/export/route.ts`) inclut maintenant
   20 relations : profil, abonnement Stripe, programmes, séances, mesures,
   événements WhatsApp, repas, avis, tests maxi, check-ins hebdomadaires,
   adaptations, activités quotidiennes, séances quotidiennes, récupération
   musculaire, achats de programmes, routines, analyses de mouvement et retour
   de résiliation, événements d'usage IA et compte Apple avec ses transactions.
   Ces deux derniers ajouts sont locaux et testés aussi par HTTP avec
   Auth/PostgreSQL réels isolés (25 septembre) : deux comptes, cookie/bearer,
   identifiant tiers ignoré, absence de compte Apple, réponses privées.
   Transactions fictives en base, aucun achat ni appel fournisseur.
   Téléchargement natif connecté et production restent à valider. Il ne constitue
   toujours pas un export exhaustif : fichiers binaires et données détenues
   par les fournisseurs hors périmètre. Notes privées du coach et
   prospects non liés nécessitent un circuit distinct, sans joindre les données
   d'un autre compte. La promesse publique « toutes tes données » doit être
   confrontée à ces limites avant publication. Le téléchargement natif JSON
   est testé avec un objet
   fictif et un fichier invalide (`/tmp/coai-json-export.xcresult`) ; le parcours
   connecté jusqu’à la feuille système a ensuite réussi le 27 septembre à 20 h 29
   sur simulateur SE avec compte jetable et serveur local réels
   (`Test-COAI-2026.09.27_20-29-08-+0200.xcresult`). Capture inspectée : JSON de
   5 ko et action Enregistrer dans Fichiers. Aucun destinataire contacté.
   La sauvegarde du JSON connecté dans Fichiers a ensuite réussi à 20 h 36
   (`Test-COAI-2026.09.27_20-35-44-+0200.xcresult`) : fichier de 5 136 octets
   retrouvé dans File Provider local, JSON parsé, adresse du compte jetable,
   profil et programme contrôlés. Appareil physique et production non validés.
4. Vérifier les consentements des données sensibles, les destinataires réels,
   les durées de conservation et les régions des fournisseurs. Les affirmations
   de la page confidentialité doivent correspondre à ces preuves.
5. Renseigner les réponses App Store Connect après les intégrations finales,
   vérifier sur appareil, puis soumettre à la validation du titulaire.

## Preuves et limites du lot traceurs

### Contrôle du 25 septembre

Tests `test-account-export.cjs`, `test-product-event-privacy.cjs` et
`test-error-privacy.cjs` réussis. Export : Auth/DB simulées, propriétaire imposé
par le serveur, 20 relations, seul sous-ensemble imbriqué autorisé : transactions
du compte Apple lié. Absence de compte Apple conservée à null. Erreurs privées
et sans cache ; Cookie/Authorization dans Vary. Journal produit :
vraie fonction testée, valeurs interdites exclues, identifiant toujours présent.
Sentry : vrai SDK avec transport en mémoire, aucun envoi externe. Ces preuves
ne valident ni les données distantes, ni les durées de conservation, ni toutes
les transmissions des fournisseurs. Aucun formulaire App Privacy rempli.

Les GET historiques et bilans quotidiens/hebdomadaires portent désormais
`private, no-store` et varient selon Cookie/Authorization, vérifiés en HTTP
avec Auth/PostgreSQL locaux. Aucun déploiement de ces protections effectué.

### Réduction des rapports d'erreur (local seulement)

Les trois configurations Sentry partagent maintenant un filtre avant envoi.
Les messages, notes libres, cookies, requêtes, utilisateurs, contextes,
breadcrumbs, variables, lignes de code et pièces jointes ne sont pas recopiés.
Restent une classe d'erreur standard, un texte générique, un identifiant
d'événement au format contrôlé, une date technique, une release SHA éventuelle
et les positions dans les chemins de chunks web COAI autorisés, sans paramètres.
Les chemins serveur et les noms de fonctions ne sont pas conservés.

Compromis explicite : rapports moins détaillés et traces de performance
désactivées tant que leur contenu n'est pas audité. Les erreurs restent
collectables si un DSN est configuré ; les messages présentés aux utilisateurs
et les erreurs d'origine ne sont pas modifiés. Aucune nouvelle dépendance.

`scripts/test-error-privacy.cjs` vérifie les trois configurations, le cas sans
DSN et l'enveloppe finale du vrai SDK Node via un transport uniquement en
mémoire, avec notes/pièces jointes fictives. Aucun envoi Sentry effectué.
Cela ne prouve pas l'ensemble des échanges du SDK navigateur, des autres
intégrations, de l'infrastructure ou des logs serveur. La déclaration finale
App Store et la validation en production restent ouvertes.

Commit `8bd72c7` : tests de consentement/rendu réussis, compilation réelle des
règles WebKit, 24 XCTest, builds Release iPhone non signé et UI, TypeScript,
lint et build web réussis. Après changement du User-Agent et des règles :
**3 tests UI hors réseau réussis**, zéro échec, partage PNG/PDF, ajout Photos
accepté et refusé (`/tmp/coai-native-privacy-offline-regression.xcresult`).

Observation historique du 17 septembre : la consultation Vercel confirmait le déploiement production READY
`dpl_5MkwBYMHj9aTPszpWBJUApiADh3b`, commit `371edfb`, qui **précède** ce correctif.
GitHub et coai.fr ne sont plus joignables depuis le Mac lors des derniers essais.
Le commit était local et son push avait échoué. Ce constat historique ne
prouve pas l'état de production actuel. Toute nouvelle publication requiert
l'autorisation explicite d'Anthony ; ensuite vérifier le SHA et les parcours
distants, sans assimiler les tests locaux à une validation de production.

Références Apple consultées :

- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/app-store/user-privacy-and-data-use/
- https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryaddusagedescription
