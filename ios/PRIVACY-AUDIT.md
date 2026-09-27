# Inventaire de confidentialité iOS — brouillon technique

Audit du code actualisé le 25 septembre 2026. Ce document prépare la déclaration App
Store Connect ; il ne constitue ni une déclaration soumise, ni une validation
juridique, ni la preuve de la configuration des services de production.
Les écrans web intégrés à WKWebView font partie du périmètre de l'app.

## Données et preuves dans le dépôt

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

## Points non clos, classés par impact

1. Vérifier les transmissions réelles des écrans connectés et les journaux
   techniques ; définir puis tester la suppression des données sensibles dans
   les erreurs et métadonnées avant déclaration définitive.
2. Finaliser la suppression de compte : concurrence, révocation des sessions,
   fichiers et test complet avec un compte jetable autorisé. Voir checklist.
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
   La sauvegarde du JSON connecté dans Fichiers et le contrôle du fichier final
   restent à vérifier, ainsi que l’appareil physique et la production.
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
