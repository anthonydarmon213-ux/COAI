# Règles de travail partagées — Codex et Claude Code

Ce fichier est lu par **Codex** (`AGENTS.md`) et référencé depuis `CLAUDE.md`.
Les deux agents travaillent sur le même dépôt et doivent suivre ces règles.
Elles viennent d'incidents réels, chacun est documenté.

## 1. Un seul clone, jamais de travail non commité

Le dépôt de travail est celui du projet ChatGPT « lab-coach » :
`~/.codex/.chatgpt-projects/g-p-6a7351565e908191acf2dce512faba99/coai`

- Ne jamais recloner ailleurs. Quatre clones parallèles ont existé, dont un
  contenant **382 changements non commités** (164 recettes, 163 visuels)
  invisibles pendant des jours.
- **Avant de terminer une session : commiter et pousser.** Du travail laissé
  dans l'arbre est du travail perdu pour l'autre agent.
- **Avant de commencer : `git pull`.** L'autre agent a peut-être livré depuis.

## 2. Ne jamais réutiliser un identifiant existant

Vérifier avant d'ajouter une fiche :

    grep -c 'id: "mon-id"' src/lib/exercices/catalogue.ts

Deux fiches ont été livrées avec les identifiants `extension-triceps-trx` et
`releve-jambes-suspendu`, déjà pris par d'autres exercices.

## 3. Toute image ou vidéo référencée doit exister

Audit obligatoire avant commit :

    grep -rhoE '"/[a-z0-9/._-]+\.(jpg|jpeg|png|webp|mp4)"' src | tr -d '"' | sort -u \
      | while read -r r; do [ -f "public$r" ] || echo "MANQUANT: $r"; done

`experience.ts` a été livré sans ses images : **36 visuels cassés en
production** pendant trois déploiements.

## 4. Correspondance exercice ↔ média : pièges connus

Le motif doit être une **sous-chaîne** du nom normalisé de la fiche.

- **Parenthèses** : la fiche « Développé couché (barre) » ne contient pas
  « developpe couche barre ». Reprendre les parenthèses dans le motif.
- **Apostrophes** : les fiches utilisent l'apostrophe typographique `’`
  (U+2019), les motifs l'apostrophe droite `'`. La normalisation les ramène
  désormais à `'` — ne pas défaire ce traitement.
- **Ordre** : un motif générique placé avant un motif spécifique capture la
  mauvaise fiche. « dips » doit rester **après** « dips sur banc ».
- Après tout ajout, tester les fiches voisines pour vérifier qu'aucune n'a
  été détournée.

## 5. Jamais d'association approximative

Une vidéo n'est reliée qu'au mouvement qu'elle montre **réellement**.

- Un plan incliné à la barre ne va pas sur une fiche « machine ».
- Un fichier mal nommé n'est pas une source fiable : `press machin incliné`
  montrait en réalité une **presse à cuisses**.
- Dans un lot de rushes, les suffixes ` 2`, ` 3` ne sont **pas** des
  doublons : `IMG_4060` contenait un rowing, des fentes bulgares, un
  step-up et des pompes inclinées. Examiner **chaque prise**.

## 6. Ne pas réintroduire ce qui a été supprimé

Les animations 3D (`animations.ts`, `exercice-animation.tsx`,
`public/animations/`) ont été retirées volontairement au profit des vidéos
réelles. Elles sont revenues une fois par récupération de branche.

## 7. Ne pas publier de contenu non validé

Le contenu éditorial généré porte un badge « À valider ». Ce badge est
**rendu sur la carte programme** : il serait visible publiquement. Le retirer
uniquement quand Anthony a relu, jamais avant.

## 8. Vérifications avant tout commit

    npx tsc --noEmit
    npx next lint
    npx next build      # avec DATABASE_URL/DIRECT_URL factices en local
    # + l'audit d'images du point 3

## 9. Décisions qui reviennent à Anthony

Ne pas trancher seul : modèle économique (abonnement vs vente à l'unité),
verrouillage de fonctions existantes, migrations Prisma en production,
mise en ligne d'un tunnel de paiement, contenu éditorial non relu.

## État au 01/09/2026

- 77 fiches exercices, 59 avec vidéo, 54 entièrement filmées
- 164 recettes, 163 visuels
- 12 programmes, dont 10 enrichis (progression, nutrition, récupération)
- Reste sur `codex/recettes-et-avancees-v4` : 6 programmes rentrée,
  67 fichiers de code modifiés (dont le catalogue programmes, en conflit)
- Manque à tourner : 18 vidéos, dont 5 élastique et 2 mollets machine
  (aucun plan existant), et 3 photos
