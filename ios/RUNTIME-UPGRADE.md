# Mise à jour du serveur COAI — 13 octobre 2026

Branche locale `codex/security-runtime-update`, préparée sur la production
`9b70e3e`. Aucun déploiement de ce lot n'a été effectué.

## Changements

Next.js passe de 14.2.35 à 16.4.0, React/React DOM et leurs types à 19.3.0,
ESLint à 10.12.0. Les versions directes sont fixées dans le lockfile.
Next.js 16 appartient à la branche maintenue active selon la
[politique de support officielle](https://nextjs.org/support-policy).

Les cookies, les en-têtes, les paramètres des routes et les paramètres des
pages utilisent les API asynchrones. Les appelants de la connexion Supabase
et du retour OAuth sont adaptés ; aucun cast de compatibilité temporaire ne
subsiste. Une autorisation explicite malformée est refusée sans reprendre un
autre compte depuis ses cookies.

La qualité d'image 95 utilisée par la page d'accueil est autorisée explicitement
dans la nouvelle configuration. Le message d'erreur global ne prétend plus
qu'Anthony a été notifié si aucun service de notification n'est configuré.
L'ancre de secours recharge entièrement l'application après un échec du layout.

## Vérifications

- Deux builds optimisés réussissent, puis une recompilation après la protection
  globale des en-têtes d'authentification réussit.
- TypeScript, contrôle des médias et contrôle de diff passent.
- HTTP avec serveur compilé, Supabase Auth et PostgreSQL QA : pages publiques
  et protégées, retour OAuth en erreur, invitation dynamique, sessions cookies
  et bearer, recettes, progression et séance avec isolation entre deux membres.
- Le PDF réel est généré par les deux routes, et une image optimisée de qualité
  95 répond correctement. Cela valide le transport/rendu technique ; le contenu
  des anciens programmes demeure un chantier distinct.
- Une autorisation invalide, vide ou malformée accompagnée de cookies valides
  reçoit 401. Les comptes fictifs sont supprimés après les tests.
- Régressions OAuth, confirmation d'email et 36 cas de route PDF passent avec
  services simulés, sans email externe ni achat.
- Dans le navigateur à 390 × 844 : connexion effective, navigation vers le
  programme, ouverture du lecteur et affichage du bon média. Les champs de
  répétitions/charge sont accessibles après défilement et mesurent 54 px.
  Aucun message d'erreur navigateur au contrôle. La liaison de contrôle s'est
  ensuite interrompue avant la navigation Recettes ; ce parcours UI reste ouvert.
  Le compte jetable et son serveur ont été nettoyés. Ce contrôle ne remplace
  pas Safari sur iPhone, le binaire iOS ou une validation en production.

## Points encore ouverts

L'audit npm des dépendances de production ne signale plus de vulnérabilité
connue (0). L'audit complet conserve 9 alertes dans les outils de développement
liés aux motifs CSS. La mise à jour forcée de Tailwind vers une version majeure
n'est pas incluse : ses conséquences visuelles nécessitent une revue dédiée.

Les nouvelles recommandations React Compiler sur pureté, références et état
dans les effets restent visibles en avertissements ; l'application n'active
pas React Compiler. Le lint n'a pas d'erreur mais conserve 50 avertissements,
principalement issus de ces recommandations et des règles Next nouvelles.
Leur revue ne doit pas être présentée comme terminée.

La convention middleware Edge est conservée pour préserver le contrôle des
sessions ; Next la signale comme dépréciée. Confirmer avant déploiement que
le projet Vercel utilise Node.js >= 20.9, puis vérifier les parcours connectés
et les images sur une preview et en production. La signature iOS, les services
Apple et les données historiques ne sont pas validés par cette mise à jour.
