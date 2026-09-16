# Priorité COAI : prêt à soumettre à l'App Store

Décision Anthony du 16 septembre 2026 : la préparation effective de l'app iOS
à l'App Store prend la priorité sur les effets visuels et la croissance.
Les autorisations de poursuivre restent valables, sans frais supplémentaires.
Anthony confirme le 16 septembre ne pas encore avoir souscrit l'adhésion Apple
Developer. Ne pas confondre connexion au portail et capacité de distribution.
La préparation locale continue ; TestFlight et la soumission restent à débloquer.
L'acceptation finale appartient à Apple et ne peut être garantie.

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

`PrivacyInfo.xcprivacy` déclare l'usage UserDefaults du minuteur (trois clés
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

Preuves actuelles : compilation Release iPhone réussie et 16 tests XCTest (dont
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
