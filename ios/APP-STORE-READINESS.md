# Priorité COAI : prêt à soumettre à l'App Store

Décision Anthony du 16 septembre 2026 : la préparation effective de l'app iOS
à l'App Store prend la priorité sur les effets visuels et la croissance.
Les autorisations de poursuivre restent valables, sans frais supplémentaires.
Anthony confirme le 16 septembre ne pas encore avoir souscrit l'adhésion Apple
Developer. Ne pas confondre connexion au portail et capacité de distribution.
La préparation locale continue ; TestFlight et la soumission restent à débloquer.
L'acceptation finale appartient à Apple et ne peut être garantie.

## Checklist globale persistante — 17 septembre 2026

« Testé localement » ne signifie ni testé en production ni prêt à publier.
Aucun des dix parcours n'est encore déclaré terminé de bout en bout sur iPhone.
L'app actuelle combine SwiftUI et des écrans web WKWebView ; elle ne constitue
pas encore une expérience native complète validée.

| Parcours | État réel | Preuve / travail restant avant validation |
| --- | --- | --- |
| 1. Installation et ouverture | En cours | Builds simulateur et Release arm64 sans signature réussis. Installation physique, relance, archive de distribution et TestFlight à vérifier. |
| 2. Compte et connexion | En cours | PKCE Google, annulation et reprise protégée testés unitairement. Connexion persistante réelle, récupération et option Apple encore à valider/compléter. |
| 3. Diagnostic et score COAI | Restant : validation iOS | Écrans web existants ; tester nouveau compte, questionnaire complet, calcul, sauvegarde et reprise interrompue dans l'app. |
| 4. Programme personnalisé | Restant : validation iOS | Bibliothèque prioritaire, pas d'appel IA payant automatique. Vérifier sélection, profils exclus, sauvegarde et absence de doublon sur compte de test. |
| 5. Entraînement, nutrition, récupération | En cours | Routes existantes et minuteur natif. Vérifier droits, médias, fiches et navigation sur petits écrans avec données réelles de test. |
| 6. Séances, performances et progrès | En cours | Correctifs RepCount couverts par tests locaux : erreurs, brouillon et reprise. Séance complète, historique, export et partage natif à vérifier sur appareil. |
| 7. Check-ins, adaptations et mémoire | Restant : validation iOS | Moteur et routes existants. Vérifier persistance, isolation des comptes, confirmations, cohérence des adaptations et absence d'appel payant. |
| 8. Abonnements Apple | En cours + intervention humaine | Service StoreKit préparé mais non raccordé. Catalogue, droits serveur, achat, essai, restauration, expiration et résiliation restent à réaliser et tester. Tarifs/migration à valider. |
| 9. Notifications et réengagement | En cours | Alerte locale facultative de repos ajoutée. Concurrence testée, affichage iOS réel encore non vérifié. Réengagement consenti non implémenté. |
| 10. Suppression sécurisée | En cours | Vérification de résiliation Stripe et erreurs UI testées avec doublures. Restent erreurs de suppression Auth/Storage, reprise partielle et test intégral sur compte jetable autorisé. |

Terminé et testé **au niveau technique local seulement** : règles de navigation,
horloge/pause persistante, séquencement des livraisons d'achats et des alertes
(22 XCTest), compilation simulateur et Release iPhone sans signature.

Blocages humains identifiés : adhésion Apple Developer (coût non autorisé),
contrats/validation Apple, catalogue et conditions commerciales iOS, autorisation
d'une éventuelle migration de production. Ces blocages n'empêchent pas les autres
travaux de développement et de test sans frais.

Restant transversal : audit confidentialité, sécurité et charge backend,
accessibilité/clavier/safe areas, captures App Store réelles, description exacte,
compte de revue, tests physiques et TestFlight. Rentabilité et croissance ne
peuvent pas être déduites d'un build : elles nécessitent des mesures réelles.

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
