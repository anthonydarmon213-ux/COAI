# Catalogue Apple — accord du 23 septembre 2026

Anthony a validé Essentiel à 19,99 €/mois ou 119 €/an, sept jours d'essai
pour les utilisateurs éligibles, sans changement des offres Stripe.

## Configuration App Store Connect à effectuer

Deux abonnements auto-renouvelables, au même niveau dans un seul groupe
COAI Essentiel (le client choisit une durée, pas deux droits cumulés) :

| Identifiant réservé dans le code | Durée | Prix de référence France |
| --- | --- | --- |
| fr.coai.mobile.essentiel.monthly | 1 mois | 19,99 € |
| fr.coai.mobile.essentiel.annual | 1 an | 119 € |

Configurer un essai gratuit de sept jours sur les deux produits. Ne pas
promettre une nouvelle période gratuite à chaque changement de formule.
Ces identifiants ne prouvent pas que les produits existent chez Apple.
Aucun produit distant n'a été créé par cette préparation.

## Raccordement préparé

- GET /api/ios/apple/catalogue exige une session vérifiée et ne crée aucun droit.
- Le client reçoit les identifiants et périodes, pas un prix codé en dur.
- ApplePurchaseService.loadOffers compare les périodes StoreKit au catalogue,
  utilise Product.displayPrice et n'annonce un essai que si une offre gratuite
  de sept jours existe ET si StoreKit confirme l'éligibilité.
- L'achat conserve la liaison appAccountToken au compte COAI.

## Preuves et limites

Tests de contrat et de route (auth simulée), test HTTP avec authentification
et PostgreSQL locaux, compilation Next.js et compilation iOS Release non signée
réussis. Les 26 tests du cœur Swift restent verts ; ils ne couvrent pas le
chargement réel des produits StoreKit. Aucun achat valide testé.

Restant : créer les produits après accès Apple, brancher le catalogue dans
l'écran natif, livrer et persister les droits après vérification serveur,
traiter renouvellements/remboursements, restaurer et tester en Sandbox puis
TestFlight. Ne pas activer de bouton d'achat avant le raccordement complet.
La migration de production et l'adhésion Developer restent distinctes de
l'accord tarifaire.

Références Apple vérifiées :
- https://developer.apple.com/documentation/storekit/product/subscriptioninfo/iseligibleforintrooffer
- https://developer.apple.com/documentation/storekit/product/subscriptionoffer/paymentmode-swift.struct/freetrial
