# Intégration locale des PR 126, 127 et 128 — 15 octobre 2026

## Réconciliation avec la production du 17 octobre

Base distante actualisée : a402ace (PR 127/128 déjà fusionnées et déployées).
PR 126 toujours ouverte/brouillon et CONFLICTING ; ses endpoints compte et
catalogue renvoient encore 404 en production. Aucun accord de fusion de 126.

Fusion locale de cette base dans la branche d'intégration : trois conflits
résolus (verrou npm, contrôle HTTP propriétaire et ligne vide de calendrier).
Conserver les dépendances Apple et le test 409 propriétaire ; semver reste une
dépendance runtime du SDK Apple, pas seulement devOptional. Le contenu final
du code et du verrou est identique au HEAD local précédemment validé 130b891 :
cette opération réconcilie l'ascendance Git avec les squashes de production.

Nouvelle installation npm ci hors ligne réussie, puis runner combiné complet :
unitaires Apple/propriétaire/calendrier, build Next et HTTP/Auth/PostgreSQL.
Concurrence de liaison Apple, sessions cookie/bearer et isolation passent ;
transaction non signée refusée. Fixtures supprimées. Typage/lint contrôlés.
Achats, accès et notifications Apple désactivés ; aucune migration exécutée.
Le contrôle lint ciblé CJS a ensuite révélé un défaut de configuration : règles
react-hooks globales alors que le plugin Next ne s'applique pas aux fichiers
CJS. Portée alignée sur les fichiers JS/TS concernés, sans désactiver leurs
règles React. Ce correctif de configuration est distinct de la fusion à contenu
identique décrite plus haut. Résultat local uniquement : pas de push, mise à jour
de PR ou déploiement.

Branche locale : `codex/release-pr-integration`, worktree réutilisé
`/private/tmp/coai-owner-fix-20261015`. La branche publique propriétaire et
la branche d'intégration native principale restent inchangées.

## Périmètre

- 128 : 6afc84330ca2dc41a4507fe33b0e23bab63f5652, point de départ.
- 126 : ae3819ea6cdfd86c784248f66fc2df331d93e040, intégration locale.
- 127 : 24d46c867d1b88536e82f2862395d8f3caa39c33, intégration locale.
- Conflit package-lock.json résolu par npm, pas par sélection aveugle d'une
  branche : `npm install --package-lock-only --ignore-scripts --offline --no-audit --fund=false`.
- Manifeste combiné strictement identique à c5da621 pour dependencies et
  devDependencies ; pas d'ajout de sharp ni de correctifs hors de ces PR.
- Racine du verrou cohérente, Next 16.4.0 et SDK Apple 3.1.0, aucun marqueur de conflit.

## Vérifications réellement exécutées

Installation exacte `npm ci --ignore-scripts --offline --no-audit --fund=false`
réussie : 613 paquets depuis le cache, pas de réseau ni script automatique.
Avertissements de peers ESLint 10/plugins et dépendance dépréciée jsrsasign
à conserver visibles ; ils ne sont pas une preuve de compatibilité universelle.

`node scripts/check-release-pr-runtime.cjs` réussi après résolution, puis retest
après ajout du contrôle HTTP propriétaire. Le runner refuse les fichiers dotenv,
utilise uniquement Auth/Postgres loopback et masque les clés locales en mémoire.
Achats, notifications Apple, accès Apple, IA et prestataires payants désactivés.
Génération du client Prisma seulement, aucune migration.

- Tests de propriétaire, calendrier Paris, catalogue/livraison Apple, routes
  d'erreur, politiques de transactions/notifications, signature invalide et accès.
  Les tests unitaires utilisent des dépendances simulées, pas une transaction Apple valide.
- Build Next complet et typage réussis ; lint sans erreur bloquante.
- HTTP/Auth/DB réels locaux : pages publiques/protégées, sessions cookie/bearer,
  deux comptes isolés, recettes/progression/séance, PDF et image optimisée.
- POST séance avec le cookie de A et l'identifiant attendu de B : HTTP 409,
  cache privé non conservé, zéro séance créée pour A et B.
- HTTP Apple local : liaison concurrente, isolation, états Stripe, transaction
  non signée refusée ; registre Apple désactivé. Comptes fictifs nettoyés.
- Audit des chemins médias et diff check réussis.

## Limites et prochaine étape

Ce n'est pas la totalité de l'app native actuelle : les corrections locales
ultérieures restent sur `codex/apple-runtime-integration`. Pas de preuve UI,
physique, Sandbox Apple ou production obtenue par cette intégration serveur.
Les deux migrations Apple sont présentes dans le code mais non appliquées.
Aucune PR distante fusionnée/modifiée, aucun push, déploiement ou soumission.
Une publication de cette branche et tout déploiement exigent l'accord approprié.
