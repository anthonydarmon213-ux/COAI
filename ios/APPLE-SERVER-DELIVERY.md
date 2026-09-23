# Réception serveur Apple — préparation, non activée

POST `/api/ios/apple/transactions` reçoit uniquement `{ "signedTransaction": "<JWS StoreKit>" }` avec une session COAI `Authorization: Bearer …`, ou la session cookie WebKit existante avec Origin strictement égal à NEXT_PUBLIC_APP_URL. Sans Bearer, une origine absente ou différente est refusée. Le compte Apple stable doit avoir été préparé par `/api/ios/apple/account`. Le serveur ignore les identités, offres et environnements proposés dans le corps.

Le modèle natif expose deliverAppleReceipt, qui appelle ce point d'entrée via fetch dans le monde WebKit isolé, depuis https://coai.fr seulement, sans extraire les secrets de session. Redirections refusées, délai 25 secondes, réponse décodée strictement et génération de vue contrôlée. L'écran natif, la préparation authentifiée compte/catalogue et la reprise au premier plan sont raccordés dans le code. Les ventes restent désactivées ; aucun paiement Apple réel n'est encore prouvé.

La route vérifie la signature avec la bibliothèque officielle Apple, persiste les faits, relit les droits puis retourne `transactionID`, `accountToken`, `persisted` et `access`. Une erreur ne vaut jamais confirmation : StoreKit doit conserver la transaction pour réessayer. Une révocation/expiration correctement enregistrée peut être confirmée sans accès actif.

Configuration de déploiement nécessaire, non installée automatiquement :

- `APPLE_STORE_ENVIRONMENT` : `Sandbox` ou `Production`, jamais choisi par le téléphone.
- `APPLE_ROOT_CERTIFICATES_BASE64_JSON` : tableau JSON des certificats racines Apple PKI DER encodés en base64, obtenus et vérifiés côté exploitation. Jamais la chaîne envoyée par le client.
- `APPLE_APP_ID` : identifiant numérique App Store, obligatoire en Production.
- `APPLE_CONTENT_ACCESS_ENABLED=true` : lecture des droits Apple pour les contenus raccordés, seulement après migration et validation dédiée. Absent par défaut : aucun accès aux nouvelles tables depuis ces pages. Ce réglage n'active pas la vente native.

Contenus actuellement raccordés : recettes, programmes prêts, RepCount et préparation des trois piliers depuis la bibliothèque. Les droits Stripe actifs et les déblocages historiques sont préservés ; une panne Apple est distinguée d'un refus d'accès. Aucun appel IA payant réactivé. Les autres contrôles d'accès doivent encore être audités et raccordés avant activation commerciale globale.

Le bundle est fixé à `fr.coai.mobile`, les produits au catalogue Essentiel approuvé. Ne pas configurer Sandbox sur le backend de production pour débloquer les tests : utiliser un environnement et une base dédiés. Les tables Apple doivent être migrées avant activation ; aucune migration distante n'est autorisée par ce document.

## Notifications serveur, préparées le 24 septembre

POST `/api/webhooks/apple` reçoit `{ "signedPayload": "<notification Apple V2>" }`. Désactivé sauf `APPLE_NOTIFICATIONS_ENABLED=true`, à ne pas activer avant configuration et test Apple. Cette route ne demande pas de session utilisateur : les signatures Apple authentifient l'enveloppe puis son reçu imbriqué. Le compte est retrouvé uniquement depuis le token du reçu vérifié. Les modifications sont persistées avant HTTP 200 ; les doublons et événements anciens passent par les verrous et dates signées du registre existant. Aucun nouveau schéma.

Événements transactionnels pris en charge : souscription, renouvellement, expiration, échec de renouvellement, fin de grâce, changements de renouvellement, offre, augmentation, remboursement/refus/annulation du remboursement, révocation, prolongation. TEST signé est acquitté sans modification. Les autres événements sont refusés (503), pas faussement déclarés traités. Aucun traitement de demande de consommation ou de consentement n'est implémenté. Les informations de renouvellement et la période de grâce ne sont pas encore interprétées : ne pas activer une politique de grâce commerciale sur cette base.

Limites de validation : routes testées avec dépendances simulées ; livraison, notifications et droits testés sur PostgreSQL local avec faits synthétiques. Pas encore de JWS Apple valide, paiement ou restauration réels. URL non enregistrée dans App Store Connect, configuration distante inchangée. Limitation de débit distribuée, suivi des échecs et récupération des notifications manquées restent à ajouter avant exposition publique. Ne pas activer la vente sur la seule présence de ces routes.
