# Calendrier quotidien COAI — correction locale du 13 octobre 2026

Branche `codex/paris-daily-calendar`, empilée sur la mise à jour serveur
`6da9aae`. Publication et validation de production restent ouvertes.

Le planning utilisait le jour du serveur et ne reconnaissait que les noms
complets des jours. Un programme marqué « MAR » n'était pas reconnu le mardi.
Sur un serveur UTC, le 28 mars à 23 h 30 UTC était enregistré sous le 28 mars,
alors qu'il était déjà le 29 mars à Paris. Ces deux écarts ont été reproduits
avant correction.

Le choix de la séance, la clé PostgreSQL du check-in, l'accueil et la carte
quotidienne suivent maintenant le calendrier Europe/Paris. Les jours français
complets ou abrégés sont acceptés ; une date invalide ou un mot qui contient
accidentellement une abréviation ne sélectionne aucune séance.

Vérifications : sept instants autour de minuit et des changements d'heure,
exécutés avec serveurs UTC, Paris et Los Angeles ; lecture, écriture et carte
quotidienne utilisent la même date. Auth, base et génération d'image sont
simulées dans ce test. Le serveur compilé a aussi retrouvé réellement la séance
du jour marquée par une abréviation, via HTTP/Auth/PostgreSQL QA ; les autres
régressions de la mise à jour serveur repassent. Build et TypeScript réussissent,
lint sans erreur (50 avertissements hérités de la mise à jour).

Les anciennes lignes quotidiennes ne sont ni réécrites ni supprimées. La
correction ne résout pas encore un formulaire gardé ouvert pendant le passage
à minuit : la protection contre l'envoi d'un ancien jour reste à intégrer avec
les clients web/iOS compatibles. Les anciennes adaptations qui contiennent un
mouvement ajouté automatiquement sans média COAI restent également à traiter.
# Exercices du programme uniquement

La normalisation quotidienne n'ajoute plus de « dead bug » automatiquement.
Tests : adaptation normale, faible énergie, durée courte, douleur et charge
mentale saturée ; aucun mouvement inventé et programme source inchangé.
TypeScript et compilation passent. La régression HTTP locale avec Auth et
base de test passe aussi ; les comptes jetables ont été supprimés.
Ce changement n'est pas déployé ni validé en production.

