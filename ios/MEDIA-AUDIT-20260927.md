# Médias — correction locale du 27 septembre

## Rowing haltère unilatéral

Inspection de `public/videos/exercices/rowing-haltere-unilateral.mp4` par
images à plusieurs instants : une main sur support, deux pieds au sol.
L'illustration `public/exercices/rowing-haltere-unilateral-homme-arabe.jpg`
et la consigne du catalogue demandent un genou sur banc.

L'association vidéo a donc été retirée, sans effacer les médias ni réécrire
les programmes enregistrés. Les alias anglais et les noms enrichis sont
refusés pour empêcher un repli vers le rowing bilatéral. Ne pas réintroduire
le clip sur cette fiche sans harmoniser réellement mouvement, photo et consigne.

## Vérifications

- `test-exercise-media.cjs` : six noms refusés ; rowing bilatéral et Arnold
  préservés ; filtrage réel séance/export exclut le rowing et conserve la
  planche ; programme source inchangé.
- `test-training-owned-media.cjs` : rendu entraînement sans photo stock et
  exécution du contrôle des trois pages piliers. Ancienne assertion textuelle
  devenue obsolète remplacée par le test comportemental existant.
- Tests anciens programmes, fiches, lancement, partage et socles Full Body : PASS.
- Typage, lint sans erreur (six avertissements existants), build web : PASS.
- 356 références de fichiers présentes. Cela ne valide pas leur contenu.
- Audit bibliothèque : toujours 4/90 variantes complètes, 86 incomplètes et
  388 occurrences en défaut. La correction ne résout pas les sept autres
  mouvements manquants et ne constitue pas une validation de la bibliothèque.

Logs : `/tmp/coai-rowing-type-0927.log`, `/tmp/coai-rowing-lint-0927.log`,
`/tmp/coai-rowing-build-0927.log`.

État : correction locale, aucun push/déploiement. Production et rendu natif du
nouveau build non validés. Le build utilise des paramètres locaux factices ;
ne pas le confondre avec le build connecté aux fixtures d'authentification.

### Contrôle natif connecté ultérieur — 22 h 39

Build reconstruit avec l'authentification locale de test. Le nouveau test
`testLocalExerciseCatalogueRejectsMismatchedRowing` passe sur iPhone SE simulé
en 24,9 secondes : navigation Explorer → catalogue, recherche du rowing,
compteur zéro et message vide, effacement, recherche de planche, compteur un.
Les compteurs sont vérifiés dans l'arbre d'accessibilité WebKit, pas déduits
de la simple présence du texte saisi. Le compteur React est désormais une
phrase unique au lieu de plusieurs fragments.

Trois essais préalables ont échoué dans le test : confusion entre texte saisi
et titre, compteur fragmenté, puis défilement d'un texte non interactif par le
helper générique. Ils ne sont pas comptés comme des succès.

Preuve : `Test-COAI-2026.09.27_22-38-48-+0200.xcresult` dans
`/tmp/coai-native-connected-0925/Logs/Test/`. Captures inspectées : la saisie
reste visible au-dessus du clavier ; les résultats sont plus bas, derrière
le long bloc de filtres. Leur accessibilité ne prouve pas une visibilité
immédiate : simplification de ce bloc encore à traiter.

Typage, lint et build connecté réussis. Compte jetable supprimé et sessions
révoquées. Aucun compte personnel, achat ni production affecté.

## Remplacements

Le dossier de préparation est dans le workspace, sous
`output/REMPLACEMENTS-EXERCICES-A-VALIDER.md`. Les candidats ne sont pas tous
intégrables : le développé couché demande confirmation de l'angle du banc,
et l'abduction attend le choix d'Anthony. Le détail du clip Arnold confirme
bien une rotation : ne pas le renommer développé militaire.
