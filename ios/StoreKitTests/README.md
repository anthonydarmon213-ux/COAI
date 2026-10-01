# Achats Apple — tests locaux sans facturation

## Exécution

Depuis la racine du dépôt, avec un UUID de simulateur iPhone disponible :

```sh
bash scripts/check-ios-storekit-local.sh <UUID-du-simulateur>
```

Le script impose le simulateur, Debug, la cible dédiée `COAIStoreKitLocal` et
une signature ad hoc gratuite. `LocalTesting.entitlements` autorise uniquement
le débogage de cette compilation. Ne jamais l’ajouter à la configuration Release.
Sans ce droit, StoreKit refuse le catalogue local avec `SKInternalErrorDomain 3`
et son journal indique « is not installed for development ».

Les sources réelles `ApplePurchaseService`, `PurchaseDelivery` et `OfferCache`
sont compilées dans le module de test hébergé par l’app. La boutique est celle
de **StoreKit Testing dans Xcode**, pas App Store Connect. Les produits utilisent
le préfixe distinct `fr.coai.localtest`, avec des prix et essais fictifs servant
uniquement à vérifier l’affichage renvoyé par StoreKit. Le schéma COAI habituel
ne sélectionne aucun catalogue local.

## Couverture

- Prix localisés, périodes mensuelle/annuelle, essai de sept jours éligible.
- Annulation et achat en attente : aucun droit confirmé ni appel de livraison.
- Achat puis panne du serveur simulé : transaction non terminée, restauration
  et confirmation ultérieures, sans rachat ni double livraison dans le lot.
- Autre compte COAI : reçu rejeté avant livraison, récupération possible par
  le propriétaire initial.
- Remboursement : mise à jour du reçu et affichage des droits inactifs renvoyés
  par le serveur simulé ; essai déjà utilisé non reproposé.
- Arrêt du renouvellement : accès conservé pendant la période payée ; expiration
  forcée locale : reçu expiré vérifié puis droits inactifs via le serveur simulé.
- Chargement des produits en échec : anciennes offres invalidées, achat refusé.
- Restauration sans transaction : aucune ancienne confirmation conservée,
  aucun nouvel achat ; absence de confirmation ne signifie pas révocation serveur.
- Autorisation COAI interrompue : aucune livraison, puis restauration possible
  après rétablissement, avec les mêmes identifiants de transaction, sans rachat.

Chaque scénario nettoie les transactions fictives. Les opérations sur la boutique
ne démarrent qu’après création de la session de test et chargement du catalogue.
Le reçu local est décodé dans le test uniquement pour produire un accusé de
réception fictif. Le test exige `environment == Xcode`. **Ce décodage n’est pas
une validation de signature serveur** et n’est jamais utilisé dans le produit.

## Limites

Ces tests n’autorisent aucune publication ni modification des offres commerciales.
Ils ne prouvent pas la configuration App Store Connect, les notifications Apple,
la vérification serveur de vrais reçus, la facturation Sandbox, la présentation
de la feuille de paiement à l’utilisateur ou le fonctionnement sur iPhone physique.
Le serveur COAI est simulé ; aucun compte de production, paiement ou API IA utilisé.

`bash scripts/check-ios.sh --device-release` contrôle également l’absence des
ressources et identifiants de cette suite dans la compilation Release non signée.

Référence officielle : [StoreKit Testing dans Xcode](https://developer.apple.com/documentation/xcode/setting-up-storekit-testing-in-xcode).
