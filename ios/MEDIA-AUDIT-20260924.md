# Médias RDL — contrôle visuel du 24 septembre 2026

Deux noms de fichiers sont trompeurs. Séquences examinées par extraction
de plusieurs images réparties dans chaque clip, pas uniquement le poster :

- `public/videos/exercices/deadlift-roumain-barre.mp4` : rowing à la barre,
  buste penché et flexion des coudes, pas un soulevé de terre roumain.
  SHA-256 `5ac0bc5bea626ac2b8f7db07ae3fa0f5fd377559433f655f3fd5b00ade4a4d3b`.
- `public/videos/exercices/deadlift-roumain-halteres.mp4` : rowing bilatéral
  aux haltères, pas un soulevé de terre roumain.
  SHA-256 `9da0f45150cc8e06b9a9c36d26f6c962b5fbb4a1492c2f0ed2e48e1e74db00cb`.

Les associations RDL ont été retirées de `videos-coai.ts`. Fichiers conservés,
aucune réaffectation à un autre exercice, aucune substitution de prescription.
Tests de non-régression couvrant les noms français/anglais et les variantes.
Les photos ne remplacent pas les démonstrations manquantes.

L'audit de bibliothèque reste rouge : 4/90 combinaisons complètes, 86/90 avec
au moins un défaut. Le RDL barre manque désormais explicitement de vidéo,
en plus du nom absent du catalogue. 61 exercices du catalogue ont des médias
référencés ; ce nombre ne prouve pas leur conformité visuelle globale.

Tests médias, TypeScript, lint et build local réussis. Aucun déploiement ni
validation de production. Rechercher un rush réellement conforme ou faire
valider une révision éditoriale avant de considérer ces programmes prêts.
