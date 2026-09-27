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
Autres défauts repérés, encore à traiter : quota WhatsApp non atomique et
question consommée en cas d'échec IA, contrairement à la route web.
