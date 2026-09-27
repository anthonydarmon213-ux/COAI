# Contrôle d'accès coach WhatsApp — 27 septembre 2026

Défaut confirmé dans la route ManyChat : contrairement à `/api/coach/ask`,
elle utilisait le plan effectif sans exiger un abonnement actif. Un compte sans
abonnement retombait sur PASS_IA et pouvait déclencher un appel IA facturé.

Correction locale : même fonction `hasPaidSubscription` que le coach web,
avant enregistrement du message, consommation du quota ou appel IA. Réponse
200 avec message utile conservée pour le contrat `{ reply }` ManyChat.
Les erreurs du fournisseur IA ne sont plus écrites intégralement dans les logs.

Preuves : `scripts/test-whatsapp-paid-access.cjs` exécute le handler réel
transpilé et la fonction réelle de droits, avec base, authentification entrante
et IA simulées. Sans abonnement, CANCELED, PAST_DUE et INCOMPLETE : zéro appel
IA et zéro écriture. Trois plans ACTIVE : réponse préservée. Signature refusée,
utilisateur absent et exception avec contenu secret également couverts.
Typage, lint et compilation locale réussis. Aucun appel payant réel.

Limites : la configuration ManyChat distante et la production ne sont pas
vérifiées. Ce test ne valide pas le secret réel ni une livraison WhatsApp.
## Quota — correction locale suivante

Réservation par incrément conditionnel en base, limitée à quatre questions.
Réinitialisation conditionnée par la fenêtre observée pour ne pas effacer les
réservations simultanées. En cas d'échec IA ou de stockage de la réponse,
décrément conditionnel sur la même fenêtre et seulement si le compteur est
positif. Aucun nouvel appel IA automatique.

`scripts/test-whatsapp-quota.cjs` exécute le handler réel avec base simulée :
huit demandes concurrentes pour une place, huit demandes après expiration,
panne IA, panne de sauvegarde et changement de fenêtre avant restitution.
Tests réussis, ainsi que droits d'accès, typage, lint et build.

À vérifier encore avec PostgreSQL réel local et en production ; les tests
simulés ne constituent pas cette preuve. Si la base refuse aussi la restitution,
une erreur générique est journalisée : aucune restitution durable automatique
n'est garantie. Livraison ManyChat et doublons d'événements restent à auditer.
