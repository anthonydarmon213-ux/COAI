# Suppression de compte — vérification du 24 septembre 2026

## Vérifié localement

- `scripts/test-apple-account-deletion-local.cjs` exécute les fonctions réelles
  du registre Apple sur PostgreSQL local (127.0.0.1:54322 uniquement).
- Suppression de deux utilisateurs synthétiques créés par ce test : les
  lignes ApplePurchaseAccount et AppleTransaction disparaissent en cascade.
- Ancien reçu et notification tardive refusés après suppression.
- Un profil recréé avec le même identifiant Auth/email reçoit un nouveau
  token Apple ; l'ancien reçu ne lui attribue aucun abonnement.
- Course déterministe : suppression après contrôle de propriété mais avant
  insertion du reçu. La clé étrangère empêche la recréation des droits.
- Tests des actions de compte : avertissement Apple visible et dans la
  confirmation, lien de gestion direct, suppression immédiate conservée,
  annulation sans requête, erreurs et double-appui.
- Tests de résiliation Stripe/suppression existants passent, avec services simulés.
- TypeScript, lint (avertissements existants) et build web passent ; 356
  références médias présentes.

Les comptes synthétiques supprimés ne sont pas récupérables, mais ne
contenaient que les faits de reçu fictifs créés par ce test. Aucun compte réel
ni abonnement externe n'a été modifié.

## Non prouvé / restant avant soumission

- Suppression complète réelle via l'interface iPhone, stockage et Supabase Auth.
- Invalidation des sessions sur plusieurs appareils et requêtes concurrentes.
- Révocation du fournisseur Sign in with Apple (ne pas activer ce fournisseur
  avant d'avoir terminé cette intégration).
- Résiliation réelle, restauration et notifications Apple Sandbox/TestFlight.
- Affichage et ouverture effective du lien Apple sur iPhone.
- Comportement de support après suppression : un reçu lié au compte supprimé
  est volontairement rejeté, pas transféré silencieusement à un autre compte.
- Aucune validation en production ni certification de conformité globale.

La suppression de profil ne résilie pas un abonnement Apple. L'écran le
précise désormais avant la confirmation et propose le lien officiel de gestion,
sans conditionner l'effacement à une résiliation préalable.

Source : https://developer.apple.com/support/offering-account-deletion-in-your-app/
