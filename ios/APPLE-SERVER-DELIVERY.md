# Réception serveur Apple — préparation, non activée

POST `/api/ios/apple/transactions` reçoit uniquement `{ "signedTransaction": "<JWS StoreKit>" }` avec une session COAI `Authorization: Bearer …`, ou la session cookie WebKit existante avec Origin strictement égal à NEXT_PUBLIC_APP_URL. Sans Bearer, une origine absente ou différente est refusée. Le compte Apple stable doit avoir été préparé par `/api/ios/apple/account`. Le serveur ignore les identités, offres et environnements proposés dans le corps.

Le modèle natif expose deliverAppleReceipt, qui appelle ce point d'entrée via fetch dans le monde WebKit isolé, depuis https://coai.fr seulement, sans extraire les secrets de session. Redirections refusées, délai 25 secondes, réponse décodée strictement et génération de vue contrôlée. Ce transport n'est pas encore branché à un écran de vente : préparation du compte/catalogue et cycle de connexion restent à intégrer.

La route vérifie la signature avec la bibliothèque officielle Apple, persiste les faits, relit les droits puis retourne `transactionID`, `accountToken`, `persisted` et `access`. Une erreur ne vaut jamais confirmation : StoreKit doit conserver la transaction pour réessayer. Une révocation/expiration correctement enregistrée peut être confirmée sans accès actif.

Configuration de déploiement nécessaire, non installée automatiquement :

- `APPLE_STORE_ENVIRONMENT` : `Sandbox` ou `Production`, jamais choisi par le téléphone.
- `APPLE_ROOT_CERTIFICATES_BASE64_JSON` : tableau JSON des certificats racines Apple PKI DER encodés en base64, obtenus et vérifiés côté exploitation. Jamais la chaîne envoyée par le client.
- `APPLE_APP_ID` : identifiant numérique App Store, obligatoire en Production.

Le bundle est fixé à `fr.coai.mobile`, les produits au catalogue Essentiel approuvé. Ne pas configurer Sandbox sur le backend de production pour débloquer les tests : utiliser un environnement et une base dédiés. Les tables Apple doivent être migrées avant activation ; aucune migration distante n'est autorisée par ce document.

Limites de validation actuelles : tests de route avec dépendances simulées ; livraison et droits testés sur PostgreSQL local avec faits synthétiques. Pas encore de JWS Apple valide, paiement ou restauration réels. Le client natif et les routes de contenu doivent encore être raccordés, ainsi que les notifications serveur Apple. Ne pas activer la vente sur la seule présence de cette route. Limitation de débit distribuée et tests de charge restent à ajouter avant exposition publique de la vente.
