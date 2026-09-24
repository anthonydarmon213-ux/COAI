# Annulation de reprise d’abonnement — 24 septembre 2026

Défaut reproduit par un test rouge : une tâche mise en file puis annulée
avant son premier passage exécutait quand même l’opération de l’ancienne
session. L’annulation Swift étant coopérative, le contrôle de génération
après l’opération ne suffisait pas à empêcher son démarrage.

Correction : vérifier annulation et génération avant d’appeler l’opération.
Les opérations déjà démarrées conservent les protections existantes ; ce
correctif ne prétend pas annuler une requête serveur déjà envoyée.

Deux tests : annulation avant démarrage avec nouvelle session fonctionnelle,
et abandon d’une reprise forcée mise en attente. Suite finale : 49 tests Swift
réussis. Contrôles iOS (65), compilation des règles WebKit et Release iPhone
arm64 non signée réussis ; TypeScript, lint (six avertissements existants),
build web et tests médias réussis.

Preuves locales : /tmp/coai-recovery-cancel-0924.log,
/tmp/coai-recovery-cancel-final-0924.log,
/tmp/coai-recovery-web-build-0924.log.

Aucun achat, déploiement, installation ou test Sandbox réel effectué.
Validation de production et parcours Apple réels toujours à réaliser.
