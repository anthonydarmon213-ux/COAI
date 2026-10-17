# Services Apple — lot serveur préparé le 13 octobre 2026

Ce lot ajoute les quatre routes absentes de coai.fr : préparation du compte,
catalogue, remise de transaction et notifications Apple. Il est préparé sur le
commit de production `9b70e3e`. Il ne constitue pas une activation commerciale
ni une validation App Store.

## Résultat vérifié

- Build Next, TypeScript, lint et 356 références de médias passent.
- Tests HTTP avec le serveur compilé, Supabase Auth et PostgreSQL QA : deux
  comptes isolés, requêtes concurrentes, cookies et bearer, tentatives
  inter-comptes, états Stripe actif/en retard/résilié. Les ventes restent fermées.
- Avec la lecture du registre Sandbox activée localement, un achat synthétique
  actif est reconnu, puis l'expiration et le remboursement retirent cet accès.
  La remise d'une valeur non signée ne crée aucune transaction.
- Registre PostgreSQL : doublons, renouvellements, concurrence entre comptes,
  remboursement et répétition d'une ancienne confirmation vérifiés.
- Toute la chaîne de migrations passe sur une base locale neuve. Les tables
  Apple ont RLS et aucun droit Data API pour anon/authenticated ; contraintes
  de période/environnement et suppression en cascade vérifiées. Ces protections
  suivent la [documentation Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
- Les tests créent leurs propres comptes jetables et les nettoient, y compris
  sur échec. Ils ne dépendent plus d'un ancien compte QA existant.

Les signatures de reçus valides, les notifications Apple réelles et les achats
Sandbox restent à vérifier avec App Store Connect. Les tests utilisent des
faits synthétiques à cet endroit.

## Publication contrôlée à préparer

1. Vérifier les migrations de production et la sauvegarde disponible.
2. Avec l'accord de migration d'Anthony, appliquer uniquement les deux fichiers :
   `20260923161721_apple_purchase_accounts/migration.sql` et
   `20260923175611_apple_transaction_ledger/migration.sql`.
   Le contrôle distant en lecture seule du 13 octobre confirme que les deux
   tables Apple sont absentes. Aucune migration n'a été appliquée par ce lot.
3. Déployer le code avec `APPLE_PURCHASES_ENABLED=false`,
   `APPLE_CONTENT_ACCESS_ENABLED=false`, `APPLE_NOTIFICATIONS_ENABLED=false`.
   Les racines Apple et l'identifiant App Store ne sont pas inventés.
4. Vérifier les quatre routes en production et un compte de revue autorisé :
   catalogue et compte privés, stabilité du lien de compte, refus des requêtes
   non autorisées, notification fermée (503). Le test local n'en tient pas lieu.
5. Raccorder tous les accès contenu de l'app au registre Apple avant activation,
   puis tester connexion Apple, catalogue StoreKit, achats, restauration,
   expiration, remboursement et suppression de compte de bout en bout.
6. Activer les ventes seulement après validation des produits et de ces parcours.

La migration est additive et ne modifie aucune ligne Stripe. En cas d'échec de
mise en ligne, remettre le code précédent et conserver les nouvelles tables
privées ; aucune suppression automatique de registre de paiement.

## Autre préalable de release identifié

La base de production utilise Next.js 14.2.35. L'audit npm du 13 octobre signale
18 dépendances, dont Next classé critique. Aucun paquet de la bibliothèque
Apple ajoutée n'est présent dans la liste des dépendances signalées.
Les mises à jour du serveur et leurs régressions doivent être traitées dans
un lot dédié avant activation Apple ; ce lot ne les corrige pas.
