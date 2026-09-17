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
| Diagnostic technique | Erreurs et traces conditionnées par le DSN Sentry | `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` : pas de filtre applicatif beforeSend constaté. Inspecter les charges effectivement transmises avant de garantir l'absence de données sensibles |
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
   à compléter. Le téléchargement natif actuel refuse JSON ; tester et corriger
   le parcours d'export de compte, sans le confondre avec les fiches PDF/Story.
4. Vérifier les consentements des données sensibles, les destinataires réels,
   les durées de conservation et les régions des fournisseurs. Les affirmations
   de la page confidentialité doivent correspondre à ces preuves.
5. Renseigner les réponses App Store Connect après les intégrations finales,
   vérifier sur appareil, puis soumettre à la validation du titulaire.

## Preuves et limites du lot traceurs

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
