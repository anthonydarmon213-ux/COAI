# Inventaire de confidentialité iOS — brouillon technique

Audit du code au 17 septembre 2026. Ce document prépare la déclaration App
Store Connect ; il ne constitue ni une déclaration soumise, ni une validation
juridique, ni la preuve de la configuration des services de production.
Les écrans web intégrés à WKWebView font partie du périmètre de l'app.

## Données et preuves dans le dépôt

| Périmètre | Données prévues par le code | Source / point à vérifier |
| --- | --- | --- |
| Compte | Nom, email, identifiant Auth et compte, coordonnées facultatives | `prisma/schema.prisma`, `src/lib/auth/server.ts` ; finalités et durées à confirmer dans les parcours réels |
| Coaching | Profil, objectifs, mesures, antécédents, sommeil, stress, check-ins et séances | Modèles Profile, SeanceLog, Mesure, WeeklyCheckin ; données liées au compte, certaines sensibles. L'existence d'un champ ne prouve pas sa collecte effective chez chaque membre |
| Photos | Avatar et images de suivi | `src/lib/storage/progress-photos.ts` ; bucket exact `progress photos`, contrôle du préfixe propriétaire, URL signée 1 h. Vérifier en production caractère privé, règles d'accès et traitement des métadonnées des images |
| Abonnements | Identifiants et état d'abonnement | Modèle Subscription ; StoreKit préparé mais non raccordé. Déclaration finale à refaire après intégration Apple et validation serveur |
| Fonctionnement natif | Durée, pause et échéance du repos conservées localement | RestTimerView et PrivacyInfo.xcprivacy ; UserDefaults déclaré. Notification locale générique et facultative |
| Export de séance | PDF/PNG/JPEG temporaires choisis par l'utilisateur | COAIDownload et DownloadPolicy ; dossier local protégé, nettoyage, feuille de partage explicite. Test actuel : fichiers fictifs, pas séance réelle connectée |
| Mesure facultative | Google Analytics, Meta, Vercel Analytics ; attribution UTM | Désactivés pour le pilote marqué COAIiOS ; règles WebKit complémentaires. Safari garde ses choix. Vérification réseau complète restant à faire |
| Diagnostic technique | Erreurs conditionnées par le DSN Sentry | Filtre commun `src/lib/analytics/error-privacy.ts` ajouté : valeurs libres et pièces jointes retirées, liste explicite de champs techniques. Traces de performance désactivées pendant l'audit. Transport mémoire du vrai SDK testé ; déploiement et flux réels restent non vérifiés |
| Événements internes | Nom d'événement, identifiant utilisateur et métadonnées | `src/lib/analytics/product-events.ts` journalise côté serveur. Ce flux n'est pas supprimé par le refus des traceurs du navigateur ; inventaire, minimisation et conservation à examiner |

Ne pas déclarer « aucune donnée collectée ». Ne pas confondre absence de SDK
HealthKit natif et absence de données de santé saisies dans les écrans web.
Les déclarations caméra/micro/Photos de l'Info.plist ne prouvent pas à elles
seules que chaque usage est testé, nécessaire ou effectivement déclenché.

## Points non clos, classés par impact

1. Vérifier les transmissions réelles des écrans connectés et les journaux
   techniques ; définir puis tester la suppression des données sensibles dans
   les erreurs et métadonnées avant déclaration définitive.
2. Finaliser la suppression de compte : concurrence, révocation des sessions,
   fichiers et test complet avec un compte jetable autorisé. Voir checklist.
3. L'export de compte (`src/app/api/compte/export/route.ts`) n'inclut que profil,
   abonnement, programmes, séances, mesures et événements WhatsApp. Les
   check-ins et autres relations ne sont pas inclus explicitement : couverture
   à compléter. Le téléchargement natif JSON est désormais testé avec un objet
   fictif et un fichier invalide (`/tmp/coai-json-export.xcresult`) ; le parcours
   complet de compte connecté reste à valider, sans le confondre avec les fiches
   PDF/Story ou avec le simple affichage de la feuille système.
4. Vérifier les consentements des données sensibles, les destinataires réels,
   les durées de conservation et les régions des fournisseurs. Les affirmations
   de la page confidentialité doivent correspondre à ces preuves.
5. Renseigner les réponses App Store Connect après les intégrations finales,
   vérifier sur appareil, puis soumettre à la validation du titulaire.

## Preuves et limites du lot traceurs

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

La consultation Vercel confirme le déploiement production READY
`dpl_5MkwBYMHj9aTPszpWBJUApiADh3b`, commit `371edfb`, qui **précède** ce correctif.
GitHub et coai.fr ne sont plus joignables depuis le Mac lors des derniers essais.
Le nouveau commit est local, son push a échoué. Le test UI public de
confidentialité ne peut donc pas être déclaré réussi. Reprendre push,
vérification du SHA déployé, puis test public dès le réseau rétabli.

Références Apple consultées :

- https://developer.apple.com/app-store/app-privacy-details/
- https://developer.apple.com/app-store/user-privacy-and-data-use/
- https://developer.apple.com/documentation/bundleresources/information-property-list/nsphotolibraryaddusagedescription
