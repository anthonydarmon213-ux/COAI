# Suppression de compte — vérification du 24 septembre 2026

## Complément du 25 septembre — suppression HTTP avec Storage réel

`scripts/test-account-delete-http-storage-local.cjs` vérifie exclusivement les
services locaux (hôtes/ports imposés) : Auth, PostgreSQL, Storage et serveur
Next compilé. Deux comptes synthétiques, deux sessions par compte, 101 PNG
pour A et un PNG pour B dans le bucket privé `progress photos`.

Résultat : HTTP 200, 101 fichiers supprimés malgré la pagination à 100,
utilisateur/profil A supprimés ; deux anciens jetons refusés par Auth et
l'export HTTP (401), renouvellements et ancien mot de passe refusés.
Le userId B forgé dans le corps ne détourne pas la suppression : son compte
reste accessible et son fichier est retéléchargé et comparé octet par octet.
Fixtures nettoyées, bucket partagé conservé. Journal :
`/tmp/coai-delete-storage-http-0925.log`.

Cela complète, sans remplacer, le scénario de panne ci-dessous qui exige
Storage indisponible. Aucun abonnement payant dans cette nouvelle fixture,
aucun test natif connecté, production ou annulation Apple. Les événements IA
et reçus Apple restent couverts séparément ; aucune preuve d'anonymisation
globale n'est déduite de ce test.

## Complément HTTP du 25 septembre — panne réelle de Storage

La pile locale Auth/PostgreSQL utilisée à ce moment ne lançait pas Storage (inventaire Docker
vérifié). Une première tentative de tester la suppression complète reçoit donc
503 ; elle ne compte pas comme suppression réussie. Le test de panne explicite
vérifie ensuite : message de nettoyage non confirmé, aucun faux succès,
compte et données Apple/IA conservés, accès cookie/bearer utilisables pour
réessayer, autre compte intact malgré un userId tiers envoyé dans le corps.
Journal `/tmp/coai-delete-outage-http-0925.log`, fixtures nettoyées.

Cette preuve ne remplace ni un nettoyage réel de photos ni une suppression
HTTP réussie. La relation AiUsageEvent est SetNull dans le schéma : ne pas
annoncer la suppression de tous les événements techniques ou leur anonymat
sur cette seule base. Politique de conservation et corrélations à examiner.

## Vérifié localement

- Protection de provenance : en-tête explicite requis, origine exacte de
  NEXT_PUBLIC_APP_URL pour les sessions cookie, origine cross-site refusée,
  authentification Bearer mal formée refusée sans repli sur les cookies.
  Le marqueur n'est pas un secret et ne remplace jamais l'authentification.
- Les scénarios refusés n'appellent ni Auth ni Stripe ni la base dans les tests
  de route. Les origines nulles, absentes, trompeuses, HTTP non local et faux
  Host/X-Forwarded-Host sont couverts ; configuration absente/invalide fermée.
- Serveur compilé temporaire 127.0.0.1:3062 : quatre requêtes HTTP réelles,
  sans session, refusées avec les statuts attendus 403/401. Serveur arrêté.
  Les parcours autorisés restent testés avec services simulés, pas en production.
- Déploiement futur : livrer ensemble le bouton et la route ; une ancienne page
  ouverte sans le nouveau marqueur devra être rechargée. Vérifier que l'origine
  canonique utilisée par l'app correspond à NEXT_PUBLIC_APP_URL. Ne pas ouvrir
  CORS pour contourner cette protection.

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
