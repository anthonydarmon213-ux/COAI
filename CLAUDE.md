# Notes stratégiques COAI

> **Règles de travail partagées avec Codex : voir [AGENTS.md](AGENTS.md).**
> Un seul clone, rien de non commité en fin de session, audit des images
> avant commit, aucune association média approximative.

## Direction visuelle et programmes rentables (24/08/2026)

Direction validée par Anthony : esthétique COAI premium sombre, pierre noire,
bois noyer, lumière architecturale ambre/or et touches cyan. Les modèles sont
des adultes athlétiques en tenue noire sobre. Pour aider chaque membre à se
projeter, produire autant que possible une version femme et une version homme
du même visuel, avec cadrage, exercice et décor identiques. La femme blonde et
l'homme blond déjà présents dans la médiathèque sont les références d'identité.
Ne pas régénérer un visuel qui existe déjà.

Récupération : les versions sauna et bain froid femme/homme sont intégrées dans
`public/recuperation/` et choisies selon le sexe déclaré du profil. Le bikini
deux-pièces a été refusé deux fois par le filtre de génération ; conserver la
version femme en maillot une pièce noir, crédible pour le sauna et le bain
froid. Le hammam femme blonde validé reste la référence esthétique.

Un programme statique « Spécial bureau — Bouger sans quitter sa chaise » a été
ajouté aux programmes prêts à l'emploi. Il cible le cœur de clientèle COAI
(dirigeants, indépendants et salariés longtemps assis), avec cinq micro-séances
hebdomadaires de 8 à 12 minutes, sans matériel, sans transpiration et sans appel
IA. Six mouvements fondamentaux disposent chacun d'une démonstration femme et
homme dans `public/programmes/`; la galerie choisit le modèle selon le profil.
Cette logique de catalogue déterministe doit rester prioritaire pour le
Pass IA afin de protéger la marge ; l'IA sur mesure est réservée aux profils
hors socle ou aux offres avec davantage d'accompagnement.

## Relais Codex — Yoga, Pilates et sauvegarde de la bibliothèque (24/08/2026)

Les 16 photos validées avec le modèle féminin blond (8 Yoga + 8 Pilates)
sont intégrées dans `public/exercices/` : JPEG 4:3 de 900 × 675 px, avec les
préfixes `yoga-` et `pilates-`. Le registre
`src/lib/exercices/photos-coai.ts` contient leurs correspondances, placées
avant les motifs génériques pour éviter notamment que « plank Pilates »
retombe sur la photo de gainage standard. Ne pas régénérer ces images.

La bibliothèque source complète (154 fichiers, environ 260 Mo) est conservée
hors du dépôt pour ne pas alourdir GitHub, dans :
`/Users/anthonydarmon/Documents/Codex/2026-08-21/j-x20/coai-bibliotheque-exercices-claude-code/`.
Elle regroupe notamment boxe/kickboxing, poids du corps, duo, récupération,
mobilité, Yoga et Pilates, avec les différents modèles validés. Utiliser ces
fichiers en priorité avant de générer un exercice déjà présent.

Ce fichier sert de mémoire persistante entre les sessions pour les idées et
décisions business d'Anthony (pas de la doc technique — voir README.md pour
ça). Il est lu automatiquement au démarrage de chaque session Claude Code.

## Pistes #1 et #4 — charge mentale du jour + synthèse vitalité (20/08/2026, suite)

Suite du brainstorm produit : Anthony a validé les versions allégées
proposées pour les pistes #1 (Real-Time Contextual Engine) et #4
(Gamification émotionnelle), déjà décrites dans la note précédente.

**Piste #1** : nouveau champ facultatif `chargeMentale` (LEGERE/NORMALE/
CHARGEE/SATUREE) sur le check-in quotidien (`DailySession.chargeMentale`,
migration additive `20260821120000_add_daily_charge_mentale`) — distinct
du sommeil/énergie déjà collectés : une journée peut être reposée mais
chargée de stress/imprévus, ce que ces deux champs seuls ne captent pas.
Nouvelle question "Comment se présente ta journée ? (facultatif)" ajoutée
dans `DailyExperience`, entre forme et sommeil.

Le moteur d'adaptation (`src/lib/daily/session.ts`, `adaptWorkout`) en
tient compte à deux niveaux : une charge "CHARGEE" réduit légèrement le
volume (même mécanisme que sommeil/énergie faibles) ; une charge
"SATUREE" transforme entièrement la séance en mobilité douce + respiration
dirigée plutôt que de simplement réduire l'effort prévu — reprend
directement l'exemple donné par Anthony ("on transforme cette séance en
mouvement doux... pour purger le cortisol, sans baisser ton sentiment
d'accomplissement"). Priorité juste après la douleur (toujours prioritaire
sur tout le reste). Au passage, les textes d'explication existants
(`reason`) ont été réécrits dans un ton plus humain/moins clinique
("Ton programme d'origine, lui, reste intact" plutôt qu'une liste sèche de
conditions).

**Piste #4** : nouveau champ `synthese` sur `AgeCoaiResultat`
(`src/lib/insight/age-coai.ts`) — une phrase par niveau
(SYNTHESE_PAR_NIVEAU, même pattern que `RECOMMANDATIONS_PAR_NIVEAU` de
`score-sommeil.ts`), dérivée strictement du niveau déjà calculé, jamais
une donnée inventée. Affichée en tête de `ScoreAgeCoaiCard`, juste sous le
titre. Le libellé "Dosage" (composante du score, un peu clinique) renommé
à l'affichage en "Équilibre de l'effort" — même valeur réelle, vocabulaire
plus proche de vitalité/résilience que d'un jargon d'entraînement.

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels sur
tous les fichiers touchés, propres. Montage isolé (Playwright, mobile
390px et desktop 1440px) de `ScoreAgeCoaiCard` avec données simulées :
aucune erreur console, aucun débordement, contenu/texte confirmés corrects
(synthèse affichée, libellé renommé) — le CSS ne s'est pas chargé sur ce
test précis (même souci d'environnement de serveur de dev déjà rencontré
dans cette session, pas un problème du code livré). **Non vérifié**
(comme toujours) : le comportement réel avec un vrai check-in et un vrai
programme — ce sandbox n'a pas d'accès Supabase en conditions réelles. À
tester par Anthony : renseigner "Saturée" un jour d'entraînement et
vérifier que la séance devient bien mobilité/respiration ; vérifier le
rendu visuel de la nouvelle phrase de synthèse sur le dashboard.

## Piste #3 "Hybrid Human-AI Mirror" — escalade humaine sur baisse de motivation (20/08/2026, suite)

Suite d'un brainstorm produit d'Anthony (4 pistes d'innovation façon
"real-time contextual engine", "reverse burnout shield", "hybrid human-AI
mirror", "gamification émotionnelle"). Triage fait avant de coder : la
piste #2 (analyse vidéo de la vitesse de mouvement via la caméra) n'est pas
réaliste depuis ce sandbox — un vrai projet de computer vision/tracking de
pose, pas un simple appel IA, communiqué clairement à Anthony plutôt que de
prétendre s'en approcher. Anthony a choisi de démarrer par la #3 : l'IA
gère le quotidien, mais escalade les vrais blocages psychologiques à un
humain plutôt que de répondre par un message générique.

**Nouveau flag `"motivation"`** (`src/lib/admin/flags.ts`) — même famille
que les flags douleur/inactivité/mesure/régression déjà en place (repris
tels quels, réutilisés partout où `computeFlags`/`FLAG_LABELS` sont déjà
branchés : `/admin`, `/admin/suivi`, `/admin/clients/[id]`, aucune
modification UI nécessaire, tout est déjà dynamique). Détection basée sur
`WeeklyCheckin.motivation` (1-5, déjà collecté chaque semaine, donnée
réelle auto-déclarée par l'abonné — jamais déduite d'un pattern
d'inactivité, qui a déjà son propre flag distinct) : baisse sur au moins 2
check-ins hebdomadaires consécutifs ET valeur repassée à 2/5 ou moins —
jamais un seul chiffre bas isolé (une semaine difficile arrive à tout le
monde). Logique extraite dans `detecterBaisseMotivation()`, fonction pure
exportée et réutilisée à l'identique par `computeFlags` (interactif, côté
espace coach) et par la nouvelle alerte automatique ci-dessous — une seule
règle, jamais deux logiques divergentes.

**Escalade automatique** (`alerterMotivationEnBaisse`, nouveau, dans le
cron quotidien `relance-inactifs` déjà existant) — réservée à Transformation
(seul palier avec une vraie relation coach humain ; Impulsion est 100% IA
sans validation humaine, escalader n'y aurait aucun sens produit).
Contrairement à `alerterDouleurImpulsion` (qui envoie aussi un email
automatique à l'abonné), **aucun message automatique n'est envoyé à
l'abonné ici** — décision volontaire, cohérente avec l'esprit de la piste
#3 ("l'IA détecte, l'humain répond vraiment") : seule une notification à
Anthony part, avec le lien WhatsApp déjà prêt (réutilise
`buildWhatsAppContactLink`, message chaleureux et personnel, pas une
question fermée sur des chiffres) pour qu'il envoie lui-même un vrai
message, à sa façon. Dédoublonnage sur `User.derniereAlerteMotivationEnvoyeeAt`
(nouveau champ, migration `20260820120000_add_derniere_alerte_motivation`,
additive) comparé à la date du check-in déclencheur — ne re-notifie que
si une nouvelle semaine en baisse apparaît, jamais de spam quotidien tant
que rien ne change.

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels sur
tous les fichiers touchés, propres. Logique de détection relue à la main
(seuils, dédoublonnage, priorité de file coach). **Non vérifié** (comme
toujours) : le comportement réel avec de vraies données — ce sandbox n'a
pas d'accès à Supabase/aux crons Vercel en conditions réelles. À tester
par Anthony une fois déployé : renseigner 2-3 semaines de motivation en
baisse pour un compte Transformation test, vérifier que le badge apparaît
sur `/admin` et `/admin/clients/[id]`, et que la notification + le lien
WhatsApp arrivent au prochain passage du cron quotidien.

**Pistes #1 et #4** restent des versions allégées possibles plus tard (un
check-in enrichi + un ton d'adaptation moins clinique pour #1 ; une
reformulation des cartes existantes — Score COAI, Age COAI — vers un
vocabulaire vitalité/résilience plutôt que calories pour #4) — pas encore
demandées par Anthony, pas commencées.

## Retours d'une amie testeuse : 6 points traités (20/08/2026)

Retour vocal d'Anthony transmettant les retours d'une amie ayant testé le
site en conditions réelles. 6 points, traités un par un :

1. **"Voir les formules" absent à la sortie du résultat de diagnostic** —
   confirmé en lisant le code : le seul lien vers les tarifs
   ("Comparer les 3 formules") vivait dans `FormuleRecommandeeCard`, en plein
   milieu de l'écran de résultat — rien à la toute fin, où l'amie d'Anthony
   cherchait visiblement à comparer les offres. Ajouté un lien "Voir les
   formules →" juste avant le tout dernier bloc (`diagnostic-quiz.tsx`),
   pour les deux variantes (visiteur connecté et non connecté).

2. **Bibliothèque de récupération** ("des programmes, des conseils pour
   mieux dormir, mieux respirer, une méditation, sauna/hammam/massage avec
   le process exact") — 4 nouvelles entrées ajoutées à la bibliothèque de
   programmes prêts à l'emploi existante (`src/lib/programmes-prets/
   catalogue.ts`, nouvelle catégorie `RECUPERATION`) : "Sommeil réparateur"
   (14 jours, une habitude par jour), "Respiration & anti-stress" (4
   techniques : diaphragmatique, cohérence cardiaque, 4-7-8, box breathing),
   "Méditation guidée" (7 jours, sans application ni matériel), et
   "Récupération passive — Sauna, hammam & massage" (4 vrais protocoles :
   durée, cycles, hydratation, contre-indications explicites — jamais juste
   "va transpirer"). Lien "Sommeil, respiration, méditation, sauna & massage
   →" ajouté sur le pilier Récupération (`pilier-page.tsx`), même
   emplacement que le lien recettes déjà existant sur Nutrition.

3. **Photo de plat → macros/calories par IA** (nouvelle fonctionnalité,
   jamais demandée avant) — même famille que l'analyse de photo
   morphologique et l'extraction de montre connectée déjà existantes
   (`generateWithVision`, aucune nouvelle dépendance) : nouveau prompt
   (`src/lib/ai/prompts/meal-photo-extraction.ts`, garde-fous stricts —
   estimation prudente, jamais une valeur affirmée comme exacte, refuse
   explicitement toute photo qui n'est pas un plat), nouvelle route
   `POST /api/nutrition/photo-repas`, nouveau composant
   `AnalysePhotoRepas` affiché sur le pilier Nutrition. **Décision
   volontaire pour rester simple en V1** : rien n'est enregistré en base
   (ni `RepasLog`, ni nouveau champ) — c'est une estimation ponctuelle à la
   demande, distincte du suivi repas existant. Capture directe via l'appareil
   photo sur mobile (`capture="environment"`).

4. **Bug corrigé : partage du score par email sans pièce jointe** — un lien
   `mailto:` ne peut techniquement joindre aucun fichier (limite du
   protocole, pas un bug de COAI) — la carte-image du score n'était donc
   jamais insérée, seulement le texte, d'où la confusion de l'amie
   d'Anthony ("ça ne l'a pas inséré en pièce jointe, c'était compliqué").
   Corrigé (`diagnostic-share-button.tsx`) : le bouton email tente
   maintenant `navigator.share` avec le fichier image (même mécanisme déjà
   utilisé pour Instagram/TikTok juste au-dessus) — ça ouvre la vraie
   feuille de partage du système, qui permet de choisir Mail et insère
   l'image comme une vraie pièce jointe. Si l'appareil ne supporte pas le
   partage de fichier, repli sur le comportement précédent (mailto: texte
   seul) mais avec la carte téléchargée en plus, pour qu'elle puisse être
   jointe manuellement plutôt que perdue silencieusement.

5. **Vidéos dans la bibliothèque (exercices, recettes)** — demande notée
   mais **non réalisée**, même blocage déjà documenté ailleurs dans ce
   fichier (patch "Direction wow façon Apple Watch/Whoop") : ce sandbox n'a
   aucun outil de génération vidéo IA et aucun accès réseau vers une
   banque de vidéos sous licence. Nécessite une décision d'Anthony sur une
   source vidéo (licence à vérifier), comme cela avait déjà été le cas pour
   les photos avant que la clé Pexels ne soit fournie.

6. **Offre membre fondateur réduite de 100 à 50 places** — demande directe
   d'Anthony ("100 personnes ça fait beaucoup, réduisons à 50") :
   `MEMBRES_FONDATEURS_MAX` passé de 100 à 50
   (`membre-fondateur-constants.ts`). Le compteur affiché reste calculé en
   temps réel à partir du nombre réel d'abonnés Impulsion — jamais un
   chiffre fixe codé en dur (Anthony avait suggéré "39 places" comme
   exemple, pas une valeur à figer).

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels sur
tous les fichiers touchés, propres. Playwright réel (mobile 390px) sur un
montage isolé de `ProgrammesPretsGrid` (les 4 nouvelles entrées Récupération
s'affichent et se filtrent correctement, aucun débordement) et
`AnalysePhotoRepas` (rendu sans erreur console). **Non vérifié** : le
comportement réel de l'upload photo→macros et du partage email par
`navigator.share` — ce sandbox n'a ni compte authentifié réel ni accès à
l'API Anthropic/Supabase en conditions réelles, et le serveur de dev local a
rencontré un problème d'environnement inhabituel (classe Tailwind `hidden`
absente du CSS servi, y compris sur des pages déjà en prod — signal d'un
souci de ce serveur de dev précis, pas du code livré, `tsc`/`build`/`eslint`
tous propres par ailleurs) qui a empêché une vérification pixel du bouton
photo caché. À tester par Anthony : upload d'une vraie photo de plat, et un
vrai partage email sur mobile (iOS/Android) une fois déployé.


## Bug corrigé : écran noir au clic "Voir en détail" depuis le résultat du diagnostic (20/08/2026, suite)

Signalé par Anthony : une amie a fait le diagnostic, cliqué sur "Voir
Impulsion en détail" et vu un écran noir à la place de la modale d'offre.

**Cause réelle trouvée et reproduite** (Playwright, avant/après correctif,
avec et sans le fix) : `ServiceDetailModal` est une modale plein écran
`position: fixed inset-0`, ouverte depuis `FormuleRecommandeeCard` sur
l'écran de résultat du diagnostic — qui est rendu à l'intérieur du
conteneur `.coai-diagnostic-card` (`diagnostic-quiz.tsx`). Ce conteneur a
`backdrop-filter: blur(24px)` **et** `overflow-hidden`. Par la spécification
CSS, un `backdrop-filter` sur un ancêtre crée un nouveau "containing block"
pour les descendants en `position: fixed` — la modale se retrouvait donc
piégée et rognée dans le petit cadre arrondi de la carte diagnostic au lieu
de couvrir tout l'écran, avec son fond quasi noir (`#0d0e10`) qui donnait
l'impression d'un écran noir cassé, le prix et le bouton d'achat coupés
hors du cadre visible.

**Corrigé** en rendant `ServiceDetailModal` via un portail React
(`createPortal` vers `document.body`, monté seulement après le premier
rendu client — `document` n'existe pas côté serveur) plutôt qu'en JSX
imbriqué directement dans l'arbre appelant. Corrige le problème à la
racine pour tous les points d'entrée de cette modale (résultat du
diagnostic, `BesoinsIdentifiesCard`/dashboard, `/pricing`...), pas
seulement l'écran du diagnostic — n'importe quel futur ancêtre avec
`backdrop-filter`/`transform`/`filter` aurait causé le même bug ailleurs.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres. Bug
reproduit puis corrigé en conditions contrôlées (Playwright, composant
monté dans un conteneur reproduisant exactement `.coai-diagnostic-card`) :
capture avant correctif confirmant le rectangle noir tronqué décrit par
l'amie d'Anthony, capture après confirmant la modale pleine page correcte
avec prix et bouton d'achat visibles.

## Titre du hero ajusté : "Ton Personal Trainer, toujours avec toi." (20/08/2026, suite)

Retour immédiat d'Anthony après la réécriture du hero ci-dessous : il
préférait le titre "Ton Personal Trainer, toujours avec toi" (déjà la
formule utilisée dans le `<title>`/meta de la page depuis un moment,
jamais reprise dans le H1 visible du hero jusqu'ici). Titre remplacé en
conséquence ; la promesse "Ton programme évolue avec toi" n'est pas
perdue — déplacée en ouverture du sous-titre plutôt qu'en H1, donc
toujours portée dès la première ligne de texte lue après le titre.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
Playwright réel en 390px : aucun débordement, texte lisible.

## Hero de la homepage recentré sur "Ton programme évolue avec toi" (20/08/2026)

Anthony a formalisé une liste de points forts COAI (coach quotidien
"Aujourd'hui", séance adaptée au jour J, IA explicable, coach IA pendant la
séance, validation humaine selon la formule...) et une formule de
positionnement : « COAI est le coaching qui évolue avec toi : l'IA
personnalise ton accompagnement au quotidien, avec l'humain disponible
quand tu en as besoin. » Question posée sur ce qu'il voulait en faire —
sans réponse ("dismissed") — puis question directe d'Anthony sur le
contenu actuel du hero, qui a révélé un vrai décalage : le hero
(`CoaiIntro`) menait encore avec "Le premier studio de Personal Training
augmenté" (positionnement protocole/produit), alors que la promesse
"Ton programme évolue avec toi" n'apparaissait que plus bas sur la page.
Anthony a validé la réécriture du hero pour refléter ce nouveau
positionnement.

`src/components/marketing/coai-intro.tsx` : titre devient "Ton programme
évolue avec toi.", sous-titre reprend directement la formule d'Anthony
(IA qui personnalise au quotidien entraînement/nutrition/récupération,
ajustée au sommeil/énergie/temps disponible ; humain disponible en
soutien). Les 4 bullets remplacés pour porter les points forts les plus
distinctifs de sa liste plutôt que des bénéfices génériques déjà redondants
avec le sous-titre : coach quotidien "Aujourd'hui", IA explicable, Coach IA
disponible pendant la séance, validation humaine selon la formule. Kicker
crédibilité (17 ans d'expérience), CTA et micro-copy inchangés — seuls le
titre/sous-titre/bullets ont changé, scope volontairement limité à ce que
Anthony a validé (pas touché aux autres taglines du site — "Personal
Training, Reimagined" dans la nav/pricing/meta description — qui sont des
éléments de marque distincts, pas le hero lui-même).

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
Playwright réel (navigateur local, serveur de dev local) en 390px et
1440px : aucun débordement, texte lisible, mise en page intacte des deux
côtés. Reste à confirmer par Anthony sur le site déployé.

## Bug visuel homepage — titre chevauchant la photo sur mobile (19/08/2026, suite)

Anthony a envoyé une capture réelle de coai.fr mobile avec « Arrange ça ! » —
la section photo "Aujourd'hui n'est jamais une journée standard." (juste
après les 3 piliers, `(marketing)/page.tsx`) était en `aspect-[16/9]` sur
tous les écrans : sur mobile (390px de large), ça ne laisse qu'environ 220px
de haut pour la photo, largement insuffisant pour le label + le titre sur 2
lignes + le paragraphe overlay posés en bas du cadre (`justify-end`) — le
texte débordait et se chevauchait visuellement avec la photo.

Corrigé par un cadre plus haut sur mobile (`aspect-[4/5] sm:aspect-[16/9]`,
cinématique 16/9 conservé à partir de `sm:`), texte replacé en bas sur toute
la largeur sur mobile (`inset-x-0 bottom-0`, au lieu d'un bandeau à gauche
pensé pour un cadre large) avec un dégradé vertical plutôt qu'horizontal en
dessous de `sm:`, et titre ramené à `text-2xl` sur mobile (`text-3xl` était
lui-même une partie du problème, trop grand pour le nouvel espace même
élargi).

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
Playwright réel (navigateur local Chromium, serveur de dev local — pas
d'accès réseau à coai.fr depuis ce sandbox) en 390px et 1440px : sur mobile,
le titre et le paragraphe tiennent maintenant proprement dans le cadre sans
chevaucher la photo ; aucune régression desktop (toujours 16/9, texte à
gauche comme avant). Reste à confirmer par Anthony sur le site déployé.

## Bibliothèque de programmes prêts à l'emploi + page challenge 30 jours (19/08/2026, suite)

Reprise du chantier laissé en attente depuis le début de la session
("mettre en place des programmes spécifiques type mobilité, cardio
semi-marathon/Hyrox, perte de poids, poids du corps, spécial fessiers,
challenge 30 jours"). Le point bloquant identifié plus tôt (comment ces
templates s'articulent avec la génération IA) est tranché en reprenant
exactement le principe déjà validé pour le catalogue d'exercices et les
recettes : une bibliothèque **additive**, jamais bloquante ni en
remplacement du programme personnalisé généré par IA.

**7 programmes rédigés** (`src/lib/programmes-prets/catalogue.ts`) :
mobilité (4 sem.), prépa semi-marathon (8 sem.), prépa Hyrox (6 sem.),
perte de poids (6 sem.), 100% poids du corps (4 sem.), spécial fessiers
(4 sem., élargi vers un public féminin comme demandé), et un challenge
30 jours (un défi concis par jour, mêlant mouvement/nutrition/
récupération/mental — pas un programme d'entraînement classique, un
outil de régularité). Nouvelle page `/programme/programmes-prets`
(même gabarit que `/programme/exercices`/`/programme/recettes` :
filtrable par catégorie, photo Pexels, détail replié dans un
`<details>`), lien ajouté au menu "Mon programme".

**Page publique dédiée au challenge** (`/challenge-30-jours`, demande
directe d'Anthony — "pour faire une pub pour les réseaux") : les 30
jours affichés publiquement, sans compte requis, réutilise le contenu
déjà rédigé (jamais dupliqué). Récompense de fin de challenge honnête,
construite avec ce qui existe déjà — bilan gratuit + offre membre
fondateur (`MembreFondateurBadge` réutilisé tel quel) — plutôt qu'un
nouveau mécanisme de récompense inventé pour l'occasion. Ajoutée au
sitemap, au footer et au maillage interne SEO.

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels,
propres. **Non vérifié** (comme toujours) : rendu visuel réel — premier
jet de contenu à relire par Anthony avant mise en avant massive, même
mise en garde que pour le catalogue d'exercices.

## Offre "membre fondateur" — Impulsion 49€/mois bloqué à vie (19/08/2026, suite)

Suite de l'audit conversion : Anthony a tranché "impulsion 49 euros a
vie" puis confirmé l'intention ("faisons une belle promotion pour avoir
des premiers abonnements et des premiers testeurs, il nous faut
vraiment de la data et des retours clients").

**Constat avant de coder** : Impulsion est déjà à 49€/mois — aucun
changement de prix Stripe nécessaire. Un Price Stripe est immuable :
tout abonné actuel garde déjà nativement son prix, même si Anthony
augmente le tarif plus tard (en créant un nouveau Price pour les
nouveaux abonnés plutôt qu'en modifiant celui-ci, techniquement
impossible de toute façon). Le "blocage à vie" n'a donc rien demandé de
neuf côté paiement — uniquement une mise en avant marketing avec un
vrai compteur, jamais un chiffre inventé pour créer une fausse urgence.

**Nouveau moteur** (`src/lib/pricing/membre-fondateur.ts`) : compte réel
des abonnements Impulsion déjà souscrits (`Subscription.count`, plan
GRATUIT), plafonné à 100 places. Route publique `GET /api/membres-
fondateurs` (aucune auth requise, info marketing), consommée par le
nouveau `MembreFondateurBadge` (client, n'affiche rien tant que le
compte n'est pas connu, et rien du tout une fois les 100 places prises
— jamais un compteur figé à zéro qui resterait affiché indéfiniment).

**Nouveau champ `Tier.founderOffer`** (`tiers.ts`), posé uniquement sur
Impulsion, affiché aux 3 points d'achat existants sans dupliquer la
logique : `/pricing`, `ServiceDetailModal` (paywall plein écran) et
`FormuleRecommandeeCard` (résultat du diagnostic public).

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels,
propres. **Non vérifié cette fois** (au-delà des limites habituelles de
ce sandbox) : le rendu visuel réel du badge — plusieurs tentatives de
vérification par navigateur local ont échoué à cause d'un serveur de
dev instable (désynchronisation de cache Next.js après plusieurs
redémarrages rapprochés), pas un signal de bug dans le code lui-même
(logique relue à la main, `tsc`/`build`/`eslint` propres). À vérifier
par Anthony en conditions réelles : le badge apparaît bien sur les 3
emplacements et affiche un compte cohérent avec le nombre réel
d'abonnés Impulsion.

## Audit conversion + 5 pages SEO, suite à un brief acquisition (19/08/2026, suite)

Anthony a demandé "je veux des visiteurs qui fassent notre bilan et des
abonnements" puis, sur question posée (je ne peux générer aucun trafic
depuis ce sandbox — pas de pub, pas de réseaux sociaux, pas d'accès
internet réel), a choisi : **optimiser la conversion du funnel
existant**. Il a ensuite collé un brief détaillé (inspiration MyFitCoach/
Whoop/Apple Watch/Strava, offre "membre fondateur", alerte SEO sur la
concurrence du nom COAI avec un token crypto ChainOpera AI, plan 30
jours). Triage fait avant de coder : beaucoup de ce brief existe déjà
(bilan gratuit, essai 7 jours, abonnement sans engagement, suivi funnel
GA4+UTM, aperçu programme + explication + 3 actions sur le résultat) —
pas dupliqué. Deux choses vraiment actionnables sans décision business
supplémentaire :

**CTA remonté sur le résultat du diagnostic** — audit du code (pas de
données live, ce sandbox n'a pas accès à GA4/Supabase) : l'écran de
résultat avait accumulé ~9 sections au fil des sessions précédentes
avant que `FormuleRecommandeeCard` (le seul vrai point de conversion)
n'apparaisse enfin, tout en bas. Déplacée juste après le bloc problème/
solution ("voici tes points faibles → voici la solution"), le pic
émotionnel naturel de la page, plutôt qu'après tout le contenu éducatif
qui suit. Rien retiré, juste réordonné.

**5 nouvelles pages SEO** — `/bilan-forme-gratuit`, `/coach-sportif-ia`,
`/coach-sante-dirigeant`, `/programme-sport-entrepreneur`,
`/ameliorer-energie-au-travail` — même gabarit que les pages SEO
existantes, prix repris tels quels de `src/lib/pricing/tiers.ts` (jamais
dupliqués à la main). Répond au signal SEO d'Anthony (le nom "COAI" seul
est concurrencé sur Google par un token crypto) en ciblant des
expressions descriptives plutôt que la marque seule.

**Laissé en attente, décision business requise avant de coder** :
l'offre "membre fondateur" (tarif bloqué à vie pour les 100 premiers —
un engagement durable, j'ai demandé le prix exact et la formule
concernée avant d'y toucher) et la refonte des scores façon Whoop
(énergie/récupération/régularité) — recoupe en partie l'existant
(jauges Sommeil/Motivation/Douleur), pas encore retranché avec Anthony.

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels sur
tous les fichiers touchés, propres.

## Photo hero par jour + refonte visuelle nutrition, sur les 3 piliers (19/08/2026, suite)

Suite directe de l'ajout des photos Pexels par exercice. Question
exploratoire posée à Anthony ("est-ce qu'on peut améliorer encore notre
programme, les rendre plus attractifs?") — proposé une photo "hero" en
tête de chaque séance/jour plutôt qu'un nouveau chantier au hasard.
Anthony a validé puis étendu deux fois pendant que je codais : "idem sur
la récup et l'alimentation", puis "améliore la mise en page aussi".

**Photo hero par jour, sur les 3 piliers** : chaque séance/jour généré
a désormais sa propre photo d'ambiance en tête de contenu —
`photoQuerySeance` (entraînement) / `photoQueryJour` (nutrition,
récupération), un champ de plus généré par l'IA elle-même dans le même
appel JSON que le reste (aucun appel IA supplémentaire), distinct des
photos par exercice/repas déjà en place. `pilier-page.tsx` : la
résolution Pexels (jusque-là câblée uniquement pour l'entraînement) est
généralisée aux 3 piliers via un extracteur générique qui parcourt tout
le JSON du programme à la recherche des clés `photoQuery`/
`photoQuerySeance`/`photoQueryJour`, plutôt qu'un extracteur par pilier
— même garde-fou partout (clé absente/échec Pexels → aucune image,
jamais de photo cassée ni inventée).

**Refonte visuelle nutrition** ("améliore la mise en page") : chaque
repas généré avait son propre `photoQuery` déjà prévu pour ce chantier,
mais restait affiché via `JsonView` — un dump clé/valeur générique,
nettement moins soigné que les exercices (`ExerciceCard`, avec photo/
readout, depuis un chantier précédent). Nouvelle `RepasCard` (même
langage visuel qu'`ExerciceCard` : photo, type de repas, nom, quantité)
qui remplace ce dump pour chaque repas.

**Garde-fou d'affichage** : les 3 clés internes (`photoQuery`/
`photoQuerySeance`/`photoQueryJour`) sont désormais explicitement
exclues de tout affichage brut clé/valeur dans `JsonView` — déjà
destructurées hors des vues dédiées (Entraînement/Nutrition/
Récupération), ce filtre est un filet de sécurité pour les cas de repli
(JSON mal formé, champs résiduels non couverts).

**Vérifié** : `npx tsc --noEmit`, `npx next build` et `eslint` réels sur
les fichiers touchés, propres. **Non vérifié** (comme toujours) : rendu
visuel réel — mêmes limites que l'ajout des photos par exercice, et même
mise en garde : uniquement les **nouveaux** programmes générés après ce
déploiement auront ces photos (les programmes déjà en base sont figés
sans ces champs).

## Photos Pexels sur les exercices du programme généré (19/08/2026, suite)

Suite directe du retour "je ne vois pas les photos et vidéos dans les
programmes d'entraînements" : la vidéo existait déjà (bouton "▶
Technique" sur chaque exercice, aperçu YouTube intégré en recherche —
ajouté le 14/08/2026) mais repliée par défaut, donc facile à manquer ;
la photo, elle, n'existait vraiment nulle part sur le programme généré
(seuls le catalogue d'exercices statique et les recettes en avaient).

Le prompt de génération d'une séance (`programme-entrainement-
session.ts`) demande désormais à l'IA un champ `photoQuery` par
exercice (terme de recherche court en anglais, ex: "barbell bench
press") — jamais une traduction littérale du nom français, une vraie
requête de stock. Résolu en URL via `getStockPhotos()` (déjà existant,
`src/lib/media/pexels.ts`) une seule fois côté serveur dans
`pilier-page.tsx`, jamais depuis le client (clé API jamais exposée) —
même garde-fou que recettes/catalogue : `PEXELS_API_KEY` absente ou
requête en échec → aucune image affichée, jamais de photo cassée ni
inventée. `ExerciceCard` affiche la photo en tête de carte quand elle
est résolue.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme toujours) : rendu visuel réel des photos — ce
sandbox n'a pas accès à Supabase/Anthropic en conditions réelles pour
générer un vrai programme et vérifier le rendu. À tester par Anthony :
générer/régénérer un programme et vérifier que les photos apparaissent
sur les exercices (uniquement les nouveaux programmes générés après ce
déploiement — les programmes déjà générés avant n'ont pas de
`photoQuery` dans leur JSON figé, donc pas de photo tant qu'ils ne sont
pas régénérés).

## Check-in léger les jours de repos (19/08/2026, suite)

Retour d'Anthony sur le dashboard ("bilan hebdomadaire"/Score COAI) :
les jours sans séance, `/api/daily` refusait tout check-in (409 "jour de
repos"), donc aucune ligne `DailySession` n'était jamais créée ces
jours-là — le Score COAI comportemental (`age-coai.ts`, basé sur la
régularité des check-ins réels sur 90 jours) était mécaniquement pénalisé
par ce trou, sans rapport avec l'assiduité réelle de l'abonné.

`food`/`availableMinutes` passent en facultatifs dans le schéma zod
(rien à dimensionner sans séance) ; le garde-fou explicite qui existait
déjà pour `availableMinutes` sur la branche "jour d'entraînement" est
étendu à `food`, pour ne jamais perdre la vérification de complétude
côté formulaire complet (`DailyExperience`). Nouveau composant
`RestDayCheckin` (sommeil/énergie/douleur seulement, mêmes libellés que
`DailyExperience`), affiché sous le bloc "Journée de récupération" du
dashboard (`/dashboard`, déjà l'écran "Aujourd'hui").

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme toujours) : rendu visuel réel, ce sandbox n'a
qu'un navigateur local sans base de données réelle. À tester par
Anthony : remplir le check-in un jour de repos, vérifier qu'il ne
réapparaît pas après rechargement (même jour), et que la régularité du
Score COAI progresse avec.

## 3 corrections du diagnostic public (19/08/2026, suite)

Retours d'Anthony après test réel : (1) une lumière balayait en continu la
carte du diagnostic pendant tout le bilan, gênante dès la première
question — supprimée (`.coai-diagnostic-card::after`/`coai-card-scan`
dans `globals.css`). (2) Les écrans respirants "respire1"/"respire2"
avançaient seuls après 4,2s, alors que le texte affiché disait "Touche
l'écran pour continuer" — contradiction, pas le temps de lire. N'avancent
désormais que sur un vrai tap/clic, jamais automatiquement. (3) Les
étapes "sexe" et "profilPhysique" (âge/taille/poids) fusionnées en un
seul slide, déplacé en tête du quiz (avant "quotidien") plutôt qu'aux
2/3 — l'ancre du 2e écran respirant déplacée de "profilPhysique" vers
"frequence" pour rester à ~2/3 du parcours.

**Bug structurel trouvé et corrigé au passage** (en touchant ce code
pour la fusion) : l'étape "santeFeminine" (cycle menstruel/grossesse/
post-partum, ajoutée le 14/08/2026) avait son état/rendu/validation
entièrement câblés mais n'avait jamais été ajoutée à `QUESTION_STEPS` —
donc structurellement inatteignable pour qui que ce soit depuis sa
création, même en sélectionnant "Femme". Corrigé en l'ajoutant juste
après le nouveau slide fusionné.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme toujours, aucun navigateur/Supabase réel
accessible pour ce test précis) : rendu visuel réel des 3 corrections. À
tester par Anthony : absence de la lumière balayante, le nouveau
comportement tap-only des écrans respirants, le nouveau slide fusionné
en tête de quiz, et que "santeFeminine" apparaît bien après en
sélectionnant "Femme".

## Projection émotionnelle sur le résultat du diagnostic (19/08/2026, suite)

Retour d'Anthony sur une capture MyFitCoach montrant un graphique de
projection de poids dans le temps, lié à un événement précis ("est-ce
qu'il y a un event precis? une compte, un mariahe, pouvoir jouer avec mes
enfants, ettre plus performant aux travaille, ou avec mon partenaires").
Deux questions posées avant de coder — Anthony a choisi : **nouvelle
question dédiée dans le quiz** (pas de réutilisation d'un champ texte
libre existant) et **un vrai graphique projeté** (poids ou Score, pas
seulement une phrase descriptive).

**Nouvelle étape "declencheur"** dans `diagnostic-quiz.tsx`, juste après
l'échéance : 7 choix (mariage, vacances, compétition, performance au
travail, jouer avec ses enfants, se sentir bien avec son/sa partenaire,
"pas d'événement précis, juste pour moi") — filetée de bout en bout
(état, `canContinue`, sauvegarde/reprise de progression localStorage,
payload du lead email, `reponsesEnProfil()`). Jamais persistée sur
`Profile` (uniquement utile au moment du diagnostic, pas un champ de
profil durable).

**Nouveau moteur `construireProjection()`** (`src/lib/diagnostic/
projection-emotionnelle.ts`, aucun appel IA, même philosophie que le
reste de l'app) : deux branches selon l'objectif déclaré — poids (perte
de gras/prise de muscle, rythme prudent -0,45kg/semaine ou +0,22kg/
semaine, **plafonné à 10%/8% du poids de départ sur toute la période,
quelle que soit la durée choisie** — jamais un régime extrême même sur un
objectif à 12 mois) ou Score COAI déjà calculé par `indiceCoai` (tout
autre objectif — force, mobilité, reprise du sport... — jamais un poids
hors sujet par rapport à l'objectif réel). Toujours présentée comme une
estimation bornée avec disclaimer explicite affiché en permanence,
jamais une promesse de résultat.

**Nouvelle carte `ProjectionEmotionnelleCard`** — graphique SVG dessiné à
la main (même famille que `Sparkline`, aucune dépendance de charting
ajoutée), courbe avec dégradé, marqueur du point d'arrivée, titre adapté
à l'événement choisi ("Voici où tu peux être d'ici ton mariage" / "...
dans les 12 prochaines semaines" si aucun événement précis). Insérée sur
l'écran de résultat, juste avant l'aperçu Objectif/Rythme/Format/
Environnement.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme pour tout ce qui touche l'écran de résultat cette
semaine) : rendu visuel réel du graphique, ce sandbox n'a accès qu'à un
navigateur local sans base de données réelle. À tester par Anthony : les
7 choix d'événement, la bascule poids/Score selon l'objectif choisi, et
la lisibilité du graphique sur mobile.

## Test réel du site (browser local) + correction de restes clairs (19/08/2026, suite)

Anthony a demandé de tester le site en prod et de dire ce qui cloche.
**coai.fr reste injoignable depuis ce sandbox** (`curl` confirme un 403
sur le proxy sortant, comme documenté partout ailleurs dans ce fichier) —
mais découverte importante cette fois : **ce sandbox a bien un navigateur
local** (Chromium pré-installé, `/opt/pw-browsers`, `playwright` présent
dans `node_modules`), contrairement à ce que les sessions précédentes
supposaient à tort ("ce sandbox n'a pas de navigateur"). Utilisé pour
lancer un serveur de dev local (`npm run dev`) et naviguer avec
Playwright — teste le code tel qu'il est écrit, pas la vraie prod, mais
bien plus fiable qu'aucune vérification visuelle.

**Ce qui a pu être testé** : les pages 100% publiques/statiques (accueil,
`/pricing`, `/diagnostic` intro, `/sign-up`, `/vip`) — aucune erreur
console, aucun débordement horizontal, thème sombre confirmé propre sur
toutes. **Ce qui n'a pas pu être testé** : tout ce qui a besoin d'une
vraie session authentifiée ou d'une vraie base (dashboard, pilier
Récupération avec le nouveau Score sommeil, etc. — ce sandbox n'a
toujours aucun accès Supabase). Le parcours complet du quiz diagnostic
(15 questions) n'a pas pu être automatisé jusqu'au bout dans le temps
imparti (script de clic générique buté sur une étape à choix/case
spécifique) — pas une preuve de bug, juste une limite du script de test.

**Bugs réels trouvés et corrigés** (cf. commit dédié) : le grep fait sur
`globals.css` pour la bascule en thème sombre de la veille ne pouvait pas
voir les couleurs Tailwind écrites en dur directement en JSX
(`text-[#...]`/`bg-white`, valeurs arbitraires) — invisibles à un grep
sur le seul fichier CSS. Trouvés en testant réellement plusieurs pages :
- **`ServiceDetailModal`** (paywall plein écran, utilisé par tout le
  site — dashboard, `BesoinsIdentifiesCard`, et la nouvelle
  `FormuleRecommandeeCard` du diagnostic ajoutée aujourd'hui) : fond
  crème entier, jamais converti.
- **Sidebar de navigation** (`app-nav.tsx`) : le lien actif était en
  texte blanc sur fond blanc quasi opaque — totalement invisible, sur
  toutes les pages de l'app authentifiée. Bug le plus critique trouvé.
- **`DailyExperience`** (check-in quotidien, l'écran le plus vu de
  l'app) : toute la carte de check-in (5 questions) restée en clair.
- **`WeeklyCheckinCard`**, **`pricing/page.tsx`** (les 3 cartes "Choisir
  en 10 secondes"), **`profil-form.tsx`** (boutons upload bracelet/
  photo), **`dashboard-avatar.tsx`** (libellés du header dashboard),
  **`suivi/progression/page.tsx`**, **`AssessmentRow`** (diagnostic-quiz),
  **`MetricRing`** — même famille de bug à chaque fois.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Screenshot
Playwright de la section corrigée (`/pricing`, "Choisir en 10 secondes")
confirmant visuellement le fond sombre et le texte lisible.

**Reste probable** : d'autres restes clairs isolés du même genre
peuvent encore exister ailleurs (pages/composants non couverts par le
grep élargi fait cette session, ou jamais visités par les tests locaux)
— à signaler par Anthony au fil de l'eau s'il en repère.

## Score sommeil dédié dans le pilier Récupération (19/08/2026, suite)

Demande d'Anthony (message vocal retranscrit) : dans le pilier
Récupération, mettre en avant l'amélioration du sommeil avec de vraies
recommandations/conseils, et un "score sommeil" — "c'est vachement
important avec un score sommeil aussi".

**Constat avant de coder** : le pilier Récupération n'avait aucune UI
dédiée au sommeil — le conseil sommeil généré par l'IA pour chaque jour
(`jourData.sommeil`) était noyé dans un dump JSON générique au même titre
que n'importe quel autre champ. Aucun score sommeil n'existait nulle part
côté post-inscription ; le plus proche était le sous-score "récupération"
de `age-coai.ts` (Score & Âge COAI, dashboard), mais celui-ci **mélange
sommeil et énergie 50/50** pour nourrir le Score COAI global — jamais un
score sommeil isolé. Le prompt IA de récupération utilisait déjà
`Profile.qualiteSommeil` (réponse déclarative unique du diagnostic),
jamais l'historique réel `DailySession.sleep` (check-in quotidien).

**Nouveau moteur `calculerScoreSommeil()`** (`src/lib/insight/
score-sommeil.ts`, aucun appel IA, même philosophie que le reste de
l'app) : moyenne sur les 60 derniers jours de `DailySession.sleep` (même
barème de points que `age-coai.ts`, mais isolé — jamais mélangé à
l'énergie), niveau (À travailler/Correct/Bon/Excellent), tendance sur 7
jours vs les 7 précédents, et recommandations concrètes propres à chaque
niveau (horaire de coucher fixe, écrans coupés avant de dormir, caféine
après 14h, température de la chambre...). Gate de données minimum (3
nuits renseignées) — en dessous, retombe sur le conseil déclaratif du
diagnostic (`SOMMEIL_TIPS`, réutilisé tel quel depuis `mini-diagnostic.ts`
plutôt que dupliqué) pour ne jamais laisser la section vide pour un
nouvel abonné.

**Nouvelle carte `ScoreSommeilCard`**, même langage visuel que
`ScoreAgeCoaiCard` (`.coai-vitality-panel`/`-ring`) pour rester cohérent
avec le reste de l'app plutôt que d'inventer un nouveau style — affichée
en tête du pilier Récupération (`pilier-page.tsx`, requête `DailySession`
limitée au seul pilier Récupération, jamais chargée sur Entraînement/
Nutrition). Le conseil sommeil quotidien déjà généré par l'IA
(`RecuperationView`) reçoit aussi son propre encart visuel avec icône 🌙,
au lieu d'être indistinct des autres champs dans le dump JSON générique.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme toujours) : rendu visuel réel, ce sandbox n'a
toujours aucun navigateur. À tester par Anthony : le score une fois 3+
jours de sommeil renseignés en check-in quotidien, et l'état d'attente
avant ce seuil.

## Recommandation de formule sur le résultat du diagnostic public (19/08/2026, suite)

Suite directe de la note laissée dans le chantier dashboard précédent.
Demande d'Anthony (message vocal retranscrit, reformulé) : utiliser le
bilan initial pour proposer au prospect une solution concrète qui l'amène
à son objectif le plus vite/efficacement possible, en passant par la
bonne formule si besoin — rappel des 3 formules par Anthony : Impulsion
(IA seule), Transformation ("hybride", IA + regard humain), VIP (présentiel
Paris centre ou visio, budget/vitesse/retours personnalisés). Deux
questions posées avant de coder : emplacement (résultat du diagnostic
public, pas le dashboard — confirmé) et priorité (terminer d'abord le
chantier dashboard déjà en cours — confirmé).

**Constat de départ** : le résultat du diagnostic public montrait déjà un
aperçu du programme (entraînement/nutrition/récupération, blocs Objectif/
Rythme/Format/Environnement/Frein) mais **aucune recommandation de
formule** — le seul champ qui existait (`MiniDiagnostic.recommandation`,
binaire GRATUIT/STANDARD) n'était utilisé que dans l'email au lead, jamais
affiché à l'écran (confirmé par une exploration dédiée du code avant de
coder). Le champ `coachPreference` (choix fait à l'étape "coach" du quiz —
FULL_IA / HYBRIDE / VIP_PRESENTIEL, déjà collecté depuis le 16/08) n'était
lui non plus jamais utilisé pour le résultat.

**Nouveau moteur `recommanderFormule()`** (`src/lib/diagnostic/
mini-diagnostic.ts`) — miroir de `detecterBesoins()` (le moteur
post-inscription déjà existant, `src/lib/dashboard/besoins-identifies.ts`)
mais appliqué aux réponses brutes du quiz, avant tout compte créé. Retourne
une seule formule (pas une liste), par ordre de priorité : (1) choix
explicite VIP présentiel/visio → VIP ; (2) contrainte de santé signalée →
Transformation, **garde-fou sécurité qui prime sur n'importe quel choix
initial** (jamais un accompagnement 100% IA seul face à une contrainte
physique réelle, même si la personne avait coché "Impulsion") ; (3) choix
explicite hybride → Transformation ; (4) niveau avancé + objectif de
force/performance → VIP ; (5) plateau de progression qui dure (persona) →
Transformation ; (6) par défaut → Impulsion.

**Nouvelle carte `FormuleRecommandeeCard`** (`src/components/marketing/`),
insérée juste avant le CTA de fin de diagnostic (avant le bloc connecté/
non connecté) : nom de la formule, raison de la recommandation, 4
premières fonctionnalités, bouton "Voir en détail" qui ouvre
`ServiceDetailModal` (déjà utilisé côté dashboard — mêmes prix/
fonctionnalités que `/pricing`, jamais dupliqués), plus un lien "Comparer
les 3 formules". Fonctionne à l'identique pour un visiteur connecté ou
non — `SubscribeButton` (à l'intérieur du modal) gère déjà nativement le
cas non connecté (redirige vers `/sign-up?plan=...` avec le bon plan
préchargé), découvert en lisant le code existant avant d'écrire quoi que
ce soit de nouveau pour ce cas.

**Hydratation ajoutée** comme 4e "aperçu du programme" à côté
d'Entraînement/Nutrition/Récupération (`HYDRATATION_TIPS`, repère générique
de nutrition sportive par fréquence d'entraînement déclarée — jamais une
donnée personnalisée inventée, même principe que `SERIES_PAR_NIVEAU` déjà
existant).

**Cohérence email admin** : `/api/diagnostic-lead` calculait sa propre
recommandation ad-hoc pour la notification interne (à partir du seul
`coachPreference`, sans tenir compte de la contrainte santé ni du niveau)
— remplacée par `diagnostic.recommandation` du même moteur que celui
affiché au prospect, pour ne plus jamais avoir deux règles divergentes.

**Corrigé au passage** : la carte de fin de diagnostic pour un visiteur
non connecté ("Passe maintenant dans ton espace COAI") était restée sur un
fond clair avec du texte blanc depuis la veille — bascule dark theme
oubliée car hardcodée en JSX (invisible au grep fait sur `globals.css`
seul, même famille de bug que celui trouvé et corrigé sur le dashboard).

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme toujours) : rendu visuel réel, ce sandbox n'a
toujours aucun navigateur. À tester par Anthony : les 6 cas de
recommandation (au minimum vérifier VIP via le choix explicite à l'étape
coach, et Transformation via une contrainte santé cochée), le clic "Voir
en détail" en visiteur non connecté (doit ouvrir le modal puis rediriger
vers `/sign-up?plan=...` au clic sur le bouton d'achat), et la lisibilité
de la carte de fin de diagnostic sur fond sombre.

**Reste en attente, pas encore démarré** (demandes d'Anthony pendant ce
chantier, mises en queue) :
- Photos **et vidéos** directement sur les programmes d'entraînement
  générés (pas seulement le catalogue d'exercices, qui a déjà ses photos
  Pexels) — les vidéos nécessitent une source/licence à confirmer avec
  Anthony, pas faisable depuis ce sandbox sans décision de sa part.
- Bibliothèque de programmes prêts à l'emploi, distincte de la génération
  IA actuelle : mobilité, cardio orienté objectif (semi-marathon, Hyrox),
  perte de poids, poids du corps, spécial fessiers (élargi par Anthony
  vers un public féminin), et un "challenge 30 jours" pensé comme outil de
  motivation. Périmètre à caler avec Anthony avant de coder (comment ces
  templates s'articulent avec le programme généré dynamiquement — bloquent
  la génération ? viennent en plus ? remplacent un pilier ?).

## Dashboard "Aujourd'hui" guidé à chaque connexion + paywall (19/08/2026, suite)

Après la bascule en thème sombre, retour à une demande faite avant ce
chantier (mise en pause exprès pour ne pas construire sur l'ancien thème
clair) : rendre le dashboard plus pédagogue, avec un effet « wow » et un
paywall pour les comptes non payants. Deux questions posées avant de
coder — déclencheur du « wow » et cible du paywall — Anthony a choisi :
**à chaque connexion** (pas seulement une fois) et **tous les comptes
gratuits/non payants** (pas seulement Impulsion sans Transformation).

**Nouvelle carte `AujourdhuiGuideCard`**, affichée systématiquement en
tête de dashboard, juste après le header et avant `ScoreAgeCoaiCard` :
- Une « mission du jour » unique et claire, calculée côté serveur selon
  l'état réel de l'utilisateur (profil incomplet → programme à générer →
  check-in à faire → séance prête → jour de récupération) — reflète
  exactement le même état que la section détaillée plus bas dans la page,
  jamais une deuxième source de vérité.
- Le `CoaiInsight` déjà calculé (`getCoaiInsight`, aucune donnée
  inventée) mis en avant visuellement à côté de la mission — c'est le
  moment « wow » : jamais de statistique fabriquée pour faire
  impressionnant, seulement la même donnée réelle que la carte
  `CoaiInsightCard` affichait déjà plus bas (déplacée ici, retirée de son
  ancien emplacement pour ne jamais la dupliquer).
- Pour tout compte sans `hasProgrammeAccess` (ni Impulsion ni
  Transformation débloqués) : un bandeau avec CTA « Débloquer mon
  accompagnement » qui ouvre `ServiceDetailModal` (paywall façon app
  mobile déjà existant), pré-sélectionné sur le service recommandé par le
  moteur de besoins déjà en place (`detecterBesoins`/`besoins[0]?.service`,
  retombe sur `IMPULSION` si aucun besoin détecté).

L'ancien panneau générique « Choisis maintenant ton niveau
d'accompagnement » (qui ne s'affichait que dans le cas précis « aucun
programme ») a été retiré — désormais entièrement couvert par la nouvelle
carte, à chaque connexion et pour tous les états, pas seulement celui-là.

**Corrigé au passage** : plusieurs couleurs de texte oubliées lors du
passage au thème sombre de la veille — ces couleurs vivaient en dur dans
`dashboard/page.tsx` (valeurs Tailwind arbitraires `text-[#...]`), donc
invisibles au grep fait sur `globals.css` seul. Texte gris-brun quasi
invisible sur la section "Ma semaine", la section "Diagnostic enrichi"
(fond clair oublié) et le jour de récupération.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres.
**Non vérifié** (comme pour le thème sombre la veille) : rendu visuel
réel, ce sandbox n'a toujours aucun navigateur. À tester par Anthony :
les 5 états de la mission du jour (profil incomplet, programme à générer,
check-in à faire, séance prête, repos), et le clic sur "Débloquer mon
accompagnement" pour un compte sans abonnement.

**Suite immédiate demandée par Anthony (pas encore commencée)** : utiliser
le bilan initial (diagnostic public, avant inscription) pour proposer au
prospect un plan concret projeté (entraînement/alimentation/récupération/
hydratation) qui l'amène jusqu'à son objectif, en recommandant la bonne
formule (Impulsion / Transformation "hybride" / VIP présentiel-visio)
selon son besoin — sur l'écran de résultat du diagnostic public, pas le
dashboard. Anthony a confirmé cet ordre de priorité (dashboard d'abord,
puis ce chantier) via question posée avant de coder.

## Bascule complète du site en thème sombre (19/08/2026, suite)

Après la carte `ScoreAgeCoaiCard` et la section homepage "Ton évolution
devient visible", Anthony a demandé d'uniformiser toute l'app sur ces
mêmes couleurs sombres (« j'aime bien la partie l'expérience terrain avec
ces couleurs... peux-tu uniformiser tout le site avec ces couleurs? »).
Question posée sur l'ampleur (harmoniser les accents seulement / étendre
les panneaux sombres à quelques endroits / rebasculer tout le site) —
Anthony a choisi le chantier complet, puis, une fois prévenu qu'aucune
vérification visuelle n'est possible depuis ce sandbox (aucun navigateur),
a tranché : **« Je fais tout d'un coup, gros paquet unique »**.

**Ce qui existait avant ce chantier** : le site avait un thème sombre
d'origine, remplacé par un thème clair "champagne/taupe" lors d'une session
ChatGPT séparée (13/08-15/08). Le remplacement fonctionnait par 4 classes
de scope (`.coai-diagnostic-card`, `.coai-access-page`, `.coai-app-shell`,
`.coai-landing-lux`) qui remappaient en CSS les classes Tailwind
natives (déjà pensées sombres : `text-white`, `bg-graphite-900`,
`border-white/10`...) vers des équivalents clairs, plus des dizaines de
composants réécrits à la main en couleurs claires (options du quiz, cartes
dashboard, hero programme, mockup téléphone de la landing, footer, nav
app...). Les panneaux les plus récents (`.coai-intelligence-panel`,
`.coai-vitality-panel`, `.coai-impulsion-challenge`) étaient restés sombres
— exemptés du scope clair au cas par cas via des resets `!important`
(précédent déjà en place pour `.coai-service-modal`).

**Approche** : suppression des 4 blocs de remap Tailwind (redonne leurs
couleurs sombres natives à `text-white`/`bg-graphite-900`/etc.), puis
conversion manuelle un par un de chaque composant hand-stylé en dur
(fonds crème/blanc translucide → fonds `#0d0e10`/`#111518`/blanc
translucide à 3-9% ; texte foncé `#171817`/`#494b46` → texte clair
`#fffdf8`/`#d7dcde`/`#aeb5ba` ; ombres/bordures brun chaud → équivalents
neutres `rgba(255,255,255,X)`/`rgba(0,0,0,X)`). Composants concernés :
options/kicker/barre de progression du quiz diagnostic, écran d'accès
post-diagnostic, hero + semaine + cartes de brief du dashboard, hero +
cartes programme/exercice/séance/nutrition, nav app + dropdown, mockup
téléphone et footer de la landing, `.coai-pricing-algorithm`. Les éléments
déjà sombres (`.coai-intelligence-panel`, `.coai-vitality-panel`,
`.coai-value-loop`, `.coai-color-*`/`.coai-mini-signal*` de la landing,
`.coai-orb`, `.coai-rainbow-cta`...) n'ont pas été touchés — ils étaient
déjà corrects. Les resets `!important` scopés (`.coai-service-modal`,
`.coai-vitality-panel`) deviennent redondants avec ce changement mais
restent en place, sans effet néfaste.

**Vérifié** : `npx tsc --noEmit` et `npx next build` réels, propres —
toutes les routes compilent et génèrent (dont `/programme/exercices` et
`/programme/recettes`, chantiers du même jour). **Non vérifié** : aucun
rendu visuel réel, ce sandbox n'a pas de navigateur ni d'accès réseau au
site déployé — contrairement à d'habitude où Playwright permettait au
moins une vérification locale, ici seule la compilation a pu être
contrôlée. Risque explicitement accepté par Anthony avant de lancer le
chantier en un seul gros commit plutôt que par petits lots vérifiables un
par un.

**Reste à faire par Anthony** : tester le site déployé de bout en bout
(diagnostic, accès post-diagnostic, dashboard, pages programme,
landing/footer) et signaler tout endroit encore clair ou tout contraste
resté insuffisant — avec 1666 lignes de CSS et des dizaines de composants
convertis à la main sans aperçu visuel, une repasse de correction ciblée
après un premier retour réel est probable, pas un échec du chantier.

## Direction "wow" façon Apple Watch/Whoop + recettes + blocage images IA (19/08/2026, suite)

Après le lot de 5 chantiers de patches (section suivante), Anthony a demandé
d'aller plus loin dans le style Whoop repéré sur les captures qu'il a
envoyées, puis a élargi : « il faut beaucoup plus d'images, d'animation, de
vidéos... innovant, tech... des belles images de nutrition, de corps
athlétiques... yoga pour la récupération » et enfin une direction produit à
trois piliers : **MyFitnessCoach** pour la structure programme/exercices,
**Whoop** pour le tracking métriques/scores, **partage viral** (défier ses
amis sur le Score & Âge COAI) — avec un niveau de finition visé « à la Apple
Watch ».

**Blocage réel identifié et communiqué à Anthony** : ce sandbox n'a aucun
outil de génération d'images IA (pas de DALL-E/Midjourney/Stable Diffusion
connecté) et aucun accès réseau sortant vers des banques d'images
(Pexels/Unsplash bloqués par la politique du proxy — vérifié, pas
contournable). Anthony a tranché : banque de photos sous licence (Pexels,
licence commerciale libre, aucune attribution requise) plutôt qu'une clé de
génération IA. Il doit créer une clé gratuite sur pexels.com/api et la
donner — **en attente**, rien n'est encore branché en conditions réelles.

**Ce qui est fait dès maintenant, sans dépendre de la clé** :
- **`RecuperationMusculaireCard` repensée** dans le même langage visuel que
  `ScoreAgeCoaiCard` (patch 2) : panneau sombre `coai-vitality-panel`
  (déjà existant, réutilisé pour cohérence plutôt que dupliqué), barre de
  graduation à 4 crans par groupe musculaire (façon jauge Whoop, une seule
  couleur par état plutôt qu'un dégradé multi-teinte trompeur), pastille
  `animate-status-pulse` sur un groupe mis à jour le jour même.
- **`ScoreAgeCoaiCard`** : `animate-reveal` ajouté (oubli du patch d'origine)
  pour une entrée cohérente avec le reste du dashboard.
- **Infrastructure Pexels prête, code écrit d'avance** (`src/lib/media/
  pexels.ts`, `getStockPhoto`/`getStockPhotos`) : appel côté serveur
  uniquement (clé jamais exposée au client), cache mémoire par requête,
  retombe toujours sur `null` si la clé est absente ou l'appel échoue —
  jamais d'image cassée. Le vrai appel réseau se fera depuis Vercel en
  production (accès réseau réel), jamais testable depuis ce sandbox — même
  limite que Stripe/Supabase.
- **Bibliothèque de recettes** (`/programme/recettes`, nouveau lien de nav
  sous "Mon programme") : 10 recettes rédigées ici (petit-déj/déjeuner/
  dîner/collation, tags objectif perte de poids/prise de masse/équilibre et
  régime végétarien/sans gluten/anti-inflammatoire — cohérent avec le
  travail cycle/allergies du 14/08), macros indicatives par portion,
  ingrédients/étapes dans un `<details>` natif. Distincte du plan nutrition
  généré par l'IA (`NutritionView`) — une bibliothèque commune, pas une
  personnalisation par profil. Chaque carte (`RecetteCard`) affiche la
  photo Pexels (ou aucune si absente) avec dégradé sombre, filtrable par
  repas/objectif/régime (`RecettesGrid`, 100% client, zéro appel réseau
  supplémentaire au changement de filtre — toutes les photos déjà résolues
  côté serveur en une fois).

**Vérifié** : `tsc --noEmit` et `next build` réels, propres — la route
`/programme/recettes` compile et apparaît dans le build. Protection d'accès
confirmée par lecture de `middleware.ts` (`/programme/:path*` déjà dans le
matcher, pas de nouvelle règle nécessaire).

**Reste à faire** :
- Anthony : créer la clé Pexels, l'ajouter sur Vercel (`PEXELS_API_KEY`,
  déjà documentée dans `.env.example`) — les photos de recettes
  n'apparaîtront qu'après ça.
- Claude, une fois validé par Anthony : étendre le même traitement visuel
  (panneaux sombres façon Whoop, animations d'entrée) au reste des pages
  programme/nutrition/récupération plutôt que seulement les 2 cartes déjà
  faites ; construire le "défi Score & Âge COAI" entre amis en réutilisant
  l'infra de partage déjà existante (Phase 9, cartes `next/og`, liens de
  parrainage) — pas encore démarré, périmètre à confirmer avec Anthony
  avant de coder (quel visuel de carte, quel mécanisme de défi).
- Non testable depuis ce sandbox (comme toujours) : rendu réel des photos
  Pexels une fois la clé posée, et le vrai rendu visuel en production —
  Anthony à vérifier après déploiement.

## Les 4 autres chantiers : respire, Score & Âge COAI, catalogue d'exercices, récupération musculaire, Entreprise (19/08/2026, suite)

Après le chantier 1 (révélation en plusieurs écrans, section ci-dessous),
Anthony a répondu : *« continue sur les 3 autres chantiers et il faut
mettre en avant le score coai et l'age coai façon whoop et faire la
section coai entreprise pour dirigeant et une partie pour collaborateurs
sur devis avec mon lien whatsapp »*, avec 6 captures Whoop (« ÂGE WHOOP
45,8 » / « 4,7 ans de moins », « rythme de vieillissement 0,8x »). Sur les
3 questions de clarification posées (ordre, méthodologie Âge COAI, modèle
Entreprise), sa réponse a été : *« comme tu veux pour l'ordre fait les 5
choses et je vérifie à la fin »* — décisions de conception ci-dessous
prises par défaut, à vérifier par Anthony.

**1. Score & Âge COAI façon Whoop (nouveau module `src/lib/insight/age-coai.ts`)**
Distinct de `indiceCoai` (`mini-diagnostic.ts`, calculé une fois à partir
des réponses du quiz — potentiel déclaré). Le nouveau Score COAI est
**comportemental** : recalculé à chaque visite du dashboard à partir de
90 jours de `DailySession` réelles (régularité des check-ins terminés,
récupération sommeil/énergie déclarée moins une pénalité jours
douloureux, dosage ressenti des séances). Âge COAI = âge déclaré
(`Profile.age`) ± un écart plafonné à 6 ans dérivé du même score — jamais
une mesure physiologique réelle (pas de bracelet connecté), disclaimer
explicite affiché en permanence (`AGE_COAI_DISCLAIMER`). Gate de données
minimum (7 jours de check-in) avant d'afficher quoi que ce soit ; si l'âge
n'est pas renseigné, seul le Score s'affiche. Nouvelle carte
`ScoreAgeCoaiCard`, placée juste sous le header du dashboard (anneau
`.coai-vitality-ring`, nouvelles classes CSS sombres cohérentes avec
`.coai-intelligence-panel` existant).

**2. Écrans respirants dans le quiz** — deux pseudo-steps `"respire1"`/
`"respire2"` insérés dans `STEP_ORDER` juste après `"echeance"` et
`"profilPhysique"` (répartis sur les 15 questions réelles), jamais dans
`questionSteps` donc invisibles dans la barre de progression — même
principe que `"analyse"`/`"reveal"`. Contenu texte fixe (`BREATHERS`),
jamais de statistique inventée façon MyFitCoach. Avance seule après 4,2s
ou au toucher.

**3. Catalogue d'exercices** (`src/lib/exercices/catalogue.ts`) — liste
statique de 48 exercices (6 par groupe musculaire), rédigée à partir de
repères de technique standards, **pas générée par l'IA** : les programmes
utilisateur restent générés dynamiquement comme avant
(`programme-entrainement-*.ts`, inchangé) — ce catalogue est une
bibliothèque de référence séparée, parcourable librement. Page
`/programme/exercices`, filtres cumulables groupe musculaire / matériel /
type. **Premier jet à relire par Anthony** avant mise en avant massive :
les 48 fiches sont volontairement courtes (1 phrase de repère), pas des
tutoriels complets.

**4. Suivi de récupération musculaire** — nouveau modèle Prisma
`RecuperationMusculaire` (+ enums `GroupeMusculaire`,
`NiveauRecuperationMuscle`), **purement déclaratif** : ni
`SeanceLog.exercices` (Json libre) ni `DailySession.painArea` (texte
libre) ne permettent de déduire un groupe musculaire travaillé avec une
confiance suffisante — demande explicitement à l'utilisateur plutôt que
d'inventer une corrélation. Migration SQL écrite à la main (`prisma
migrate dev` impossible ici, pas d'accès DB dans le sandbox) — **à
appliquer par Anthony** (`npx prisma migrate deploy` ou équivalent) avant
que ce chantier fonctionne en prod. Carte `RecuperationMusculaireCard`
dans le dashboard, route `/api/recuperation-musculaire`.

**5. COAI Entreprise, dirigeant vs collaborateurs** — la page `/entreprise`
existait déjà (pilote/déploiement/pilotage + WhatsApp + formulaire lead,
entièrement sur devis). Ajouté un nouveau bloc "Pour vous, dirigeant(e)"
en self-serve juste après l'intro (CTA vers `/diagnostic`, le même point
d'entrée que le reste du site), et retitré le bloc existant "Pour vos
collaborateurs — sur devis" pour rendre la séparation explicite. Le lien
WhatsApp (`buildWhatsAppLink`) reste celui déjà en place. Aucun lien ajouté
à la navigation principale : ni `/vip` ni `/coach-sportif-paris` (même
type de page) n'y sont rattachées non plus, cohérence conservée avec ce
choix existant.

**Pas vérifié pour les 5 chantiers** : pas de `next build`/`tsc` réel
(sandbox sans accès npm, 403 sur registry.npmjs.org comme d'habitude). À
la place : `tsc` isolé fichier par fichier (aucune erreur `TS2304`/
`TS2448`/erreur de syntaxe introduite — le bruit `TS7053`/`TS7031` observé
vient de l'absence des types React dans ce check isolé, reproduit sur un
cas minimal sans rapport avec le code livré) + script d'équilibre des
accolades sur chaque fichier modifié. La migration SQL du chantier 4
n'a pas été exécutée contre une vraie base.

## Révélation en plusieurs écrans après le diagnostic (19/08/2026)

Anthony a fait analyser ~60 captures + 2 vidéos de l'app concurrente
MyFitCoach (aucune trace du second concurrent annoncé, "Planificateur
d'Entraînements", dans ce lot — à fournir séparément si besoin). Direction
demandée : onboarding plus visuel/animé/immersif, sans copier l'identité
visuelle, les textes ni les visuels de MyFitCoach — seulement leurs
principes UX. Décision prise en 4 chantiers distincts, validés un par un
avec Anthony ; celui-ci est le premier (« la révélation en plusieurs
écrans (Recommandé) »), les 3 autres restent à faire :

1. **Révélation en plusieurs écrans (fait ce soir)**
2. Écrans pédagogiques respirants dans les 25 questions du quiz existant
3. Catalogue d'exercices filtrable par muscle/matériel/type (fonctionnalité
   produit séparée de l'onboarding)
4. Suivi de récupération par groupe musculaire (idem, recoupe
   probablement `profil-appris.ts`/`coai-insight.ts`, cf. Phase 7)

**Ce qui a été livré** : le repère UX central de MyFitCoach n'est pas ses
33 questions (le quiz `/diagnostic` en a déjà 25, très proches) mais sa
séquence de révélation en **5 écrans successifs** avant le plan final
(faux chargement, projection, stat globale, avant/après, récap nommé),
alors que COAI atterrissait d'un coup sur la longue page `result`.
Reproduire leurs écrans tels quels aurait demandé d'inventer des données
(ex. leur "31% plus fort en 3 mois, sur 1845 personnes comme vous" —
COAI n'a pas ce volume d'utilisateurs, l'inventer aurait été malhonnête).
Décision : garder le principe (plusieurs écrans, rythmés, avant le plan
complet) mais avec uniquement des données déjà réelles et déjà calculées
par `diagnostic`/`signauxDiagnostic` (aucune nouvelle valeur inventée).

Nouveau step `"reveal"` dans `diagnostic-quiz.tsx`, inséré dans
`STEP_ORDER` entre `"analyse"` et `"result"` — 3 ou 4 écrans (le 3e,
"Ce qu'on va travailler", sauté si `pointsATravailler` est vide) :
score COAI (anneau `coai-index-ring` déjà existant), les jauges
`signauxDiagnostic` (`Gauge`, réutilisé tel quel), points à
travailler/résolus, puis les 3 premières actions (`indiceCoai.actions`).
Auto-avance toutes les 2,4s (même mécanique que le step `"analyse"`
existant), plus un tap/clic sur l'écran pour avancer tout de suite (retour
déjà reçu sur "analyse" par le passé : personne n'aime attendre une
animation). La page `result` complète n'est ni coupée ni dupliquée, elle
arrive telle quelle juste après — additif, aucun contenu retiré.
Nouvel événement funnel `diagnostic_reveal_started` (ajouté au type
`FunnelEventName`).

**Piège évité en cours de route** : `revealScreenCount`/`revealIndex`
avaient d'abord été déclarés juste après le step `"analyse"` (par
cohérence de lecture avec ce bloc voisin), mais ça référençait `diagnostic`
avant sa déclaration plus bas dans le composant (`useMemo`) — TypeScript
l'aurait rejeté à la compilation ("used before declaration"), attrapé par
un typecheck isolé du fichier (pas de `next build` complet possible ici,
cf. plus bas) avant l'envoi du patch. Déplacé juste après
`signauxDiagnostic`, qui est le dernier des deux dont ce bloc dépend.

**Pas vérifié** : `next build`/`tsc` réels (même blocage réseau sandbox
que d'habitude — `npm ci` refusé, 403 sur registry.npmjs.org). Un
typecheck isolé du seul fichier modifié (`tsc` en mode autonome, sans
résolution des alias `@/...` ni des types Next/React installés) a été fait
à la place — il ne remplace pas un vrai build, mais a permis d'attraper le
bug de déclaration ci-dessus avant l'envoi. Vérification manuelle de
l'équilibre des balises JSX/parenthèses sur tout le fichier également
faite (script Node ad hoc). À confirmer par un vrai build côté Anthony.

**Reste à faire par Anthony si le résultat plaît** : lancer les 3 autres
chantiers un par un (voir liste plus haut), et transmettre l'image du
second concurrent ("Planificateur d'Entraînements") si l'analyse doit
être complétée.

## Homepage façon Future (dark) + coach IA femme + lead enrichi (16/08/2026, suite)

Anthony a envoyé 5 captures réelles de future.co (jamais eu accès à leur
interface avant ça, seulement des descriptions textuelles d'articles) :
fond noir, accent couleur (vert chez eux), cartes glass superposées sur
des photos, bandeau d'annonce en haut, animations. « On refait dans ce
style ! J'aime bien il y a de la couleur c'est animé... il faut plus
d'images. »

**Scope volontairement limité à la homepage seule** (`/`) — pas le reste
du site (`/pricing`, `/diagnostic`, dashboard, pages SEO/légales), qui
reste sur le thème clair "champagne" construit sur plusieurs sessions
précédentes (beaucoup de corrections de bugs investies là-dessus,
cf. sections plus bas). `.coai-landing-lux` (remap clair, partagé par 15
pages) n'a pas été touché ; la homepage utilise maintenant `.bg-lab-grid`
directement (fond sombre déjà existant, utilisé sur `/admin/*`), qui ne
remape rien — les classes `text-white`/`text-laiton-*` de la homepage
retrouvent leur teinte native sombre sans changement de JSX.

- **Nouvel accent bleu-acier** (`acier: #5b8296`, déjà dans
  `tailwind.config.ts` mais sous-utilisé) mis en avant à côté du doré —
  répond à « il y a de la couleur », jamais un simple monochrome.
- **Bandeau déroulant** (`MarqueeBanner`, nouveau) — piste dupliquée x2,
  boucle par translation -50%, respecte `prefers-reduced-motion` (reste
  fixe si désactivé).
- **`Reveal`** (nouveau composant client, `IntersectionObserver`) — révèle
  chaque section au scroll plutôt qu'un délai fixe au chargement (qui
  n'aurait rejoué aucune animation en scrollant sur une page longue).
  Réutilise le keyframe `coai-reveal-up` déjà existant.
- **Cartes glass superposées** sur la photo `apercu-produit` (diagnostic)
  et nouvelle bande photo studio d'Anthony (`anthony-studio-premium.jpg`,
  jamais utilisée jusqu'ici) — reprend le même geste que les cartes
  "Schedule"/"Equipment" de Future, avec du vrai contenu COAI, jamais une
  donnée inventée.
- **Hero recentré "algorithme d'abord"** — suite à deux retours directs
  d'Anthony pendant la session ("c'est puissant de proposer un coach...
  mais ce n'est plus puissant que proposer un simple programme", puis
  "mettre en avant notre algorithme. Et que si besoin, on peut être suivi
  par un coach humain diplômé d'État") : le H1 devient "Un algorithme
  construit par 17 ans de coaching terrain", le coach humain positionné
  explicitement comme une option "si besoin", pas un choix à parité 50/50.

**Coach IA femme** (« j'aimerais qu'on mette en place un coach IA femme
aussi ») — l'étape "Qui veux-tu comme coach ?" du diagnostic passe de 2 à
3 choix : "Coach IA — voix masculine", "Coach IA — voix féminine",
"Anthony Darmon". `Profile.coachPreference` passe de `"IA"/"ANTHONY"` à
`"IA_HOMME"/"IA_FEMME"/"ANTHONY"` — toujours une string libre (pas
d'enum), donc **aucune migration nécessaire** pour ce changement (le champ
avait été ajouté plus tôt cette même session). `besoins-identifies.ts`
traite les deux variantes IA de façon identique (renforcent Impulsion).

**Lead diagnostic enrichi** (« je viens de recevoir un lead... j'ai juste
son mail. Je veux avoir plus d'informations... numéro de téléphone,
objectifs, score... et pouvoir le contacter par WhatsApp ») — la
notification admin ("Nouveau lead — diagnostic COAI") se limitait jusqu'ici
à une phrase avec l'email. Refondue :
- **Nouveau champ `DiagnosticLead.telephone`** (migration
  `20260816020000_add_diagnostic_lead_telephone`, additive) — collecté sur
  la dernière étape du quiz, juste à côté de l'email, format international
  obligatoire (même règle que `phoneWhatsapp` existant côté profil
  authentifié) pour rester compatible avec un lien wa.me.
- **Notification enrichie** (texte + HTML, nouveau
  `src/lib/email/lead-notification.ts`) : email, téléphone, score COAI
  (`indiceCoai.score`/`.niveau`, déjà calculé pour l'email au lead — zéro
  coût IA supplémentaire), objectif, niveau, source publicitaire (UTM déjà
  capturé depuis la Phase 5B du 11/08, jamais surfacé avant aujourd'hui),
  plus un bouton "Contacter sur WhatsApp" (lien `wa.me` construit avec le
  numéro du lead — distinct de `buildWhatsAppLink`, qui pointe vers le
  numéro fixe d'Anthony) et un bouton "Appeler" (`tel:`).

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Playwright
réel (mobile 390px, desktop 1440px) sur la homepage sombre : aucun
débordement horizontal (`scrollWidth` mesuré), bandeau déroulant visible,
cartes glass lisibles, animations de révélation déclenchées au scroll.
Captures envoyées à Anthony pour validation avant qu'il ne teste en
production.

**Non testable depuis ce sandbox** : la réception réelle de la
notification enrichie (email + push ntfy, pas d'accès réseau sortant vers
Resend/ntfy depuis ce sandbox) et le clic réel sur le bouton WhatsApp avec
un vrai numéro de lead. À confirmer par Anthony sur un vrai diagnostic
soumis avec numéro de téléphone.

## Choix de coach au diagnostic — modèle Future (16/08/2026)

Anthony a demandé, après une recherche sur les concurrents (Future, Fitbod,
Freeletics...) : « je veux metre ca en place et tu proposes soit le coach IA
soit moi », avec Future explicitement désigné comme modèle de référence
(« je veux que futur soit notre model » / « j'aime ce qu il propose »).
Future fait choisir un style de coaching humain parmi plusieurs profils
disponibles ; COAI n'a qu'un seul coach humain à ce jour (Anthony), donc le
choix est réduit à 2 options : Coach IA (rapide, disponible 24h/24,
génération immédiate) ou Anthony Darmon (coach diplômé d'État, 17 ans
d'expérience, validation humaine).

Nouvelle étape "Qui veux-tu comme coach ?" ajoutée au quiz `/diagnostic`,
juste avant l'email (dernière question, position volontairement
inchangée — effet IKEA déjà documenté ailleurs dans ce fichier). Nouveau
champ `Profile.coachPreference` (`String?`, pas un enum Prisma) : décision
explicite d'Anthony — « et plutard si ca marche on recrute d autre coach » —
un enum aurait demandé une migration à chaque nouveau coach recruté, une
string reste extensible sans y toucher. Migration additive
`20260816010000_add_profile_coach_preference`. Câblé dans
`reponsesEnProfil()` (donc propagé au pont pré-inscription ET au parcours
connecté, comme toute la logique de mapping diagnostic→profil), dans la
sauvegarde de progression (reprise du diagnostic) et dans le payload du
lead email.

**N'assigne aucun coach humain réel** — aucun système d'affectation
n'existe, ce serait prématuré avant même un seul coach pilote. Utilisé
uniquement pour orienter la vitrine personnalisée du dashboard
(`src/lib/dashboard/besoins-identifies.ts`, moteur déterministe existant
depuis le 14/08) : "Anthony" fait remonter un besoin pointant vers
Transformation (validation humaine), "IA" renforce Impulsion (génération
IA seule, sans attente). Écran de résultat du diagnostic non touché : il
ne montre plus de formules du tout depuis le nouveau modèle d'accès libre
du 13/08 — rien à y biaiser.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres.

**Non testable depuis ce sandbox** (limite habituelle) : le rendu réel de
la nouvelle étape en conditions réelles, et l'effet sur la vitrine du
dashboard avec un vrai profil. À confirmer par Anthony une fois déployé.

## Corrections post-redesign (bugs UI en cascade) + industrialisation SEO (15/08/2026, suite)

Suite directe de l'audit ci-dessous : après le premier lot de corrections,
Anthony a testé en direct sur coai.fr et remonté une série de bugs visuels
supplémentaires, tous de la même famille (composants jamais adaptés au
nouveau thème clair par la session ChatGPT d'origine) :

- **Champs de formulaire invisibles partout** (Âge/Taille/Poids du
  diagnostic, et par extension tout `Input`/`Textarea`/`Select` du site) —
  ces composants partagés utilisent une bordure et un fond blancs à faible
  opacité (`border-white/10`, `bg-white/[0.045]`), pensés pour l'ancien
  thème sombre. Seul `.coai-landing-lux` (thème de la homepage) couvrait
  ces classes par overrides CSS ; les 3 autres scopes clairs
  (`.coai-diagnostic-card`, `.coai-app-shell`, `.coai-access-page`) ne les
  couvraient pas du tout — champs rendus comme des cases vides.
- **Titre "Entraînement." illisible** sur `/programme/entrainement` — cause
  différente : ce `<h1>` n'a aucune classe de couleur explicite, donc
  hérite silencieusement du blanc quasi-invisible posé sur `body`. Les 3
  scopes clairs incomplets n'avaient pas non plus de `color` de base sur
  eux-mêmes (seul `.coai-landing-lux` en avait un). Ajouté aux 3 scopes.
- **Lien "VIP" qui ne menait jamais à la bonne section** — Next.js ne
  scrolle pas de façon fiable vers une ancre (`#vip`) lors d'une navigation
  client vers une page Server Component. Nouveau composant `ScrollToHash`
  (petit effet client, retry jusqu'à ce que la cible existe dans le DOM)
  ajouté sur `/compte/abonnement`.
- **Menu simplifié** — le lien "VIP" isolé (qui ne montrait qu'une offre
  parmi les trois, sans comparaison) remplacé par un unique "Offres" →
  `/pricing`, qui présente déjà Impulsion/Transformation/VIP côte à côte
  avec le détail complet des fonctionnalités et le paiement — cohérent
  avec la demande d'Anthony : « les gens n'ont pas envie de réfléchir, il
  faut les guider ».
- **Lisibilité renforcée** sur la carte "Ton plan de progression
  personnalisé" (dashboard) — texte d'explication agrandi et assombri.

**Audit demandé par Anthony** : les 7 automatisations de récupération de
revenu (Phases Revenus 1-6 — relance essais inactifs, paiements en
retard, checkouts abandonnés, diagnostics non convertis, activation essai,
alerte douleur, rappel fin d'essai) sont vérifiées correctement câblées
sur le cron quotidien `relance-inactifs`, avec garde-fous anti-doublon sur
chacune. Rien à corriger — audit passé sans trouver de bug.

**Industrialisation SEO** — 2 nouvelles pages sur des intentions de
recherche à fort volume, jamais couvertes : `/programme-prise-de-masse`
(objectif opposé à `/programme-perte-de-poids`, aucun chevauchement) et
`/programme-musculation-debutant` (audience jamais ciblée jusqu'ici — les
pages existantes visent la localisation, le format, l'IA, le sexe ou
l'objectif perte de poids, aucune sur le niveau débutant). Même gabarit
exact que les pages précédentes (`Card` + `SeoFaq` + `RelatedSeoLinks`),
ajoutées au sitemap et au footer.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres à chaque
commit. Playwright réel (mobile 390px, desktop 1280px) sur les 2 nouvelles
pages SEO et le fix du survol diagnostic (`getComputedStyle` confirmé) —
aucun débordement horizontal.

**Non testable depuis ce sandbox** (limite habituelle) : le rendu réel en
production, l'envoi effectif des relances par le cron (dépend de Resend/
Supabase en conditions réelles).

## Audit visuel post-redesign taupe/champagne + corrections (15/08/2026)

Suite du redesign taupe/champagne fait par une session ChatGPT séparée
(13 commits, jamais audité). Anthony a demandé un audit complet de coai.fr
sans modification, puis a validé les corrections.

**Audit** (lecture seule, `tsc`/`build` réels + Playwright sur dev local —
accès réseau direct à coai.fr bloqué côté sandbox, jamais contourné) :
identifié que le redesign n'avait touché que la homepage/diagnostic/app
authentifiée — `/pricing`, les 6 pages SEO, `/calculateur-calories`,
`/a-propos` et les 3 pages légales (CGV/confidentialité/mentions légales)
étaient restées sur l'ancien thème sombre `bg-lab-grid`.

**Bug critique trouvé** : sur le questionnaire diagnostic (et partout où
`.coai-app-shell`/`.coai-diagnostic-card`/`.coai-access-page` s'appliquent),
le texte d'une réponse sélectionnée devenait invisible (texte quasi-blanc
sur fond quasi-blanc). Cause réelle : `text-laiton-200` était utilisé dans
des dizaines de composants sans que cette couleur n'ait jamais été définie
dans `tailwind.config.ts` (seuls 300/400/500/600 existaient) — Tailwind ne
génère alors aucun CSS pour cette classe, le texte hérite silencieusement
de la couleur ambiante. Sur l'ancien thème sombre ça passait inaperçu
(blanc hérité sur fond sombre) ; sur le nouveau thème clair, invisible.
Corrigé par l'ajout d'un vrai `laiton-200` à la palette + des règles
`.text-laiton-200` dans les 3 scopes concernés.

**Harmonisation** : classe `coai-landing-lux` (déjà utilisée par la
homepage, gère son propre fond clair + réassigne les couleurs Tailwind
héritées de l'ancien thème sombre) appliquée aux 11 pages encore sombres
listées ci-dessus. Un second bug découvert en vérifiant `/cgv` : les
titres de section utilisaient une variante Tailwind arbitraire
(`[&_h2]:text-graphite-50`) — le nom de classe généré contient ce token
complet, donc les sélecteurs `.text-graphite-50` ne le matchent jamais ;
ajouté un sélecteur d'attribut dédié (`[class*="text-graphite-50"] h2`)
pour l'attraper aussi.

**Correction de contenu** : la séance visio de 30 min Anthony Darmon
incluse dans Transformation était décrite comme récurrente ("chaque mois"/
"par mois") à 4 endroits (`/pricing` via `tiers.ts`, `compte/abonnement`
via `plan-features.ts`, les CGV, et le CTA in-app `CoachingVisioCta`) —
corrigé partout pour refléter la règle réelle : offerte une seule fois,
toute séance suivante passe par l'offre VIP payante à la séance.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Playwright
réel sur dev local (mobile 390px, desktop 1440px) : texte de l'option
sélectionnée du diagnostic lisible (`getComputedStyle` confirmé,
`rgb(129,91,35)` sur fond crème), `/pricing` sans débordement horizontal
avec la nouvelle copy visio, `/cgv` avec titres de section maintenant
visibles, `/a-propos`, `/calculateur-calories` et
`/programme-perte-de-poids` entièrement passées au thème clair sans
régression.

**Non testable depuis ce sandbox** : accès réseau direct à coai.fr bloqué
par la politique du sandbox (jamais contourné, conforme à la consigne) —
toute la vérification visuelle a été faite sur un serveur de dev local
exécutant le code réellement poussé, pas sur le site en production. À
confirmer par Anthony une fois déployé : que les pages listées s'affichent
bien identiquement en prod.

## Renfort SEO + calculateur gratuit (14/08/2026)

Suite directe du blocage Meta (section suivante, plus bas) : Anthony a
demandé de « s'attaquer à ramener du trafic » — scopé avec lui (question
structurée) sur les deux leviers réellement dans le pouvoir du code (pas
de pub payante ni de contenu organique possibles depuis cette session) :
étendre le SEO et construire un outil gratuit.

**2 nouvelles pages SEO longue traîne**, même gabarit exact que les 4
pages existantes (`Card` + `SeoFaq` avec données structurées FAQPage +
`RelatedSeoLinks`) :
- `/programme-musculation-femme` — intention de recherche distincte,
  jamais couverte ; met en avant la fonctionnalité cycle/grossesse/post-
  partum livrée le même jour (section plus haut).
- `/programme-perte-de-poids` — intention "objectif" à fort volume de
  recherche, les 4 pages précédentes étaient toutes centrées lieu/format,
  aucune sur l'objectif perte de poids/perte de gras.
- CTA aligné sur le funnel diagnostic-first actuel (`/diagnostic` en
  principal) plutôt que `/sign-up` comme les 4 pages plus anciennes
  (incohérence pré-existante non corrigée sur les 4 anciennes, notée mais
  hors scope de cette session).

**Calculateur gratuit de calories/macros** (`/calculateur-calories`) —
nouvel outil autonome, calcul 100% côté client (Mifflin-St Jeor + facteur
d'activité pour le TDEE, répartition macros selon l'objectif), aucun
compte ni email requis pour voir le résultat. Mot-clé à fort volume jamais
couvert par le site. Le résultat inclut une transition explicite vers
l'offre ("ce chiffre est un point de départ générique et figé, COAI
s'ajuste réellement...") avec CTA vers `/diagnostic`.

`RelatedSeoLinks` étendu à 7 pages (maillage interne automatique, rien à
modifier page par page), `sitemap.ts` et `footer.tsx` mis à jour.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Playwright
réel (mobile 390px, desktop 1440px) sur les 3 nouvelles pages : calcul du
calculateur vérifié manuellement (valeurs cohérentes avec la formule),
aucun débordement horizontal, maillage interne affiché correctement.

**Explicitement pas fait** (hors du pouvoir du code depuis ce sandbox) :
aucune publication organique (réseaux sociaux), aucune pub payante, aucun
contenu vidéo/photo — reste entièrement entre les mains d'Anthony. Le
renforcement du programme de parrainage (3e option proposée, non retenue
cette fois) reste disponible si Anthony veut continuer sur ce levier.

## État acquisition : 0 vente, campagne Meta bloquée (14/08/2026)

Anthony confirme 0 vente à date. Cause identifiée : la campagne Meta/
Instagram (ciblage Paris + fitness, budget prévu ~75-100€ sur 5-7 jours,
mentionnée le 09/08) n'a en réalité **jamais été lancée** — Meta a refusé
les vidéos publicitaires générées par IA à la validation. Donc 0 trafic
payant à ce jour, ce qui explique mécaniquement le 0 vente : pas un
problème de produit, de tunnel d'achat ou de prix, juste une absence totale
de trafic acquis. Les seuls canaux réellement actifs sont l'organique
(Reels/TikTok par Anthony) et le SEO (4 pages), dont le volume est
probablement trop faible pour générer des ventes à ce stade.

**À faire par Anthony pour débloquer** : remplacer les vidéos IA par du
contenu réel (vidéo tournée par lui, même simple/smartphone) ou par des
visuels statiques/carrousel — plus rapides à faire valider par Meta et
plus cohérents avec la décision déjà prise sur la homepage (vidéos IA
retirées le 14/08, en attendant une vraie vidéo). Les règles Meta sont de
plus en plus strictes sur le contenu synthétique, en particulier sur les
verticales fitness/transformation corporelle.

## Programmes adaptés au cycle menstruel / grossesse / post-partum (14/08/2026)

Suite d'un retour utilisatrice (Elsa, relayé par Anthony) : « des programmes
d'entraînement adaptés aux cycles féminins » — étendu par Anthony lui-même à
la grossesse, au post-partum, à une nutrition anti-inflammatoire/sans
gluten et aux intolérances alimentaires. Scope confirmé avec Anthony via
question structurée avant de coder (4 données à collecter, notification
admin systématique sur diagnostic connecté, double garde-fou de sécurité).

**Nouveaux champs `Profile`** (opt-in, jamais déduits du sexe déclaré) :
`cycleMenstruelSuivi`, `dateDernieresRegles`, `dureeCycleJours`,
`reglesDouloureuses`, `statutMaternite` (`ENCEINTE`/`POST_PARTUM`),
`dateReferenceMaternite` (terme prévu si enceinte, date d'accouchement si
post-partum). Migration additive `20260814020000_add_cycle_maternite`.
Les intolérances/anti-inflammatoire réutilisent le champ existant
`allergiesAlimentaires` (déjà couvrant, pas de nouveau champ) — renforcé
côté prompt nutrition avec une orientation anti-inflammatoire explicite
quand pertinent.

**Moteur déterministe** `src/lib/cycle/phase.ts` (aucun appel IA, même
principe que `src/lib/neat/recommandation.ts`) : calcule la phase de cycle
(menstruelle/folliculaire/ovulatoire/lutéale) ou l'état de grossesse
(trimestre, semaines) / post-partum (semaines écoulées) à partir des dates
réellement renseignées. `buildContexteFeminin()` traduit ça en une consigne
textuelle prête à injecter dans les prompts IA (jamais de date brute
envoyée à l'IA) — grossesse/post-partum prime toujours sur le cycle
(jamais pertinents simultanément).

**Collecte** : nouvelle étape "Cycle, grossesse ou post-partum ?" dans le
quiz diagnostic public, affichée uniquement si "Femme" est sélectionné à
l'étape sexe (jamais présumé sinon) — et mêmes champs répliqués dans
`/compte/profil` (`ProfilForm`) pour une abonnée déjà inscrite.

**Adaptation réelle du programme** : `contexteFeminin` injecté dans les 4
prompts entraînement/nutrition (structure + détail par jour) — prudence
spécifique grossesse (pas de décubitus dorsal prolongé au 3e trimestre, pas
de manœuvre de Valsalva, feu vert médical rappelé explicitement), post-
partum (reprise progressive, vigilance plancher pelvien/diastasis) et
conseils par phase de cycle (intensité, fer, stabilité articulaire, besoins
caloriques).

**Garde-fou de sécurité (double point demandé par Anthony)** : grossesse ou
post-partum force désormais le statut `EN_ATTENTE` (validation humaine
obligatoire) à la génération, y compris sur Impulsion normalement
instantané (`GENERE_IA`) — que ce soit à la génération initiale
(`/api/programmes/generate`) ou lors d'une adaptation confirmée
(`confirmerAdaptation`). Jamais de programme touchant ces sujets livré sans
relecture d'un coach.

**Notification admin manquante corrigée au passage** : en creusant le
signalement d'Anthony (« je n'ai pas reçu de mail de notification sur le
dernier diagnostic ») pour comprendre le lien avec le retour cycle
menstruel d'Elsa, découvert qu'un utilisateur **déjà connecté** qui refait
le diagnostic (parcours D) ne déclenchait aucune notification par
construction (contrairement au diagnostic anonyme, qui envoie toujours un
email) — pas un bug d'envoi, un cas jamais couvert. Nouvelle route
`POST /api/diagnostic/notify-connecte`, appelée systématiquement à la fin
du diagnostic pour un visiteur connecté.

**Vérifié** : `tsc --noEmit`, `npx prisma validate` et `next build` réels,
propres. Playwright réel (mobile 390px, desktop 1440px) sur la nouvelle
étape du quiz : affichage conditionnel au sexe, bascule enceinte/post-
partum/cycle mutuellement exclusive, aucun débordement.

**Non testable depuis ce sandbox** (mêmes limites qu'habitude, pas d'accès
Supabase/IA en conditions réelles) : le contenu réel généré par l'IA avec
ce contexte (formulation exacte des précautions dans une vraie séance/
repas), et le parcours `/compte/profil` en tant qu'abonnée authentifiée. À
tester par Anthony : diagnostic avec "Femme" + grossesse/cycle → vérifier
que le bon contexte apparaît sur le programme généré et que la validation
coach est bien forcée pour une utilisatrice enceinte.

## Corrections retours utilisatrice (Elsa) + nettoyage marketing (14/08/2026)

Série de corrections livrées le même jour, à partir des retours d'une
testeuse réelle (Elsa) relayés par Anthony par capture d'écran, plus
quelques demandes directes d'Anthony dans la foulée.

- **VIP — séance découverte** ajoutée aux offres à la séance (100€ en visio
  / 200€ en présentiel), à côté des packs existants.
- **VIP repassé 100% WhatsApp** (retour sur une itération Stripe faite puis
  annulée dans la même session) : plus de checkout intégré pour VIP —
  affichage des prix + réservation directe par WhatsApp
  (`vipReservationHref()`, message pré-rempli par séance), sur `/pricing`,
  le modal de détail service et `/compte/abonnement`.
- **"THE METHOD" retiré de tout le site** (offre 1-to-1 historique
  d'Anthony, jamais celle vendue par COAI) — remplacé partout par une mise
  en avant explicite des **17 ans d'expérience terrain d'Anthony Darmon**
  comme fondement de l'algorithme COAI (nouvelle question FAQ dédiée, bio
  homepage/`à-propos`, mentions légales, et les 8 prompts IA système).
- **Contraste du texte du hero renforcé** (`bg-black/30` → `bg-black/60` +
  flou) suite à un retour de lisibilité sur mobile en plein soleil.
- **Masque du logo du hero corrigé sur mobile** — trop large/sombre en haut
  à gauche par rapport à l'ancien rendu ; recalculé par les vraies
  dimensions de la photo (object-cover) plutôt qu'ajusté à l'œil.
- **Anneau du "C○AI"** (logo géant du hero) réaligné et remis à la même
  taille que les lettres environnantes (était visiblement plus petit).
- **Kicker du hero allégé** : retiré "sportif" et "validation" du texte
  bleu, sur demande directe d'Anthony.
- **Quiz diagnostic — incohérences corrigées** (signalées par Elsa) :
  consigne du step "sport" contradictoire avec la puce "Aucun actuellement"
  déjà existante (retiré "ou passe si aucun") ; champs "Taille (cm)"/
  "Poids (kg)" tronqués sur mobile faute de wrapper `<Field>`.
- **"19€/mois" résiduel purgé sur tout le site** — Impulsion est un
  paiement unique depuis une session précédente, mais le texte "19€/mois"
  traînait encore : 4 pages SEO, `/compte/abonnement`, `PLAN_LABELS`,
  l'email de relance diagnostic (cron), et une réécriture substantielle des
  CGV (sections 1 à 5, plus de mention d'essai/renouvellement pour
  Impulsion) — signalé comme nécessitant encore une relecture juridique,
  gap déjà connu.
- **"HI × AI™" retiré de la nav app authentifiée** (`app-nav.tsx`) —
  répétait la même accroche que le kicker du hero à quelques centimètres
  d'écart (déjà retiré de la nav publique lors d'une session précédente).
- **Manifeste corrigé** (Elsa : « tu ne relis le programme que si on paie
  l'abonnement... mais ce paragraphe dit que tu le relis toujours ») — le
  texte affirmait à tort qu'Anthony relit systématiquement chaque
  programme ; corrigé pour préciser que c'est vrai sur Transformation
  uniquement, jamais sur Impulsion (généré par l'IA seule, sans relecture)
  — homepage et `/a-propos`.
- **Section vidéo retirée de la homepage** (vidéos générées par IA, pas
  Anthony lui-même) — sur demande directe d'Anthony, en attendant une vraie
  vidéo tournée par lui.
- **Vérification d'email avant création de compte** (Elsa : « on peut
  entrer des fausses adresses pour créer des comptes ») — `/sign-up`
  (flow email/mot de passe) n'utilise plus une session Supabase immédiate :
  si aucune session n'est retournée (email de confirmation en attente),
  affiche un écran "Vérifie ta boîte mail" au lieu de continuer. Réutilise
  entièrement l'infrastructure existante (`/auth/callback`,
  `/completer-inscription`, déjà construits pour Google OAuth) — zéro code
  nouveau côté confirmation, juste le bon déclenchement. **Dépend d'un
  réglage Supabase côté dashboard** (Authentication → Providers → Email →
  "Confirm email") — à activer par Anthony, sinon Supabase continue de
  renvoyer une session immédiate et le comportement reste inchangé (aucune
  régression si oublié, juste la protection pas encore active).

**Vérifié** : `tsc --noEmit` et `next build` réels, propres après chaque
lot de changements. Playwright réel (mobile 390px, desktop 1440px/1440px)
sur le hero (masque, anneau logo, contraste) à chaque itération.

**Non testable depuis ce sandbox** : le flow de vérification email de bout
en bout (pas d'accès Resend/Supabase réel) — logique vérifiée par lecture
de code et par la réutilisation d'un chemin déjà éprouvé (Google OAuth). À
confirmer par Anthony : activer "Confirm email" sur Supabase, puis créer un
compte test et vérifier la réception du mail + le retour correct vers
`/completer-inscription` après clic.

## Hero (photo studio) + vitrine personnalisée "besoins → services" (14/08/2026)

Suite directe du nouveau modèle d'accès libre (section suivante) : Anthony a
d'abord itéré longuement sur le hero de la homepage (photo studio premium
envoyée par ses soins, uploadée via l'UI GitHub dans `public/`), puis a
formulé une direction produit plus large — « le SaaS doit être comme une
boutique : facile d'entrer, on garde les gens dedans, on leur propose les
services qui répondent aux besoins identifiés au diagnostic ».

**Hero (`coai-intro.tsx`)** — plusieurs itérations dans la même session :
- Photo repositionnée en corps entier (`aspect-[941/1672]`, le ratio natif
  du fichier) à gauche, titres à droite (`lg:items-start` pour un alignement
  net en haut plutôt que centré) — remplace l'ancien plein cadre avec texte
  superposé, qui cachait le visage derrière la carte de titre.
- La photo contient son propre logo "COAI" imprimé en haut à gauche (fichier
  fourni par Anthony) — masqué par un dégradé radial opaque plutôt que
  retouché dans le fichier source, pour ne pas doubler avec le logo de la
  nav juste au-dessus.
- Un seul CTA désormais : "Commencer ma transformation — Diagnostic offert"
  → `/diagnostic` (remplace les deux boutons concurrents précédents).
- Kicker : "Bienvenue sur la première plateforme de coaching sportif
  hybride...", en bleu (`#4a9fc9`, ton distinct du doré déjà utilisé
  ailleurs) — le "HI × AI™" sous le logo de la nav (`site-nav.tsx`) a été
  retiré en échange, pour ne plus répéter deux fois la même accroche à
  quelques centimètres d'écart.
- "Sculptez" et "intelligent" mis en doré (`text-laiton-300`) comme
  "performances" l'était déjà, pour homogénéiser l'accent visuel du titre.

**Vitrine personnalisée sur le dashboard** — premier bloc concret de la
direction "boutique" : le diagnostic identifie déjà des signaux réels
(persona/frustration, objectif, contraintes santé, niveau, fréquence) mais
rien n'en était fait après l'inscription. Nouveau moteur déterministe
(`src/lib/dashboard/besoins-identifies.ts`, aucun appel IA) qui traduit ces
signaux en besoins concrets, chacun associé au service COAI qui y répond :
- Pas de structure ("Je ne sais pas quoi faire à la salle" / "sans
  structure") → **Impulsion** (19€, programme généré tout de suite).
- Plateau ("Même programme depuis des années, sans résultat") → **Transformation**
  (le suivi qui adapte réellement dans le temps).
- Contrainte santé cochée ou persona "sans me blesser" → **Transformation**
  (validation humaine avant que ce soit définitif).
- Niveau Avancé + objectif force/performances → **VIP** (1-to-1, optimisation
  fine).
- Fréquence 6×/semaine ou plus → **Transformation** (enjeu de suivi
  charge/récupération à ce volume).
- Objectif "Me sentir mieux au quotidien" / reprise de sport → **Impulsion**
  suffit, pas de survente.

Toute la liste des besoins détectés s'affiche (pas seulement le premier),
filtrée pour ne jamais repousser un service déjà actif
(`hasProgrammeAccess`/`hasSuiviAccess`, réutilisés tels quels). Chaque
besoin a son propre CTA d'achat direct (`OneShotProgrammeButton`/
`SubscribeButton`), avec le même geste de consentement légal
(`OffreConsentGate`, texte identique à `/pricing`) que partout ailleurs où
un vrai paiement se déclenche — jamais de bouton d'achat sans cette étape.

**Nouveau champ** `Profile.persona` (les frustrations/points de départ
cochés au diagnostic — ex: "Je ne sais pas quoi faire à la salle" — jusque-là
capturées uniquement pour l'email de lead, jamais persistées sur le profil
réel). Capturé dans `reponsesEnProfil()` (fonction déjà partagée entre le
pont pré-inscription et la mise à jour directe pour un visiteur connecté),
donc propagé automatiquement aux deux parcours sans duplication de logique.
Migration `20260814010000_add_profile_persona`, additive.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. `BesoinsIdentifiesCard`
testée par montage isolé avec données simulées (Playwright, mobile 390px et
desktop 1200px, aucun débordement) — le dashboard réel nécessite une
authentification que ce sandbox ne peut pas simuler. Hero revérifié mobile/
desktop après chaque itération (photo, masque logo, alignement, CTA unique).

**Non testable depuis ce sandbox** : le calcul réel des besoins sur un vrai
profil (pas d'accès Supabase) — logique vérifiée par lecture de code et par
le montage isolé du composant d'affichage uniquement. À confirmer par
Anthony : faire le diagnostic avec une contrainte santé ou une persona de
plateau, puis vérifier que le bon besoin/service apparaît sur `/dashboard`.

**Reste ouvert, pas tranché par Anthony** : où mettre le curseur "combien de
besoins afficher à la fois" si le diagnostic en détecte beaucoup (jugement
retenu ici : tout afficher, jamais plus de 6 règles ne peuvent se déclencher
simultanément vu leur exclusivité relative) ; et si cette vitrine doit aussi
apparaître ailleurs que le dashboard (page de pilier verrouillée ?).

## Écran plein tarif par service, façon paywall d'app mobile (14/08/2026)

Suite du bloc précédent : Anthony a montré en référence le paywall
"SuperGrok" (nom de l'offre en grand, onglets pour comparer les paliers,
liste de bénéfices avec icônes, bascule mensuel/annuel, un CTA plein). Il
veut la même chose quand quelqu'un clique sur un service — pas juste un
bouton isolé, un vrai écran comparatif avec tous les tarifs.

Nouveau `ServiceDetailModal` (`src/components/marketing/service-detail-modal.tsx`) :
plein écran, X pour fermer, onglets Impulsion/Transformation/VIP pour
comparer sans quitter l'écran, liste des bénéfices avec puce dorée, bascule
mensuel/annuel (Transformation), prix, puis le vrai bouton d'achat — même
`OffreConsentGate`/texte légal que `/pricing`, jamais de paiement sans ce
geste. Contenu des offres déplacé dans `src/lib/pricing/tiers.ts`, source
unique réutilisée par `/pricing` (comportement inchangé, juste le contenu
extrait) et par le nouveau modal — aucune divergence possible entre les
deux endroits.

Branché en premier sur `BesoinsIdentifiesCard` (dashboard) : chaque besoin
identifié propose désormais "Voir les tarifs" (ouvre le modal, pré-
sélectionné sur le service concerné) plutôt qu'un bouton d'achat direct
isolé. Pas encore branché sur `/pricing` lui-même (les cartes existantes
gardent leur CTA direct, qui fonctionne déjà) — à étendre si Anthony veut
ce même écran partout où un service est cliqué.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Montage isolé
par Playwright (mobile 390px, desktop 1200px) : bascule d'onglet
Impulsion/Transformation/VIP, bascule mensuel/annuel, prix et CTA corrects
par onglet, aucun débordement. `/pricing` revérifié fonctionnel après
extraction du contenu (200 sur la route).

**Non testable depuis ce sandbox** : le vrai clic "Voir les tarifs" depuis
un dashboard authentifié (pas d'accès Supabase) — logique vérifiée par
montage isolé du modal avec les mêmes props uniquement.

## Nouveau modèle d'accès libre — inscription gratuite, 4 offres indépendantes (13/08/2026)

Changement de stratégie décidé par Anthony : l'inscription ne déclenche plus
aucun paiement. Un compte se crée gratuitement, sans carte bancaire, et donne
accès à toute l'interface (dashboard, pages de programme, suivi) — chaque
section verrouillée affiche un aperçu explicatif et le bon bouton de
déblocage au lieu d'un simple blocage. Remplace l'ancien modèle où
`/sign-up` redirigeait systématiquement vers Stripe Checkout.

Quatre offres indépendantes, déclenchables séparément depuis n'importe où
dans l'interface (dashboard, page de pilier, `/pricing`) :

- **Impulsion — 19€, paiement unique** (avant : 19€/mois avec essai 7 jours).
  Change de nature : ce n'est plus un abonnement Stripe mais un `mode:
  "payment"` classique (même pattern que les packs VIP), tracé sur
  `User.programmeUnlockedAt` plutôt que sur le modèle `Subscription`
  (pensé pour un cycle récurrent, pas adapté à un achat unique). Nouvelle
  route `POST /api/stripe/checkout-programme` + nouveau cas dans le webhook
  (`session.mode === "payment" && metadata.oneShotProgramme`).
- **Transformation — 49€/mois, abonnement récurrent** (inchangé côté
  Stripe/essai 7 jours) : programme évolutif, coach IA illimité, et une
  visio incluse sur demande (déjà construites par une session précédente,
  simplement rebranchées à ce nouveau parcours). Contenu confirmé par
  Anthony : programme évolutif + coach IA illimité + coaching visio sur
  demande — implémenté en V1 comme un simple bouton "Demander une visio"
  qui notifie Anthony (pas de système de réservation/calendrier, décision
  explicite d'Anthony pour rester simple à ce stade).
- **VIP** : inchangé (séances à l'unité/pack, déjà fonctionnel).
- **Entreprise** : redevient une 4e colonne à côté de VIP sur `/pricing`
  (elle avait été sortie en bandeau séparé lors de la correction responsive
  du 11/08) — sur devis, toujours hors Stripe.

**Nouvelle fonction d'accès** (`src/lib/subscription/plan.ts`) :
`hasProgrammeAccess(user, subscription)` — vrai si `programmeUnlockedAt` est
renseigné OU si un abonnement Transformation est actif (qui inclut déjà la
génération). `hasSuiviAccess(subscription)` — vrai uniquement pour
Transformation actif (adaptation continue, coach IA illimité, visio).
`canGenerateProgramme` (ancienne fonction) conservée telle quelle pour ne
rien casser ailleurs, mais plus utilisée sur le nouveau chemin.

**Consentement légal déplacé** — jusqu'ici recueilli une seule fois à
l'inscription (en même temps que le paiement). Comme l'inscription ne paie
plus rien, ce serait devenu un consentement sans objet réel à ce moment-là.
Nouveau composant `OffreConsentGate`
(`src/components/compte/offre-consent-gate.tsx`) : case à cocher avec le
texte exact de l'offre concernée (paiement unique + renonciation au droit de
rétractation pour Impulsion ; essai 7 jours + facturation automatique pour
Transformation), affichée juste avant le bouton d'achat réel, où qu'il
apparaisse (dashboard, page de pilier, `/pricing`, écran post-inscription).
RGPD et aptitude sportive restent recueillis à l'inscription (ils concernent
l'usage de l'app en général, pas un paiement précis).

**Décalage webhook Stripe absorbé différemment** — `ActivationFlow`
(`/bienvenue`) ne se base plus sur un accès pré-calculé au chargement de la
page pour décider d'appeler la génération : elle tente directement
`/api/programmes/generate` (qui revérifie l'accès en base à chaque appel),
avec les 3 tentatives espacées déjà existantes pour laisser le temps au
webhook Stripe d'arriver. Si toutes les tentatives renvoient 403 (vraiment
rien débloqué), écran d'achat ; si ça échoue autrement, écran d'erreur
générique. Évite qu'un achat qui vient de réussir affiche par erreur l'écran
de déblocage à cause d'un webhook simplement pas encore arrivé.

**`/bienvenue` sert désormais deux moments distincts** — juste après une
inscription libre (aucun paramètre `plan`/`unlock` dans l'URL, accueil neutre
sans les événements de conversion Meta/GA4) et juste après un vrai achat
(paramètres posés uniquement par les routes Stripe elles-mêmes dans leur
`success_url`, jamais déduits d'une intention côté client) — seul ce second
cas garde la carte d'embarquement et déclenche `StartTrial`/`Subscribe`.

**Migration** : `20260814000000_add_programme_one_shot_unlock` — additive,
`ADD COLUMN "programmeUnlockedAt" TIMESTAMP(3)` sur `users`. Nouvelle
variable d'environnement à renseigner sur Vercel avant déploiement :
`STRIPE_PRICE_ID_PROGRAMME_ONE_SHOT` (price Stripe en mode paiement unique,
19€ — à créer sur le dashboard Stripe, cf. `.env.example`).

**Vérifié** : `npx tsc --noEmit` et `next build` réels, propres. Playwright
réel (mobile 390px, desktop 1440px) sur `/pricing` : 4 colonnes sans
débordement horizontal, case de consentement qui révèle le bon bouton
d'achat une fois cochée, clic sur le bouton Impulsion en visiteur non
connecté qui redirige bien vers `/sign-up` (jamais de paiement sans
compte). `/sign-up` vérifié sans aucune trace de texte d'engagement de
paiement, formulaire simplifié (prénom/email/mdp + RGPD + aptitude
sportive uniquement).

**Non testable depuis ce sandbox** (mêmes limites que d'habitude : pas
d'accès à Supabase/Stripe en conditions réelles) : le parcours complet
authentifié (inscription → dashboard verrouillé → clic déblocage → vrai
paiement Stripe → webhook → programme généré) n'a pas pu être exécuté de
bout en bout avec un vrai compte. À tester par Anthony après déploiement,
dans l'ordre : créer un compte, vérifier qu'aucun paiement n'est demandé et
que le dashboard affiche l'écran "programme pas encore débloqué", débloquer
Impulsion (19€) et vérifier la génération, puis tester Transformation
(abonnement + bouton "Demander une visio") séparément.

**Explicitement pas fait** : bibliothèque vidéo d'exercices (dataset externe
identifié — GIFs en français, licence à vérifier avant intégration — mais
pas branché), corrections HeyGen/Meta Ads (hors périmètre code), coquille
"texnika" mentionnée par Anthony — introuvable dans le dépôt à ce jour, sa
localisation exacte reste à préciser.

## Homepage — essai 7 jours et vidéo d'introduction (12/08/2026)

L'essai de 7 jours est désormais visible dans le hero avant le titre, dans le
CTA principal et sous forme d'une mention transparente : carte demandée, puis
19 € ou 49 €/mois, annulation possible avant la fin de l'essai. Le diagnostic
offert reste un CTA distinct pour ne pas confondre diagnostic sans inscription
et essai Stripe.

La vidéo COAI existante `public/hero-intro.mp4` est intégrée juste sous le hero
avec contrôles natifs, lecture mobile inline et chargement différé des données
vidéo (`preload="metadata"`). Aucun média générique ou contenu inventé n'a été
ajouté.

Une seconde vidéo fournie par Anthony est ajoutée immédiatement à la suite
(`public/coai-presentation-2.mp4`). Elle dispose de son propre lecteur, reste
sans autoplay et utilise également `preload="metadata"` pour éviter de charger
les deux fichiers complets avant une action du visiteur.

## Phase 10 — COAI Coach / B2B, bloc 1 (12/08/2026)

Le dashboard coach existant devient une file quotidienne réellement
priorisée. Les signaux sont ordonnés par enjeu : douleur, baisse de
performance, inactivité, puis mesure manquante. Les programmes en attente
apparaissent dans la même file ; chaque client dispose d'un accès direct à son
dossier et, si son numéro existe, d'un message WhatsApp prérempli adapté au
signal prioritaire.

Ce premier bloc réutilise strictement les comptes Transformation, validations,
alertes et droits administrateur existants. Il n'ajoute ni rôle Coach, ni
multi-tenant, ni marque blanche, ni facturation B2B. Le score sert uniquement
à ordonner le travail humain et n'est jamais présenté comme un diagnostic.

Le bloc 2 ajoute au dossier client des notes internes horodatées avec auteur,
création et suppression. Elles sont accessibles exclusivement aux
administrateurs via des routes qui revérifient `isAdmin`, n'apparaissent dans
aucun écran ni export client et vivent dans `coach_notes`, table avec RLS actif
et aucune politique Data API. Migration additive :
`20260812104500_add_coach_notes`.

Le bloc 3A ajoute un portefeuille coach exhaustif sur `/admin/clients` :
recherche par identité/email, filtre des clients à surveiller, priorité des
alertes et accès direct au dossier. Il réutilise les abonnés Transformation,
les alertes et les notes existantes, sans nouveau rôle ni nouvelle donnée.
Le rôle Coach et les affectations individuelles restent le bloc 3B : ils ne
seront ajoutés qu'avec une migration Supabase testable et un cloisonnement
serveur vérifié.

## Phase 9 — cartes de progression partageables, bloc 1 (12/08/2026)

Les records physiques et adaptations de programme disposent désormais d'un
bouton de partage réel. Sur mobile, la Web Share API transmet directement la
carte PNG aux applications compatibles ; sur desktop, la même action
télécharge le fichier. Les cartes d'adaptation carrées reprennent le pilier,
la décision, son explication et l'adresse du diagnostic COAI.

Les images sont générées à la demande, sans stockage supplémentaire ni appel
IA. Chaque endpoint vérifie côté serveur que l'enregistrement appartient à
l'utilisateur connecté : aucun record ni résumé privé n'est publiquement
accessible. Ce bloc ne crée pas encore de galerie publique ni de publication
automatique sur un réseau social.

Le bloc 2 ajoute sur `/suivi/progression` un bilan partageable des 30 derniers
jours : nombre de séances et semaines actives uniquement. Poids, mensurations,
photos, douleurs et objectifs personnels en sont volontairement exclus. Le
visuel reprend l'axe de marque « Plus COAI me connaît, meilleur devient mon
coaching » et renvoie vers le diagnostic public.

Le bloc 3 relie les cartes au parrainage existant. Au partage mobile, le texte
contient le lien personnel du membre ; sur desktop, l'image est téléchargée et
le lien copié. La page Abonnement propose également un partage natif direct.
Les événements `progress_shared` et `referral_link_shared` permettent de
mesurer l'usage dans GA4, sans nouvel outil ni nouvelle donnée en base.

Le bloc 4 remplace l'arrivée directe sur l'inscription par
`/invitation/[code]`, qui mémorise le parrain puis redirige vers le diagnostic
gratuit avec une attribution UTM dédiée. Le filleul voit donc le résultat
personnalisé avant l'offre ; le code survit trois jours, à tout le tunnel et à
l'aller-retour Google OAuth. Les liens déjà partagés vers `/sign-up?ref=`
restent compatibles.

Le bloc 5 ajoute au dashboard `/admin/business` une section Acquisition
virale : liens personnels créés, filleuls inscrits (dont 30 jours), filleuls
encore en essai et conversion payante. Ces métriques reposent exclusivement
sur les relations et récompenses déjà persistées en base. Les interactions de
partage restent mesurées dans GA4 et ne sont pas artificiellement assimilées
aux liens simplement générés.

Le bloc 6 personnalise l'arrivée du filleul sur le diagnostic : un encart
« Invitation COAI » explique que le parcours dure environ deux minutes, reste
gratuit et montre le résultat avant toute décision. Aucune identité du parrain
n'est exposée et aucun témoignage n'est fabriqué. L'événement GA4
`referral_invitation_opened` mesure les ouvertures réelles.

Le bloc 7 termine la boucle virale au moment de satisfaction le plus naturel :
après une séance Daily terminée et son ressenti enregistré. La carte indique
uniquement « Séance accomplie », la durée disponible choisie et le nombre de
séances terminées sur 30 jours. Exercices, charges, douleur, ressenti et profil
restent privés. Le partage réutilise le composant et le lien de parrainage des
blocs précédents.

## Phase 8 — économie IA et vérité du revenu, bloc 1 (12/08/2026)

Premier bloc volontairement sans modification des prix ni des abonnements
clients. COAI mesure désormais chaque appel Anthropic par fonctionnalité :
programme, adaptation, Coach web/Daily/WhatsApp et analyses vision. Seuls le
modèle et les volumes de jetons sont conservés ; jamais les prompts, réponses
ou données de santé. Le coût estimé au moment de l'appel est historisé dans
`ai_usage_events`, table interne avec RLS sans politique Data API.

Le dashboard `/admin/business` affiche sur 30 jours : appels, coût total,
coût par appel, coût par utilisateur et répartition par fonction. Les tarifs
peuvent être précisés par `AI_INPUT_USD_PER_MILLION` et
`AI_OUTPUT_USD_PER_MILLION`.

Audit business corrigé en parallèle : le MRR incluait Transformation et
l'ancien Premium mais oubliait complètement Impulsion à 19 €. Il pouvait
aussi compter les essais non encore facturés. Le MRR est maintenant
conservateur : Impulsion + Transformation + anciens Premium réellement sortis
d'essai. Essais actifs, paiements en retard et annulations récentes sont
affichés séparément.

Migration additive : `20260812080000_add_phase_8_ai_economics`, appliquée sur
Supabase et vérifiée (RLS actif, quatre index). Le suivi d'usage est non
bloquant : une panne de mesure ne prive jamais l'utilisateur de sa réponse IA.

## Phase 7 — Mémoire COAI, premier bloc (12/08/2026)

La page `/programme/evolution` rend désormais la mémoire longitudinale
compréhensible et vérifiable, sans nouvelle table ni appel IA. Elle réutilise
les séances, check-ins hebdomadaires et quotidiens, tests physiques, repas et
activité déjà enregistrés.

- jauge de maturité par source (entraînement, récupération, progression,
  nutrition, activité et Daily), calculée à partir des seuils minimum réels ;
- chaque conclusion indique sa preuve et son statut « En observation » ou
  « Établi » ; aucune carte n'apparaît sous le seuil requis ;
- nouveau signal « Temps disponible habituel » issu des check-ins Daily ;
- fréquence calculée sur toutes les semaines consécutives observées, y compris
  celles sans séance, pour ne pas gonfler artificiellement l'habitude ;
- progression considérée prête uniquement si plusieurs tests concernent le
  même exercice ;
- navigation renommée « Mémoire & évolution » ; programme source, adaptations,
  Stripe et abonnements inchangés.

### Tendances longitudinales (suite Phase 7)

Ajout d'un moteur déterministe séparé (`tendances-longitudinales.ts`) qui
compare les check-ins Daily et ressentis post-séance. Il affiche uniquement :

- taux de séances Daily terminées à partir de 5 check-ins ;
- ressenti dominant à partir de 5 séances évaluées et d'une majorité ≥ 50 % ;
- association récupération/ressenti seulement avec au moins 3 séances dans
  chacun des deux groupes et un écart ≥ 25 points.

Le texte parle explicitement d'association observée, jamais de causalité ou de
prédiction. Quatre assertions couvrent les seuils, le dosage, la régularité et
la comparaison récupération. Vérifié en navigateur 390×844 et 1440×1000,
sans débordement, requête pendante, overlay ni loader. Captures :
`test-results/phase-7-longitudinal-mobile.png` et
`test-results/phase-7-longitudinal-desktop.png`.

### Coach IA connecté à la mémoire (suite Phase 7)

`/api/coach/ask` recalcule désormais la mémoire côté serveur avant chaque
réponse et transmet au prompt au maximum 8 observations et 3 tendances. Le
navigateur ne peut pas fournir ou altérer ces apprentissages. Les statuts
« En observation » / « Établi », preuves et garde-fous association ≠ causalité
sont conservés dans le prompt. Si la mémoire échoue isolément, le Coach reste
disponible sans elle. Les quotas et le nombre d'appels IA restent inchangés.

La page `/coach` affiche le pourcentage de mémoire et le nombre d'observations
et tendances disponibles. Trois assertions valident présence, absence à vide
et garde-fou de prédiction dans le prompt. Build et navigateur vérifiés en
390×844 et 1440×1000 sans débordement, requête pendante ou overlay. Captures :
`test-results/phase-7-coach-memory-mobile.png` et
`test-results/phase-7-coach-memory-desktop.png`.

Vérifié avec TypeScript, ESLint, build Next.js et navigateur réel en 390×844
et 1440×1000 : aucun débordement, overlay ou loader. Captures :
`test-results/phase-7-memory-mobile.png` et
`test-results/phase-7-memory-desktop.png`.

## Phase 6.1 — Daily COAI / Aujourd'hui (12/08/2026)

Phase 6.1 implémentée sans modifier Stripe, les abonnements, le trial, les
tarifs, l'authentification ou le tunnel diagnostic. Phase 6.2 non commencée.

### Correctif UX séance interactive (12/08/2026)

Après le premier test réel, une ancienne V1 présentait 7 exercices mais aucun
gainage identifiable ni `retourAuCalme`. Le Daily normalise désormais ces V1
uniquement dans la copie quotidienne : ajout d'un dead bug contrôlé sans charge
avec consigne d'arrêt au moindre inconfort et d'un retour au calme prudent. Le
programme source reste intact. Lors d'une réduction de durée, le finisher
gainage est conservé avec les exercices prioritaires.

La fiche longue est remplacée par un parcours interactif en quatre phases :
échauffement, renforcement, abdos/gainage, retour au calme. Chaque exercice est
repliable et cochable, les consignes détaillées s'ouvrent à la demande et une
barre indique la progression. Testé en 390×844 avec `agent-browser` : contenu,
progression, ouverture/validation d'exercice, gainage et retour au calme
visibles, sans overlay ni erreur navigateur. Captures :
`test-results/daily-interactive-mobile.png` et
`daily-interactive-finishers-mobile.png`.

Le bouton « Besoin d'aide pendant la séance ? » ouvre un Coach IA contextuel
en panneau mobile/desktop. Il reçoit uniquement le check-in du jour, la séance
et l'exercice actuellement ouverts, réutilise `/api/coach/ask` et ses quotas
existants, et ne modifie jamais le programme ni la séance enregistrée. Les cas
de douleur déclenchent des suggestions prudentes. Vérifié en 390×844 et
1440×1000, captures `test-results/daily-coach-mobile.png` et
`daily-coach-desktop.png`.

- **Entrée principale** : `/dashboard` devient l'écran « Aujourd'hui » ;
  `/aujourdhui` redirige vers lui. En-tête contextuel, séance ou récupération,
  puis COAI Insight et un résumé NEAT compact.
- **Navigation** : cinq destinations principales, `Aujourd'hui / Programme /
  Suivi / Profil / Coach`. Avis, paramètres et abonnement restent secondaires
  sur desktop. Les routes existantes sont conservées.
- **Séance source** : sélection déterministe par jour français dans la dernière
  version validée ; si aucune version validée n'existe, la dernière V1
  `EN_ATTENTE` reste consultable avec « À valider par ton coach » clairement
  affiché. Un jour absent du tableau `seances` est un jour de repos.
- **Check-in quotidien** : sommeil (5 niveaux), énergie (5), douleur oui/non +
  zone, temps disponible (15/25/40/60/60+). Endpoint authentifié `/api/daily`.
- **Adaptation déterministe et explicable** (`src/lib/daily/session.ts`) : le
  temps réduit conserve les premiers exercices prioritaires ; mauvais sommeil
  ou énergie basse retire une série et les méthodes d'intensification ; une
  douleur suspend la séance plutôt que de pousser à travers la gêne. Chaque
  changement et sa raison sont affichés.
- **Immutabilité** : `ProgrammeGenerated.contenu` n'est jamais mis à jour. La
  nouvelle table `daily_sessions` conserve une photographie JSON de la séance
  source, la séance adaptée, sa raison, la version du programme, le check-in,
  la fin de séance et le feedback. Une ligne par utilisateur/jour.
- **Feedback** : trop facile / bien dosée / trop dure, douleur oui/non,
  commentaire facultatif, tous enregistrés dans `daily_sessions`.
- **États** : profil incomplet, aucun programme, génération explicite et bornée
  à 90 s, programme disponible, Transformation en attente, entraînement et
  repos. Aucun loader Daily ne dépend d'un polling infini.
- **Migration** :
  `20260812023000_add_daily_coai_phase_6_1`, additive uniquement, avec RLS
  activé par défense en profondeur ; la table reste utilisée via Prisma côté
  serveur, pas directement depuis le client Supabase.
- **Vérification locale** : Prisma generate, `tsc --noEmit`, ESLint ciblé et
  `next build` propres. Six assertions de règles métier (jour de séance/repos,
  25 min, faible récupération, douleur, séance inchangée). Playwright Chromium
  réel : 390×844 et 1440×1000, scénario 25 min + faible récupération,
  douleur prudente, Transformation en attente et check-in interactif avec API
  simulée ; aucune erreur console, aucun débordement horizontal, aucun loader
  résiduel. Captures dans `test-results/daily-mobile.png`,
  `daily-desktop.png`, `daily-pain-mobile.png`.

## Workflow coach : lien direct depuis l'email de validation (11/08/2026, nuit)

Anthony recevait bien l'email "Nouveau programme à valider" mais le lien
pointait vers `/admin/programmes` (liste générale) — sur mobile, non
connecté, ça demandait une authentification puis laissait sur la liste
plutôt que le bon programme. Objectif : email → clic → auth si besoin →
retour automatique sur le programme précis → validation. Protection de
`/admin` inchangée (toujours vérifiée côté serveur).

- **`src/lib/auth/safe-redirect.ts`** (nouveau) — `sanitizeReturnTo()` :
  n'accepte qu'un chemin interne relatif (commence par un seul `/`, jamais
  `//` ni `://` dans la valeur) — anti-open-redirect. Utilisé à la fois
  côté client (avant `router.push`) et côté serveur (`/auth/callback`),
  jamais une seule ligne de défense.
- **`middleware.ts`** posait déjà `redirect_to` sur l'URL de `/sign-in`
  lors d'une redirection auth (mécanisme existant, juste jamais exploité
  en aval) — `sign-in/page.tsx` le lit maintenant via `useSearchParams`,
  le sanitize, et redirige dessus après connexion réussie (email/mot de
  passe **et** Google OAuth, ce dernier en le faisant transiter par
  `GoogleSignInButton` → `/auth/callback?redirect_to=...` →
  `auth/callback/route.ts`, qui le revalide côté serveur avant d'y
  rediriger).
- **Lien de l'email** — `/api/programmes/generate/route.ts` et
  `src/lib/adaptation/engine.ts` (notification "Adaptation à valider")
  pointent désormais vers `/admin/clients/{userId}` (fiche client précise,
  déjà existante depuis la Phase 4, jamais eu besoin d'une nouvelle route)
  au lieu de `/admin/programmes`.
- **Email enrichi** — `src/lib/email/coach-notification.ts` (nouveau) :
  vrai HTML (DA noir/or COAI, styles inline pour compatibilité Gmail/Apple
  Mail) avec prénom/email, piliers générés, date, et CTA "VALIDER LE
  PROGRAMME" — remplace l'ancien texte brut avec URL nue, uniquement pour
  la notification "Nouveau programme à valider" (celle explicitement
  visée par le brief). `sendEmail`/`sendAdminNotification`
  (`src/lib/email/client.ts`) acceptent maintenant un `html` optionnel en
  plus de `text` (Resend envoie les deux, tous les appelants existants
  restent inchangés). Aucune donnée de santé/personnelle dans l'email —
  juste prénom/email déjà présents dans l'ancienne version, piliers et
  date ; le contenu réel du programme reste uniquement accessible derrière
  l'authentification + vérification `isAdmin` sur `/admin/clients/[id]`.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Test
Playwright réel (mobile + desktop) confirmant qu'un accès non authentifié à
`/admin/clients/abc123` redirige bien vers
`/sign-in?redirect_to=%2Fadmin%2Fclients%2Fabc123` (le mécanisme que
`sign-in/page.tsx` exploite ensuite pour revenir au bon endroit après
connexion).

**Non testable depuis ce sandbox** : le flow complet email → clic → login
→ retour automatique nécessite un vrai email Resend reçu et un vrai compte
admin authentifié (pas de réseau sortant vers Resend/Supabase depuis ce
sandbox) — la mécanique de redirection elle-même est vérifiée (ci-dessus),
mais le parcours de bout en bout reste à confirmer par Anthony en
conditions réelles : cliquer sur "Valider le programme" dans un vrai
email reçu, sur mobile non connecté puis desktop déjà connecté.

## Carte premium Transformation sur l'inscription (11/08/2026, nuit)

Demandé juste après la simplification à parcours unique ci-dessous : l'offre
Transformation restait noyée dans un paragraphe gris discret, au même
niveau visuel qu'une mention légale — pas désirable, pas assez visible.
UI/UX uniquement, aucune logique Stripe/trial/prix touchée (confirmé par
`git diff` avant de committer : seuls des `className`/JSX changent, aucune
ligne de `handleSubmit`).

- **`sign-up/page.tsx` + `completer-inscription-form.tsx`** (même traitement
  dans les deux, pour éviter la divergence entre le flow email/mot de passe
  et le flow Google OAuth) : le paragraphe gris remplacé par une vraie carte
  DA noir/or COAI (`border-laiton-400/40`, `bg-laiton-400/[0.07]`) — badge
  "TRANSFORMATION", "7 jours offerts" en grand (`font-display text-2xl`,
  couleur laiton) à côté de "puis 49€/mois", puis les 5 bénéfices demandés
  en liste à coche. CTA changé en "Commencer mes 7 jours offerts"
  (uniquement pour Transformation — Impulsion garde "Commencer
  gratuitement", non touchée).
- Consentements RGPD/aptitude/CGV et toute la logique de soumission
  (`handleSubmit`, l'appel à `/api/stripe/checkout`) strictement inchangés.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Script
Playwright réel (pas de simulation) sur `/sign-up?plan=STANDARD`, 3 largeurs
(390px, 375px iPhone SE, desktop 1280px) — présence confirmée de "7 jours
offerts" et du nouveau CTA, **aucun débordement horizontal** mesuré
(`scrollWidth` vs `clientWidth`) à aucune des 3 largeurs. Impulsion revérifiée
en parallèle pour confirmer l'absence de régression (CTA "Commencer
gratuitement" toujours présent, paragraphe gris inchangé). Captures mobile
et desktop envoyées à Anthony.

## Correction prioritaire — offre Transformation à parcours unique (11/08/2026, nuit)

Signalé par Anthony : l'ancien double choix "7 jours offerts" / "Démarrer
tout de suite — 49€/mois dès aujourd'hui" traînait encore sur l'inscription
Transformation, alors que ce même choix avait déjà été retiré d'Impulsion
plus tôt dans la nuit. Retiré uniquement pour Transformation ici — Impulsion,
VIP, le diagnostic, le profil et la génération non touchés, comme demandé.

- **Frontend** (`sign-up/page.tsx`, `completer-inscription-form.tsx`) : le
  bloc à deux boutons (`skipTrial` toggle) supprimé pour STANDARD, remplacé
  par le même texte informatif à parcours unique qu'Impulsion (adapté :
  "généré à partir de ton profil et affiché comme « à valider par ton
  coach »"). Case de consentement et CTA final ("Commencer gratuitement")
  également unifiés — plus de branche conditionnelle sur `skipTrial`, l'état
  React `skipTrial` supprimé des deux composants.
- **Backend Stripe** (`/api/stripe/checkout`) — point important soulevé par
  Anthony : *"il ne suffit pas de modifier l'interface"*. Avant cette
  correction, la route acceptait `skipTrial: true` dans le body pour
  n'importe quel plan non-PREMIUM (`plan !== "PREMIUM"`) — un appel direct à
  l'API (hors UI) pouvait donc encore facturer Transformation immédiatement.
  Restreint explicitement à `plan === "GRATUIT"` : Transformation ne peut
  plus jamais sauter l'essai, quoi que le client envoie. Impulsion garde la
  capacité côté backend (son interface ne l'utilise déjà plus non plus,
  donc aucun changement de comportement réel pour elle).

**Vérifié** : `tsc --noEmit` et `next build` réels, propres (bundle
`/sign-up` réduit de 4,84 kB à 4,49 kB, cohérent avec le code mort retiré).
Script Playwright réel (pas de simulation) sur `/sign-up?plan=STANDARD` :
recherche textuelle sur la page rendue confirmant l'absence complète de
"Démarrer tout de suite" et "Démarrer maintenant", présence de "Commencer
gratuitement" — mobile et desktop. Même vérification sur `/sign-up`
(Impulsion) pour confirmer l'absence de régression. Capture mobile
envoyée à Anthony : carte unique, "7 jours offerts · puis 49€/mois", CTA
unique.

## Phase 5.1 — correction structurante de l'onboarding (11/08/2026, nuit)

Brief formel : le diagnostic ne doit plus suffire à lui seul à déclencher la
génération du programme définitif — il sert à qualifier/personnaliser/
convertir, le profil sert ensuite à la précision. Nouveau parcours :
diagnostic → résultat → formule → compte/abonnement → profil préremplis →
compléter l'essentiel manquant → génération → (Transformation) validation
coach → première séance. Règle d'or : ne jamais redemander une info déjà
donnée dans le diagnostic. **Phase 6 non démarrée**, comme demandé.

**1. Architecture retenue** — plutôt qu'un gros chantier neuf, cette phase
étend 3 briques qui existaient déjà partiellement : le pont diagnostic→profil
(`storage.ts`, déjà branché sur `/api/profil`), un tracker de complétion
16 champs déjà présent (`computeProfilCompletion`, jusque-là un simple
ratio non pondéré sans notion d'essentiel/facultatif), et `ActivationFlow`
(déjà l'écran post-abonnement). Le vrai changement : **conditionner la
génération automatique à la complétion du profil essentiel**, plutôt que de
la déclencher inconditionnellement dès qu'un diagnostic existe.

**2. Mapping diagnostic → profil** — déjà entièrement fonctionnel avant
cette session (`ActivationFlow` applique `readDiagnosticAnswers()` via
`PUT /api/profil` dès l'arrivée sur `/bienvenue`) : aucun changement
nécessaire ici, vérifié champ par champ que `DiagnosticAnswers` couvre bien
tout ce que `/api/profil` accepte.

**3. Champs essentiels (7, bloquent la génération)** — audité le moteur de
génération (`src/lib/programmes/generer.ts` + les 8 prompts
`src/lib/ai/prompts/*`) plutôt que de reprendre une liste supposée : objectif,
niveau, fréquence d'entraînement, durée de séance, équipement disponible,
âge, sexe. Tous les 7 sont déjà collectés par le diagnostic public — un
utilisateur qui l'a fait a donc l'essentiel à 100% dès son arrivée sur
`/bienvenue`, sans jamais rien resaisir.

Volontairement **pas** dans les essentiels malgré un usage réel par le
moteur : `contraintesSante` et `allergiesAlimentaires`. Piège identifié en
auditant : "vide" y est une réponse légitime et fréquente ("aucune
contrainte", "aucune allergie") — les rendre bloquants aurait pénalisé à vie
une personne en bonne santé qui n'a simplement rien à déclarer, sans moyen de
distinguer "jamais demandé" de "répondu aucune". Comptés en enrichissement à
la place (leur présence améliore le score, leur absence ne bloque jamais).

**4. Champs d'enrichissement (16 unités, jamais bloquants)** — lieu
d'entraînement, morphologie, antécédents médicaux, allergies, taille, poids,
sports pratiqués, habitudes alimentaires, repas/jour, hydratation, café,
alcool, sommeil, contraintes santé, + bracelet connecté et photo
morphologique comptés chacun pour **une seule unité** (une action = un point,
pas un point par champ auto-extrait, pour ne pas surpondérer ces deux
actions face aux champs saisis à la main).

**5. Logique du pourcentage** (`src/lib/profil/completion.ts`, réutilisé
partout : `ActivationFlow`, `/compte/profil`, garde-fou serveur) — 60% du
score sur les essentiels, 40% sur l'enrichissement, calculé en direct à
chaque affichage (jamais de palier hardcodé). Vérifié par script : profil
vide → 0%, juste après un diagnostic type → ~73% (essentiel déjà 7/7,
enrichissement partiel selon ce que le diagnostic a couvert), profil
totalement rempli → 100%. `essentielComplet` (booléen strict, 7/7) est ce qui
déclenche réellement la génération — jamais besoin d'atteindre 100%.

**6. Parcours Impulsion** — `ActivationFlow` inchangé dans l'esprit
(génération immédiate) mais désormais conditionné : si `essentielComplet`
(cas normal après diagnostic), génération auto comme avant, "Ton programme
est prêt" → "Commencer ma première séance". Si incomplet (abonnement direct
sans diagnostic, ou diagnostic abandonné avant les questions essentielles) :
écran "COAI te connaît à X%" (barre réelle, champs manquants listés) → CTA
"Compléter mon profil" → `/compte/profil?onboarding=1`, où un nouveau
bandeau (`GenererProgrammeOnboarding`) affiche "Ton profil est suffisamment
précis" + CTA manuel "Générer mon programme" dès que l'essentiel devient
complet (jamais de génération automatique silencieuse, cohérent avec le
reste de l'app — moteur d'adaptation, etc. — qui ne change jamais rien sans
geste explicite).

**7. Parcours Transformation** — même logique de profil minimum, avec la
notification coach déjà existante (`sendAdminNotification` dans
`/api/programmes/generate`, rien à ajouter) et le statut `EN_ATTENTE` déjà
existant (`StatutProgramme`, badge "À valider par le coach" déjà affiché sur
`/programme/entrainement`). Nouveauté : l'écran `ActivationFlow` juste après
génération distingue maintenant le plan — "À valider par ton coach" + CTA
"Découvrir mon programme" pour Transformation (au lieu de "Ton programme est
prêt" + "Commencer ma première séance", réservé à Impulsion dont le contenu
est déjà définitif).

**8. Email diagnostic** — l'envoi automatique existait déjà
(`/api/diagnostic-lead`, envoyé à la fin du quiz, résultat toujours visible
côté client indépendamment du succès de l'email). Ajouté cette session : (a)
**protection anti-doublon** — ne renvoie pas si la même adresse a déjà reçu
un email il y a moins de 5 min (double-clic/retry), un nouveau diagnostic
plus tard reste un envoi légitime ; (b) **CTA adapté au statut réel** du
destinataire (recherché par email : pas de compte → "Voir mes formules",
compte sans programme → "Compléter mon profil", compte avec programme →
"Voir mon programme") ; (c) **tracking** `diagnostic_email_sent` (nouveau,
`trackServerEvent`, déclenché uniquement si l'envoi a réellement réussi) ;
(d) **bug latent corrigé au passage** — l'admin notification et l'email
utilisateur partageaient un seul `Promise.all` sans catch individuel : un
échec de l'un (ex. souci transitoire du service email) aurait fait échouer
toute la route en 500, malgré le lead déjà écrit en base. Chacun a
maintenant son propre try/catch, tous deux toujours attendus avant de
répondre (jamais de "fire and forget" après le retour de la réponse — une
fonction serverless Vercel peut être suspendue juste après, sans garantie
d'exécution du reste).

**9. Routes/composants modifiés** — `src/lib/profil/completion.ts` (réécrit,
essentiel/enrichissement), `src/components/compte/profil-completion.tsx`
(réécrit), nouveau `src/components/compte/generer-programme-onboarding.tsx`,
`src/app/(app)/compte/profil/page.tsx` (bandeau onboarding conditionnel),
`src/components/onboarding/activation-flow.tsx` (réécrit, nouvel état
"completion", copy Transformation), `src/app/(app)/bienvenue/page.tsx`
(passe `plan`/`profilInitial`), `src/app/api/programmes/generate/route.ts`
(garde-fou serveur), `src/app/api/diagnostic-lead/route.ts` (dédoublonnage +
CTA + tracking + fix du Promise.all), `src/lib/diagnostic/mini-diagnostic.ts`
(CTA surchargeable), `src/lib/analytics/product-events.ts`
(`diagnostic_email_sent`, `userId` désormais nullable).

**10. Migration** — `20260812010000_add_diagnostic_email_tracking` : ajoute
`DiagnosticLead.resultEmailSentAt` (nullable, additive, `ADD COLUMN IF NOT
EXISTS`). **Reste à appliquer par Anthony** — automatique au prochain
déploiement grâce à `prisma migrate deploy` déjà en place dans `build`, rien
à coller manuellement.

**11. Tests effectués** — `npx tsc --noEmit` et `next build` réels, propres.
Script Node dédié validant `computeProfilCompletion` directement (7
assertions : profil vide, post-diagnostic, profil complet, contraintes/
allergies vides n'empêchant jamais l'essentiel, liste des champs manquants).
5 scripts Playwright réels (mobile 390px + desktop 1280px) montant les
composants directement avec fetch mocké (pas d'accès Supabase/Stripe depuis
ce sandbox) : Parcours A (Impulsion, diagnostic complet → génération
immédiate), Parcours B (Transformation → "À valider par ton coach"),
Parcours C (profil déjà complet sans diagnostic en localStorage → génération
auto, pas de détour par "compléter mon profil"), Parcours D (essentiel
incomplet → écran "COAI te connaît à X%"), et un test de génération qui
échoue systématiquement pour confirmer qu'aucun loader ne tourne
indéfiniment (état "erreur" atteint en ~4,7s, 3 tentatives bornées).
Bandeau "Générer mon programme" de `/compte/profil` aussi vérifié en
composant isolé (desktop + mobile).

**12. Captures** — desktop et mobile pour l'écran "COAI te connaît à X%"
(ActivationFlow), l'écran Transformation "À valider par ton coach", et le
bandeau de confirmation "Générer mon programme" sur `/compte/profil`.

**13. Reste à faire par Anthony** — appliquer la migration (automatique au
déploiement) ; tester en conditions réelles les 4 parcours sur le site
déployé (aucun accès Supabase/Stripe depuis ce sandbox pour un test de bout
en bout avec vraie authentification/abonnement) ; valider que la
catégorisation essentiel/enrichissement (en particulier le choix d'exclure
contraintesSante/allergiesAlimentaires du blocage strict) correspond bien à
l'intention côté sécurité/pertinence — c'est un jugement documenté ici, pas
une certitude absolue, à confirmer ou ajuster.

## Correction responsive des cartes tarifs (11/08/2026, nuit)

Anthony a testé `/pricing` en production après le déploiement de Phase 5.1
et constaté le problème "toujours non résolu" : hauteurs déséquilibrées,
CTA Impulsion/Transformation non alignés, "7 jours offerts" trop petit,
pas d'impression de comparateur premium.

- **Restructuration des 3 cartes principales** (`(marketing)/pricing/
  page.tsx`) : ordre badge → nom → prix → description → bénéfices →
  espace flexible → CTA → information essai, via `flex h-full flex-col`
  + `mt-auto` (implémenté par un `<div className="flex-1" />` avant le
  bloc CTA) — les CTA s'alignent désormais en bas, quelle que soit la
  longueur du contenu au-dessus, sans jamais imposer de hauteur fixe qui
  couperait quoi que ce soit. Grid passé de 4 à 3 colonnes propres
  (`lg:grid-cols-3`) : **Entreprise sorti du comparateur** (structurellement
  différent — devis, pas d'abonnement) et affiché en bandeau à part
  en dessous, plutôt que compressé en 4e colonne.
- **"7 jours offerts" rendu visible** : déplacé du haut de carte (à côté du
  prix, `text-[10px]` très discret) vers directement sous le CTA, format
  "7 jours offerts · puis 19€/mois" / "· puis 49€/mois", `text-sm
  font-medium text-laiton-300` — largement plus lisible.
- **CTA harmonisés** : Impulsion et Transformation partagent désormais le
  même libellé "Commencer gratuitement" (avant : Transformation affichait
  "S'abonner — 7 jours offerts", incohérent avec Impulsion) — `SubscribeButton`
  et `PlanSelectedLink` acceptent maintenant un `className` pour permettre
  le `w-full` dans le nouveau layout flex.
- **Responsive vérifié réellement** (Playwright, pas juste le build) à 4
  largeurs : desktop large (1440px, 3 colonnes propres), desktop petite
  fenêtre (1024px, toujours 3 colonnes lisibles), tablette (834px, bascule
  automatique en 2 colonnes — VIP passe seul en dessous plutôt que d'être
  compressé à 3), mobile (390px, 1 carte par ligne, rien de coupé, CTA
  entièrement visible, scroll naturel).
- **Divergence corrigée entre `/pricing` et le résultat du diagnostic** —
  Anthony avait explicitement demandé de vérifier que ces deux endroits ne
  divergent pas. Le composant `FormuleCard` (teaser "Nos formules" dans
  `diagnostic-quiz.tsx`, volontairement plus compact, avec un
  "Recommandé pour toi") a été audité : il utilisait encore l'ancien CTA
  "Créer mon compte" et un "7 jours offerts" minuscule (`text-[9px]`) —
  harmonisés avec `/pricing` (même information d'essai, format identique).
  **Piège découvert en testant** : copier littéralement "Commencer
  gratuitement" dans cette carte plus étroite (grille 3 colonnes dans un
  conteneur `max-w-3xl`, donc bien plus resserrée que `/pricing`) faisait
  déborder le texte hors du bouton `rounded-full` (mesuré : bouton de
  96px, texte de 110px, aucun retour à la ligne possible sur un mot seul).
  Résolu par un nouveau prop `size="compact"` sur le composant `Button`
  partagé (`ui/button.tsx`, padding/texte réduits explicitement plutôt que
  de tenter de surcharger `px-6`/`text-sm` par une className externe de
  même spécificité CSS — approche fragile, ordre de sortie Tailwind non
  garanti) + libellé raccourci à "Commencer" pour ce contexte précis
  (l'offre complète reste lisible juste en dessous, dans la ligne essai).
  Le bouton VIP "Réserver via WhatsApp" de ce même teaser avait le même
  risque de débordement (texte sur 2 lignes dans un pill `rounded-full`,
  visuellement coupé) — corrigé avec le même `size="compact"`.

**Vérifié** : `tsc --noEmit` et `next build` réels, propres. Captures
Playwright à chaque largeur listée ci-dessus, plus une mesure DOM directe
(`scrollWidth` vs `offsetWidth`) pour confirmer que le débordement du
bouton "Commencer" était réel avant correction (110px de texte dans 96px
de bouton) et bien résolu après (96px = 96px, aucun débordement).

## Phase 5.1 — corrections UX après test utilisateur réel (11/08/2026, nuit)

Brief formel envoyé par Anthony après avoir testé COAI en direct sur
coai.fr (compte existant, nouveau compte, diagnostic, Impulsion,
Transformation, `/pricing`) — avec une exigence explicite en tête de brief :
ne jamais considérer une correction "faite" simplement parce que
`tsc`/`build` passent, vérifier la chaîne complète. **Phase 6 explicitement
pas démarrée**, comme demandé.

- **Objectifs du diagnostic enrichis** (`diagnostic-quiz.tsx`) : 4 → 8
  choix ("Perdre du gras", "Prendre du muscle", "Me sentir mieux au
  quotidien", "Progresser en force", "Améliorer mes performances", "Gagner
  en mobilité", "Reprendre le sport", "Autre objectif") + champ texte libre
  ("Quel est ton objectif ?") quand "Autre objectif" est choisi, sur le
  modèle exact du champ "Autre" déjà existant pour persona/santé/sport
  (nouveau helper `resolveObjectif`, substitue le texte saisi au libellé
  générique partout où l'objectif est utilisé : résultat affiché, lead
  envoyé par email, profil appliqué en base). Chaîne vérifiée de bout en
  bout, pas seulement les boutons visuels.
- **Fréquence d'entraînement** : nouveau titre "Combien de fois peux-tu
  réellement t'entraîner par semaine ?" / sous-titre "Pas ta semaine
  idéale. Ta vraie semaine." Liste étendue à 6 choix, de "1 fois par
  semaine" à "6 fois ou plus par semaine" (avant : plafonnée à "5 fois ou
  plus par semaine", sans le cas 1×/semaine dans le titre/plan). Mis à jour
  partout où cette liste est dupliquée : zod de `/api/profil`,
  `profil-form.tsx` (formulaire profil abonné), `SPLIT_PAR_FREQUENCE` dans
  `mini-diagnostic.ts` (structure de séance suggérée pour chaque fréquence,
  y compris les nouvelles valeurs 1× et 6×+). Renforcé aussi le prompt IA
  de génération (`programme-entrainement-structure.ts`) : la fréquence
  déclarée est désormais présentée comme un engagement réel à respecter
  EXACTEMENT, jamais un point de départ à revoir à la hausse — un
  programme à 1 séance/semaine doit être aussi complet et cohérent qu'un
  programme à 4-5 séances, jamais une version au rabais.
- **Équipement — "Poids du corps uniquement" → "Aucun matériel"** :
  renommé dans `diagnostic-quiz.tsx` et harmonisé avec `profil-form.tsx`
  qui avait jusque-là DEUX libellés différents et redondants pour la même
  idée ("Poids du corps uniquement" et "Aucun équipement" coexistaient) —
  un seul intitulé "Aucun matériel" désormais aux deux endroits. Référence
  mise à jour aussi dans `mini-diagnostic.ts` (exemples d'exercices par
  équipement + équipement par défaut).
- **Loader "COAI analyse ton profil" — bug de concentricité identifié et
  corrigé** (`globals.css`, classe `.coai-loader-arc` partagée avec le
  loader du coach IA) : la cause réelle n'était pas géométrique dans le
  SVG (cx/cy/r déjà corrects et identiques entre l'anneau de fond et
  l'arc), mais une interaction CSS — l'animation `spin-loader` anime la
  propriété CSS `transform`, qui **remplace entièrement** l'attribut SVG
  `transform="rotate(-90 60 60)"` posé sur le cercle (les deux ne se
  cumulent jamais). Le point de pivot retombait donc sur le
  `transform-box` par défaut du navigateur pour les éléments SVG — qui
  diffère entre Chrome (`view-box`) et Safari (`fill-box` historiquement)
  — d'où un décentrage visible et inconsistant selon le navigateur.
  Corrigé en rendant le point de pivot explicite et sans ambiguïté
  (`transform-box: fill-box; transform-origin: center;`, qui pointe
  exactement vers cx/cy pour un cercle) et en réintégrant l'offset de
  départ -90° directement dans les keyframes (`from { rotate(-90deg) } to
  { rotate(270deg) }`) plutôt que de compter sur l'attribut SVG ignoré.
  Vérifié visuellement par script Playwright (zoom x4, plusieurs frames de
  l'animation) : l'arc doré suit exactement l'anneau de fond à tout instant
  de la rotation, aucun décalage. Bénéficie aussi au loader du coach IA
  (`/coach`), qui réutilise la même classe.
- **Items 5 à 9 du brief (accès direct aux offres, simplification
  Impulsion/Transformation, VIP inchangé)** : déjà livrés lors de la
  correction prioritaire précédente cette même nuit (cf. section
  "Corrections prioritaires post-Phase 5" ci-dessous) — re-vérifiés
  fonctionnels dans le code à cette occasion (nav "Nos formules", `/pricing`
  sans mur diagnostic, sign-up Impulsion à parcours unique, sign-up
  Transformation qui garde son choix essai/immédiat, VIP non touché).

**Vérifié** : `tsc --noEmit` et `next build` réels, propres (cache `.next`
purgé au préalable — contenait une référence stale à une route de preview
temporaire déjà supprimée d'une session précédente). Script Playwright réel
(mobile 390px, deviceScaleFactor ×4) sur une route de preview temporaire
(supprimée après coup) pour vérifier visuellement la concentricité du
loader corrigé, plusieurs frames de l'animation capturées.

**Non testable depuis ce sandbox (mêmes limites qu'd'habitude)** : `next
build` complet inclut `prisma migrate deploy`, qui échoue ici en P1001
(pas d'accès réseau sortant vers Supabase) — contourné en lançant `next
build` directement pour valider la partie Next.js/TypeScript. Aucun accès
direct à coai.fr ni au dashboard Vercel depuis ce sandbox (egress
bloqué) : la vérification "sur la version de production réellement
servie" explicitement demandée par Anthony en tête de ce brief reste à
faire par lui une fois cette branche déployée.

## Architecture funnel validée + reste pour Phase 5.1 (11/08/2026, nuit)

Anthony a validé l'architecture à deux entrées mise en place par les
corrections ci-dessous, comme axe définitif du funnel COAI :
- **Prospect froid** : Diagnostic offert → personnalisation → offre →
  abonnement.
- **Prospect chaud** : Voir les formules → abonnement direct →
  diagnostic/personnalisation ensuite.
« Le diagnostic aide à vendre, mais ne bloque jamais l'achat. »

**Remarques explicitement mises de côté pour la Phase 5.1** (pas traitées
dans cette session, à reprendre) :
- Ajouter "1 fois par semaine" aux fréquences du quiz `/diagnostic`
  (`FREQUENCES` dans `diagnostic-quiz.tsx`) — déjà présent dans
  `profil-form.tsx`, manquant côté quiz public.
- Objectifs du quiz plus complets + option "Autre" (`OBJECTIFS` n'a
  aujourd'hui que 4 choix fixes, sans échappatoire).
- Ajouter "Aucun matériel" aux équipements du quiz (`EQUIPEMENTS` dans
  `diagnostic-quiz.tsx`) — déjà présent dans `profil-form.tsx` sous
  "Aucun équipement", manquant côté quiz public.
- Loader COAI mal centré à un endroit signalé par Anthony (à clarifier
  lequel — plusieurs loaders existent maintenant : coach IA sur `/coach`
  déjà corrigé le 11/08, transition "analyse" du quiz, spinner de
  `ActivationFlow` sur `/bienvenue`) — pas encore identifié précisément,
  à reproduire avec Anthony avant de corriger.
- Responsive des cartes tarifs sur petits écrans — déjà vérifié une fois
  par Playwright (cartes visibles et scrollables), mais Anthony a
  peut-être un cas précis en tête à reproduire.

## Corrections prioritaires post-Phase 5 : essai Impulsion + accès direct aux offres (11/08/2026, nuit)

Deux corrections envoyées coup sur coup par Anthony après la Phase 5, toutes les deux implémentées ensemble (fortement liées : la seconde s'appuie sur la nouvelle logique d'essai de la première).

**1. Essai Impulsion simplifié** — le double choix "7 jours offerts" / "Démarrer tout de suite" cassait la dynamique du diagnostic pour un trafic froid (pub TikTok/Instagram), pour un palier où skipTrial n'avait presque aucune raison d'être choisi (19€/mois direct vs. essai gratuit). Retiré **uniquement pour Impulsion** (`sign-up/page.tsx`, `completer-inscription-form.tsx`) — Transformation garde son choix, pas demandé de le retirer là. Un seul parcours désormais : essai 7 jours, CTA "Commencer gratuitement", copy exacte d'Anthony.
- **Génération débloquée pendant l'essai** (`src/lib/subscription/plan.ts`) — jusqu'ici `canGenerateProgramme` excluait explicitement la période d'essai (09/08/2026, anti-abus "générer puis résilier avant paiement"). Anthony a tranché : l'essai doit donner un accès *réel*, pas un accès différé à J+7 — le garde-fou anti-abus (carte bancaire obligatoire dès l'inscription via `payment_method_collection: "always"`, déjà en place côté Stripe) suffit. `isInTrial` reste utilisé pour l'affichage (date de fin d'essai sur compte/abonnement), plus pour bloquer quoi que ce soit.
- **Stripe non touché** — l'architecture existante (`trial_period_days: 7`, carte obligatoire dès l'inscription, aucun second abonnement créé) satisfaisait déjà exactement ce qui était demandé (essai réel jour 1-7, prélèvement à J8, jamais un double abonnement). Vérifié dans le code avant de conclure que rien à changer côté `/api/stripe/checkout`.
- **Nouvel écran d'activation** (`src/components/onboarding/activation-flow.tsx`, remplace l'ancien `DiagnosticAutofill` supprimé) — sur `/bienvenue`, enchaîne automatiquement : diagnostic complet en attente → applique au profil + génère le programme tout de suite (avec 3 tentatives espacées si l'abonnement Stripe n'est pas encore visible en base, décalage webhook possible) → "Ton programme est prêt" / "Commencer ma première séance". Diagnostic abandonné en cours de route → "Continuer mon diagnostic". Aucun diagnostic → "Faire mon diagnostic" (jamais de programme générique inventé sans données réelles).
- **Parcours D (déjà connecté) aligné** — sur `/diagnostic`, un utilisateur connecté qui n'a **aucun programme existant** (nouvel abonné direct via `/pricing`, cf. ci-dessous) voit son bouton de fin de diagnostic devenir "Générer mon programme" → même écran "Ton programme est prêt". Un abonné **avec un programme déjà en place** garde le geste explicite habituel ("Mettre à jour mon profil") — jamais de régénération silencieuse d'un programme existant, cohérent avec toute l'architecture d'adaptation (Phases 1-4) qui n'a jamais permis de changement de programme sans confirmation.

**2. Accès direct aux offres, sans passer par le diagnostic** — le diagnostic restait le parcours principal recommandé, mais un prospect chaud (déjà convaincu) n'avait aucun moyen évident de trouver les tarifs et s'abonner directement.
- **`/pricing` réutilisé tel quel** (pas de nouvelle route `/formules` — déjà public, déjà les bonnes cartes, juste dupliquer aurait contredit "ne duplique pas les composants existants"). Nouveau titre "Choisis le coaching qui te correspond." + sous-titre "Commence simplement avec COAI. Tu pourras faire ton diagnostic personnalisé ensuite." Carte Impulsion mise à jour avec la nouvelle logique du point 1 (19€/mois, badge "7 jours offerts", copy exacte, CTA "Commencer gratuitement").
- **Accès nav + footer** — `SiteNav` : lien "Nos formules" → `/pricing` (desktop + menu hamburger mobile, un seul array partagé donc les deux se mettent à jour ensemble). `Footer` : lien "Formules" ajouté. `CoaiIntro` (hero) : lien texte discret "Voir les formules" sous le CTA principal, volontairement en retrait pour ne jamais concurrencer "Diagnostic offert".
- **Utilisateur sans diagnostic qui s'abonne directement** — déjà couvert par le nouvel `ActivationFlow` du point 1 : pas de programme générique inventé, "Personnalisons maintenant ton coaching." → "Faire mon diagnostic" → (parcours D, sans programme existant) → génération → "Ton programme est prêt".
- **Utilisateur avec diagnostic abandonné qui s'abonne directement** — même `ActivationFlow`, détecte la progression sauvegardée (`progress-storage.ts`, Phase 5B) → "Continuer mon diagnostic", jamais de recommencer à zéro.

**Vérifié** : `tsc` + `next build` réels. Captures Playwright desktop (nav "Nos formules") et mobile (menu hamburger, `/pricing` en accès direct — cartes entièrement visibles et scrollables, sign-up Impulsion sans le double choix, sign-up Transformation qui le garde). Parcours connecté sans programme testé de bout en bout (route de preview temporaire, supprimée après coup) : diagnostic → "Générer mon programme" → un seul appel à `/api/programmes/generate` → "Ton programme est prêt".

**Limite connue** : le retry-avec-délai dans `ActivationFlow` (webhook Stripe pas encore traité) n'a pas pu être testé en conditions réelles (pas d'accès Stripe/Supabase depuis ce sandbox) — logique vérifiée par lecture de code uniquement, à confirmer par Anthony sur un vrai parcours d'inscription Impulsion.

## Phase 5, bloc B — reprise, funnel analytics, UTM, parcours connecté/upgrade (11/08/2026, nuit)

Suite du brief Phase 5 (sections 14 à 25, envoyées séparément après le bloc A
ci-dessous — le premier envoi s'était coupé à la section 14). Portée
strictement respectée : rien démarré sur les Phases 6-10, Stripe existant
réutilisé tel quel (aucune nouvelle intégration), pas de plateforme A/B ni
de dashboard de métriques construits ("prépare, ne construis pas").

**Ce qui existait déjà avant ce bloc** (vérifié avant de coder, comme
demandé) : abstraction analytics propre en 2 couches — `trackEvent`/
`trackMetaEvent` (GA4/Meta Pixel, `src/lib/analytics.ts`) côté acquisition,
`trackServerEvent` (`src/lib/analytics/product-events.ts`, simple
`console.log` prêt à être branché sur un vrai outil) côté produit — donc
"ne pas rajouter une énorme dépendance analytics" était déjà acquis, juste à
étendre. `TrackConversion` (composant client réutilisable pour déclencher un
événement au montage d'une page serveur) existait aussi déjà.

**14. Reprise du diagnostic** — `src/lib/diagnostic/progress-storage.ts`
(nouveau, distinct du pont pré-inscription `storage.ts` déjà existant) :
sauvegarde la progression (réponses + étape courante) en localStorage à
chaque étape de question, effacée dès que le résultat est atteint. Au
retour sur `/diagnostic`, l'écran d'intro propose "Continuer mon
diagnostic" (reprend exactement à la bonne étape) ou "Recommencer à zéro".
Vérifié par test Playwright réel (abandon à l'étape 3, fermeture/réouverture
de la page, reprise confirmée à l'étape 4/14 exacte).

**15-16. Analytics funnel** — `src/lib/analytics/funnel-events.ts`
(nouveau) : liste unique des 14 événements demandés
(landing_viewed → first_workout_started), tous routés vers `trackEvent`
(GA4, déjà en place) — aucune nouvelle dépendance. Câblés à : homepage,
`/diagnostic` (démarrage, chaque étape, complétion, vue résultat, aperçu
programme), `/sign-up` + `completer-inscription-form.tsx` (Google OAuth),
`/pricing`, `SubscribeButton`, `/bienvenue`, première vue de
`/programme/entrainement` (V1), premier `SeanceLog` jamais loggué (approximé
en l'absence de suivi live d'une séance en cours — cf. limite ci-dessous).
Pas de dashboard de calcul de taux de passage construit (pas demandé à ce
stade) — juste l'instrumentation posée pour le calculer plus tard.

**17. UTM / attribution** — `src/lib/attribution/utm-cookie.ts` (nouveau,
même pattern que le cookie de parrainage existant) : capture first-touch
des utm_source/medium/campaign/content/term à l'arrivée sur n'importe quelle
page marketing (`UtmCapture`, monté dans le layout marketing — couvre aussi
les pages SEO, pas seulement l'accueil), conservés jusqu'à la conversion
(inscription email/mdp et Google OAuth), rattachés au `User` et au
`DiagnosticLead`. Nouveaux champs `utmSource/utmMedium/utmCampaign/
utmContent/utmTerm` sur les deux modèles, migration
`20260812000000_add_utm_attribution`. Vérifié par test Playwright réel
(`?utm_source=meta&utm_medium=cpc&utm_campaign=...` → cookie posé
correctement).

**18-19. Mobile first / performance** — déjà couvert par construction : le
diagnostic reste 100% règles déterministes (aucun appel IA, cf. bloc A),
`inputMode="numeric"` déjà sur les champs numériques (pas de clavier
alphabétique inutile), CTA pleine largeur au pouce déjà en place. Testé
mobile (390px) via Playwright sur l'ensemble du parcours.

**20. Composants prêts pour l'A/B testing futur** — pas de plateforme
construite (explicitement demandé de ne pas le faire). Le contenu marketing
déjà concerné (formules, messages de transition, blocs du résultat) vivait
déjà dans des constantes nommées en tête de fichier plutôt qu'inliné en
profondeur — rien de plus fait ici, juste vérifié que ce n'était pas
régressé.

**21. Parcours D — utilisateur déjà connecté** — `/diagnostic` détecte la
session côté serveur (`getCurrentAppUser`) et passe `connecte` au quiz.
Pour un visiteur connecté : l'étape email est retirée (déjà connue, jamais
redemandée), la dernière question mène directement à la transition
"analyse" sans capturer de lead, et l'écran de résultat remplace "Nos
formules" (paywall) par un bouton "Mettre à jour mon profil" qui applique
directement les réponses via `PUT /api/profil`. Vérifié par test Playwright
réel (route de preview temporaire, supprimée après coup) : 13/13 étapes
(pas 14), pas de carte tarifs, mise à jour confirmée.

**21 (suite). Parcours E — moment d'upgrade contextuel Free→Pro** — audité
l'existant (dashboard, moteur d'adaptation, COAI Insight) : aucun signal
d'upgrade contextuel n'existait avant ce bloc. Ajouté un seul moment précis
(pas un paywall générique partout, comme demandé) : sur
`AdaptationNotificationCard`, quand un abonné Impulsion (GRATUIT) reçoit une
adaptation de type REDUIRE (signal de prudence réel — fatigue, plateau,
contrainte — pas un chiffre inventé), une ligne contextuelle "Un coach
diplômé d'État peut t'accompagner sur ce type d'ajustement" renvoie vers
`/pricing`. `NotificationAdaptation` étendu du champ `decision` pour
permettre ce ciblage.

**24. Renfort narratif pendant le diagnostic** — la promesse "COAI n'est pas
un générateur de programmes, c'est un coaching qui apprend" ne vivait avant
ce bloc que dans le pitch du résultat final (bloc A). Renforcée pendant le
parcours lui-même : sous-titre de l'écran d'intro modifié ("chaque réponse
compte : c'est ce que COAI utilise pour construire ton profil, pas un
simple formulaire"), messages du step "analyse" déjà orientés dans ce sens
(bloc A).

**22. Tests effectués** — `npx tsc --noEmit` et `npm run build` réels,
propres. 3 scripts Playwright réels (mobile 390px, pas de simulation) :
parcours complet visiteur anonyme avec UTM + abandon/reprise + résultat +
paywall (captures : accueil, diagnostic mobile, reprise, résultat, aperçu
programme, formules), parcours utilisateur connecté (13/14 étapes, CTA
profil), aucune erreur console/page détectée en dehors de
`ERR_TUNNEL_CONNECTION_FAILED` sur les scripts GA4/Meta externes (attendu,
sandbox sans accès réseau sortant vers ces domaines).

**23. Explicitement pas fait, par instruction du brief** — aucune Phase 6 à
10 démarrée. Stripe existant réutilisé sans modification (checkout,
webhook, portail — rien touché). Pas de plateforme de test A/B, pas de
dashboard de calcul du funnel.

**Limites connues / à vérifier par Anthony** :
- `first_workout_started` est approximé par le premier `SeanceLog` jamais
  créé (log après-coup) — COAI n'a pas de suivi live d'une séance en cours,
  donc pas de vrai "début de séance" à instrumenter autrement.
- Comme pour tout le reste de cette session : aucun test possible avec de
  vraies données de production (pas d'accès direct à Supabase depuis ce
  sandbox), et aucun envoi réel vers GA4/Meta Pixel vérifiable ici (domaines
  externes bloqués côté sandbox) — la présence des appels `trackEvent`/
  `trackFunnelEvent` a été vérifiée dans le code et testée fonctionnellement
  (comportement UI correct), pas la réception réelle côté GA4/Meta.
- Migration `20260812000000_add_utm_attribution` — déployée (11/08/2026,
  nuit, confirmé par Anthony), appliquée automatiquement via
  `prisma migrate deploy`. Reste à tester en conditions réelles (cf.
  checklist ci-dessous).

## Phase 5, bloc A — diagnostic enrichi + "COAI a compris de toi" (11/08/2026, nuit)

Démarré par Anthony ("on continue mon brave!" + brief détaillé "PHASE 5 —
COAI CONVERSION & ONBOARDING INTELLIGENT"). Le brief s'est coupé net dans
le message d'Anthony au milieu de la section 14 ("REPRISE DU DI...") —
tout ce qui suit dans le brief original (probablement : reprise du
diagnostic en cas de refresh, copy exacte du paywall, moments d'upgrade
contextuels Free→Pro, section 12+ activation détaillée) n'a **jamais été
reçu**. Ce qui a été livré ce soir est donc un premier bloc solide, pas
la Phase 5 complète — **à reprendre avec Anthony pour la suite du brief**.

**Audit fait avant de coder** (exigé explicitement par le brief) : le
quiz public `/diagnostic` (11 étapes), le pont pré-inscription
(`storage.ts`/`DiagnosticAutofill`, déjà fonctionnel pour survivre à
refresh/signup), `/bienvenue` (déjà un vrai écran d'activation "salon
d'embarquement" avec une seule action claire) et `/pricing` (paywall déjà
value-first) existaient **déjà** et couvraient une bonne partie du brief
— confirmé qu'aucun de ces éléments n'avait besoin d'être reconstruit,
seulement complété.

**Ce qui a été ajouté** :
- **3 nouvelles étapes au quiz** (`src/components/marketing/
  diagnostic-quiz.tsx`) : lieu d'entraînement (distinct de l'équipement —
  salle/maison/extérieur/ça dépend), durée de séance visée (30 min → 1h30+),
  et un step facultatif âge/taille/poids (aucune donnée obligatoire en
  plus, juste plus de précision si renseignée). Nouveaux champs
  `Profile.lieuEntrainement`/`Profile.dureeSeanceMinutes` (migration
  `20260811200000_add_lieu_duree_profil`), branchés dans les prompts de
  génération d'entraînement (structure + séance) pour que ça influence
  vraiment le programme (volume dimensionné à la durée réelle), pas juste
  collecté sans effet. Mêmes champs ajoutés à `profil-form.tsx` (abonnés
  existants) pour cohérence.
- **Transition "COAI analyse ton profil"** (nouveau step "analyse", entre
  email et résultat) — anneau de progression réutilisant l'esthétique déjà
  validée du coach IA (`coai-loader-arc`), messages qui reflètent ce qui
  est réellement calculé, auto-avance après ~2,5s.
- **Résultat redessiné** (`src/lib/diagnostic/mini-diagnostic.ts`) :
  nouveau titre fixe "Voici ce que COAI a compris de toi.", 5 blocs
  structurés Objectif/Rythme/Format/Environnement/Frein (calculés à partir
  des réponses, jamais inventés), paragraphe personnalisé "Ton profil
  COAI" en une phrase de synthèse, section pitch évolution reprenant
  l'axe de marque mémorisé la nuit dernière ("COAI n'est pas un générateur
  de programmes. COAI est un coaching qui apprend..."). Tout le contenu
  existant (aperçu entraînement/nutrition/récupération, formules, carte
  fondateur) conservé tel quel, rien retiré.

**Explicitement pas fait** (faute du brief tronqué) : copy exacte du
paywall si elle devait différer de ce qui existe déjà sur `/pricing`,
moments d'upgrade Free→Pro contextuels ailleurs que le paywall existant,
logique de reprise du diagnostic en cas d'abandon en cours de route
(aujourd'hui : recommencer à zéro si on quitte avant l'étape email).

**Vérifié** : `tsc` + `next build` réels. Captures Playwright mobile
(390px, parcours complet des 14 étapes) et desktop (1280px, page complète
du résultat) — endpoint `/api/diagnostic-lead` mocké pour le test
(sandbox sans accès réseau sortant pour l'envoi d'email, comportement
attendu, cf. sections plus bas). Aucune régression visuelle sur le reste
du quiz (formules, carte fondateur, reassurance coach).

**Reste à faire par Anthony** : renvoyer la suite du brief Phase 5 (à
partir de la section 14) pour compléter ce bloc, puis appliquer la
migration `20260811200000_add_lieu_duree_profil` en prod (automatique au
prochain déploiement grâce à `prisma migrate deploy`, rien à coller
manuellement).

## Roadmap Phases 5-10 (11/08/2026, nuit)

Suite envisagée par Anthony après les Phases 1-4 (programme évolutif) et
le bloc NEAT de ce soir. Rien commencé, juste posé pour la suite —
chaque phase à confirmer une par une avant de démarrer, comme pour les
précédentes.

1. **Phase 5 — Conversion / onboarding intelligent.** Diagnostic offert →
   résultat personnalisé spectaculaire → aperçu de ce que COAI a compris
   → programme proposé → paywall au bon moment. Un vrai funnel intégré au
   produit, pas juste une page tarifs.
2. **Phase 6 — Rétention / "Daily COAI".** Un écran "Aujourd'hui" ultra
   simple : ce qu'il y a à faire aujourd'hui (séance, nutrition, pas,
   récupération, adaptation éventuelle) — ouvrir COAI sans avoir à
   réfléchir.
3. **Phase 7 — Mémoire & intelligence long terme ("COAI Profile /
   Training Intelligence").** Celle qui intéresse le plus Anthony :
   construire progressivement un profil sportif vivant par utilisateur
   ("tu progresses mieux avec 4 séances", "ta récupération chute après X
   volume", "tu rates souvent le vendredi", "meilleures perfs après 7h+
   de sommeil"...). Plus l'usage est long, plus quitter COAI coûte cher
   en valeur perdue. **Recoupe déjà largement `src/lib/insight/
   profil-appris.ts` et `coai-insight.ts`** (Phase 2, ce soir) — pas un
   départ de zéro, plutôt un approfondissement de ce qui existe déjà.
4. **Phase 8 — Business model / Stripe.** Free → Pro → Human, essai,
   upgrade/downgrade, mensuel/annuel, paywall, quotas IA, suivi MRR/
   churn/conversion. Vérifier aussi que le coût IA par utilisateur reste
   compatible avec le prix.
5. **Phase 9 — Acquisition virale.** Éléments partageables (progression,
   PR, transformation, "mon programme s'est adapté", bilan mensuel) →
   partage Instagram/TikTok → lien → diagnostic offert.
6. **Phase 10 — COAI Coach / B2B.** Une fois le B2C solide : d'autres
   coachs utilisent COAI avec leurs propres clients (dashboard
   multi-clients, validation IA, alertes, notes coach, marque blanche
   éventuelle plus tard). Recoupe l'idée déjà notée dans "Pistes de
   croissance / distribution" (08/08/2026) — cadrage produit rôles
   Particulier/Coach/Admin déjà esquissé là-bas.

## Nouvel axe de marque : "un coaching qui apprend" (11/08/2026, nuit)

Formulé par Anthony après la refonte du hero, en repensant à tout ce qui a
été construit ce soir (moteur d'adaptation, NEAT, "ton programme évolue
avec toi") : ce n'est pas juste un générateur de programme, c'est un
système qui apprend de l'utilisateur et devient meilleur avec le temps.

**Formulation retenue** :
- "COAI n'est pas un générateur de programmes."
- "COAI est un coaching qui apprend."
- "Plus COAI te connaît, meilleur devient ton coaching."

Différence avec "L'humain valide. L'IA personnalise." (signature actuelle
du hero) : cette dernière décrit le *mécanisme* (qui fait quoi) ; le
nouvel axe décrit le *bénéfice* pour l'utilisateur (ça s'améliore avec le
temps, plus tu l'utilises). Les deux ne s'excluent pas — la signature
reste valable comme sous-titre technique/rassurant, ce nouvel axe est
plus fort comme accroche principale (pub, réseaux sociaux, peut-être même
le kicker du hero à terme).

Anthony compte l'utiliser largement (produit + futures pubs) — décision
prise, pas encore déployée nulle part. Prochaine étape à clarifier avec
lui : où en priorité (hero ? pubs Meta ? les deux ?) et si ça remplace ou
complète "L'humain valide. L'IA personnalise." dans le hero actuel.

## Refonte du hero de la homepage (11/08/2026, nuit)

Demandé par Anthony à partir d'une maquette de référence (nav complète +
titre "Ton programme évolue avec toi." + mockups de téléphone + ligne de
fonctionnalités). Portée confirmée par Anthony : uniquement le hero + la
nav, pas le reste de la page (qualification, fondateur, histoire, piliers,
coach IA, offres, FAQ — tous inchangés, vérifié par capture Playwright que
rien n'a régressé plus bas).

- **`src/components/marketing/site-nav.tsx`** (nouveau) : remplace la barre
  minimale (logo + "Se connecter") par une vraie nav — Accueil /
  Fonctionnalités / Comment ça marche / Coaching / À propos + bouton
  "Commencer", menu mobile en dropdown. Les liens pointent vers des ancres
  de la homepage (`/#piliers`, `/#comment-ca-marche`, `/#fondateur`,
  `/#histoire` — ids ajoutés aux sections existantes) pour fonctionner
  depuis n'importe quelle page marketing (pricing, diagnostic...), pas
  seulement depuis l'accueil.
- **Hero réécrit** (`(marketing)/page.tsx`) : kicker "L'humain valide.
  L'IA personnalise." (la signature déjà retenue pour la vision programme
  évolutif) + titre "Ton programme évolue avec toi." + CTA "Créer mon
  programme" / "Découvrir comment ça marche". Ancienne vidéo de fond
  (`hero-intro.mp4`) retirée, remplacée par les mockups téléphone.
- **`src/components/marketing/app-preview-phones.tsx`** (nouveau) —
  point de vigilance appliqué ici : plutôt qu'une maquette de téléphone
  avec du contenu inventé, les deux écrans reconstruisent les vraies
  cartes du produit (COAI Insight, "Cette semaine X/X séances",
  progression de charge, "Ton programme évolue" V3...) avec les mêmes
  libellés que le vrai dashboard/la vraie page évolution — données
  illustratives mais fonctionnalités réelles, jamais présentées comme
  celles d'un abonné existant (même principe que "ne jamais fabriquer de
  témoignage").
- **`src/components/marketing/feature-icons.tsx`** (nouveau) : 4 icônes
  SVG minimales (Programme adaptatif, Suivi intelligent, Validation
  humaine, Sécurisé & privé) pour la ligne sous le hero.
- **"Comment ça marche"** : l'ancienne carte flottante à l'intérieur du
  hero devient sa propre section pleine largeur juste en dessous, avec
  l'ancre `#comment-ca-marche` — contenu identique (3 étapes), juste
  déplacé.

Vérifié : `tsc` + `next build` réels, captures Playwright desktop (1280px)
et mobile (390px) du hero et du menu mobile ouvert, capture pleine page
pour confirmer qu'aucune section existante plus bas n'a régressé.

**Itération demandée par Anthony juste après (brief très encadré : hero
uniquement, rien d'autre)** — sous-titre remplacé par "Ton corps change.
Ton emploi du temps change. Tes performances changent. COAI adapte ton
entraînement, ta nutrition et ta récupération au fil du temps." ; CTA
principal devient "Diagnostic offert" → `/diagnostic` (même lien que celui
déjà existant dans `CoaiIntro`, pas de nouvelle route) avec micro-copy "2
min · Gratuit · Sans engagement" ; CTA secondaire renommé "Voir comment ça
marche" (ancre `#comment-ca-marche` déjà en place). `TrustBadges` retiré du
hero (n'était pas dans la hiérarchie demandée, "hero extrêmement propre")
— le composant reste utilisé sur `/pricing`. Objectif explicite : réduire
la friction avant abonnement, le funnel devient accueil → diagnostic
gratuit → découverte de la valeur, pas une demande d'achat immédiate.
Revérifié `tsc`/`build` + captures desktop/mobile.

**Malentendu découvert juste après (même soirée)** : Anthony pensait que
"le hero" désignait l'écran d'ouverture plein écran (`CoaiIntro` — logo
animé + titre + CTA "Diagnostic offert" avec flèches), pas la section
`id="hero"` avec les mockups téléphone juste en dessous — deux sections
distinctes que ni la maquette ni les échanges précédents ne distinguaient
clairement. Confirmé par son brief suivant, qui cite mot pour mot l'ancien
texte de `CoaiIntro` ("Fais passer ta santé au niveau supérieur.") comme
"titre actuel" à remplacer. Appliqué à `CoaiIntro` (pas touché à la
section `id="hero"` du dessous, comme demandé) : même kicker/titre/
sous-titre que la section du dessous, mais CTA différents cette fois —
"Créer mon programme" (garde le lien `/diagnostic` existant, juste le
libellé change) + "Découvrir comment ça marche" (ancre `#comment-ca-marche`)
+ micro-copy "Un programme personnalisé au départ. Adapté dans le temps."
Testé aussi sur petit écran (iPhone SE, 375×667) pour vérifier l'absence
de coupure moche du titre.

**Fusion demandée par Anthony juste après ("oui fusionne")** : la section
`id="hero"` (kicker/titre/sous-titre/CTA dupliqués avec `CoaiIntro`) perd
tout son texte — ne garde que `<AppPreviewPhones />`, renommée
`id="apercu-produit"` (rien ne pointait vers l'ancien id `#hero` dans la
nav, changement sans casse). Résultat : un seul message ("Ton programme
évolue avec toi.") sur tout le parcours de la page, plus de répétition.
Revérifié `tsc`/`build` + captures desktop/mobile pleine page.

## Phase 3, bloc NEAT — activité quotidienne (11/08/2026, nuit)

Demandé par Anthony après validation de la Phase 2 : premier bloc dédié de
la Phase 3 (activité hors séances — marche, escaliers, temps debout).
Aucune autre fonction de Phase 3 touchée, aucune régression Phase 1/2
(vérifié `tsc` + `next build` réels + captures Playwright).

**Résumé** : nouveau modèle `ActiviteJournaliere` (une entrée par jour et
par utilisateur, jamais écrasée pour les jours passés — seule celle du jour
peut être corrigée). Carte "Activité quotidienne" sur le dashboard : saisie
rapide facultative (pas, source, type de journée, type de travail) tant
qu'aucune entrée n'existe pour le jour, sinon résumé + recommandation.
Référence personnelle (moyenne 7j/28j, jamais un objectif universel de
10 000 pas) calculée dès 7 jours renseignés ; en dessous, "COAI apprend
encore ton niveau d'activité quotidien." Section pédagogique complète ("Ton
mouvement quotidien compte aussi") + infobulle NEAT ajoutées sur
`/programme/evolution` (ancre `#neat`, liée depuis la carte dashboard) et
item "Activité quotidienne" ajouté à "Ce que COAI apprend sur toi" (même
seuil minimum). Intégré à COAI Insight en dernière priorité (jamais devant
douleur/fatigue/entraînement). Connecté au mode voyage existant (réutilise
`ProgrammeGenerated.temporaire` du pilier Entraînement — aucun nouvel état
à maintenir, retour automatique à la référence habituelle une fois le
voyage terminé).

**Migration** : `20260811190000_add_activite_journaliere` — additive,
crée la table `activite_journaliere` + 3 enums (`SourceActivite`,
`TypeJournee`, `TypeTravail`). S'appliquera automatiquement au prochain
déploiement grâce à `prisma migrate deploy` (cf. section suivante) — rien
à coller manuellement dans Supabase cette fois.

**Règles métier (moteur déterministe, `src/lib/neat/recommandation.ts`,
aucun appel IA)**, par ordre de priorité :
1. Données insuffisantes (< 7 jours) → aucune recommandation.
2. Douleur importante signalée récemment → jamais de suggestion d'augmenter
   la marche, quelle que soit la tendance.
3. Mode voyage actif → objectif flexible, aucune pénalité de baisse.
4. Sommeil mauvais / énergie faible / stress élevé → pas d'augmentation
   simultanée entraînement + NEAT, priorité récupération.
5. Métier physique déclaré, ou activité déjà nettement au-dessus de la
   référence perso (+20%) → pas d'ajout arbitraire de pas.
6. Baisse nette (-20% vs référence) → retour progressif suggéré (marches
   courtes si contrainte "manque de temps" récente détectée).
7. Stable (±10%) → message de maintien.
8. Sinon → petite augmentation progressive suggérée, jamais un chiffre
   précis à atteindre.

**Garde-fous** : tous les seuils comparent l'utilisateur à SA propre
moyenne 28 jours, jamais à un seuil absolu — aucune ligne de code ne
compare à 10 000 pas. Le NEAT n'est jamais formulé comme punition,
compensation ou obligation calorique (aucun texte du moteur ne mentionne
un nombre de calories à brûler).

**Simplification assumée** : le point 9 de la demande listait
"acceptation d'un objectif progressif" parmi les métriques à suivre — pas
d'implémentée comme action interactive dédiée (bouton "j'accepte") dans ce
premier passage, la recommandation reste un affichage passif comme les
autres. Événement `neat_goal_accepted` déclaré dans `product-events.ts`
mais pas encore déclenché nulle part — à activer si Anthony veut ce bouton
plus tard. Les autres métriques du point 9 (ouverture de l'explication,
première saisie, recommandation affichée) sont bien câblées.

**Tests réalisés** : `tsc` + `next build` propres. Page de test temporaire
(non commitée) avec `fetch` mocké pour couvrir les 8 scénarios (données
insuffisantes, baisse, stable, déjà élevé/métier physique, voyage, douleur
importante, augmentation, formulaire de saisie vide) — captures Playwright
mobile (420px), tooltip vérifié au survol. Pas de test avec de vraies
données (mêmes limites que d'habitude : pas d'accès direct à Supabase
depuis ce sandbox).

**Reste à faire par Anthony** : déployer cette branche (la migration
s'appliquera seule) puis tester en conditions réelles — saisir quelques
jours de pas, vérifier que la carte dashboard réagit, consulter
`/programme/evolution#neat`.

## Bug corrigé : animation de chargement du coach IA mal centrée (11/08/2026, nuit)

Signalé par Anthony avec capture. Le pourcentage ("85%") affiché pendant le
chargement n'était pas positionné en `absolute`, donc traité comme un
troisième élément du conteneur flex à côté de la photo — ça poussait la
photo hors du centre pendant que l'anneau de progression (bien en
`absolute`, lui) restait fixe, créant un décalage visible entre les deux.
Vérifié par une page de test temporaire reproduisant l'état de chargement
(captures avant/après) : `src/components/coach/ask-coach.tsx`, une ligne.

## Petites corrections UI (11/08/2026, nuit)

- "Mon IMC" → "Ton IMC" sur le dashboard (incohérence avec le reste du
  site qui s'adresse à l'abonné en "tu").

## Migrations Prisma automatisées au déploiement (11/08/2026, nuit)

Demandé par Anthony ("on fait les migrations sur vercel?") après le test de
bout en bout ci-dessous, en réaction au copier-coller manuel répété dans
Supabase SQL Editor (source d'une erreur de troncature déjà vécue, et de
migrations qui traînent en attente plusieurs jours faute d'y penser).

- **`package.json`** : `build` devient `prisma migrate deploy && next
  build`. `prisma/schema.prisma` avait déjà un `directUrl` séparé du `url`
  pooled (nécessaire pour que les migrations passent en direct plutôt que
  via le pooler Supavisor) — rien à changer côté schéma. Vérifié localement
  que `prisma migrate deploy` échoue bien avec la même erreur P1001 déjà
  connue (pas d'accès réseau depuis ce sandbox) et pas une erreur de
  configuration — donc la commande est correctement câblée, juste
  impossible à exécuter jusqu'au bout d'ici.
- **Piège identifié avant de pousser** : `prisma migrate deploy` décide quoi
  appliquer à partir de la table `_prisma_migrations`, pas en relisant le
  SQL. Comme les 37 migrations précédentes ont toutes été appliquées à la
  main via l'éditeur SQL Supabase (jamais via la CLI Prisma), cette table
  n'a probablement aucune trace qu'elles sont déjà faites — un
  `prisma migrate deploy` naïf aurait donc tenté de les rejouer depuis
  `20260802101253_init` (dont des `CREATE TABLE` sans `IF NOT EXISTS`) et
  fait échouer le premier déploiement.
- **Solution** : script SQL `baseline-migrations-a-coller-dans-supabase.sql`
  généré et envoyé à Anthony — insère juste 37 lignes dans
  `_prisma_migrations` (nom + checksum SHA-256 du fichier `migration.sql`,
  calculé ici sans accès à la base, juste en hashant les fichiers du repo)
  pour dire à Prisma "ces migrations sont déjà faites, ne les rejoue pas".
  Une seule fois, à coller avant le prochain déploiement de cette branche.
  Après ça, `prisma migrate deploy` n'appliquera que les 3 migrations
  réellement en attente — automatiquement, sans autre action manuelle — et
  chaque migration future suivra le même chemin. cf. checklist plus bas
  pour le détail de la manip.

## Mot de passe Supabase périmé sur DIRECT_URL (11/08/2026, nuit)

Suite à l'automatisation des migrations ci-dessous, le premier déploiement
a échoué (`P1000: Authentication failed`) — `DIRECT_URL` existait sur
Vercel depuis le 5 août mais avec un mot de passe qui n'était visiblement
plus le bon (jamais utilisé en pratique avant cette nuit, `DATABASE_URL`
seule servait à l'app jusque-là). Un premier essai avec le mot de passe
du trousseau macOS d'Anthony a aussi échoué (probablement lui-même périmé
ou une confusion de caractère à la copie). Résolu en régénérant le mot de
passe de la base directement sur Supabase (Database Settings → Reset
password) et en mettant à jour `DATABASE_URL` **et** `DIRECT_URL` sur
Vercel avec ce nouveau mot de passe — déploiement repassé au vert ensuite.
À retenir : si l'app en prod se met à érrer en base de données après ça,
vérifier en premier que rien d'autre n'a l'ancien mot de passe en dur
quelque part (script local, autre service).

## Test de bout en bout des 4 phases "programme évolutif" (11/08/2026, nuit)

Demandé par Anthony ("test tout d'abord") avant de continuer, après la
livraison des 4 phases ci-dessous. Ce qui a été réellement possible depuis
ce sandbox, et ce qui ne l'était pas :

- **Fait** : `npx tsc --noEmit` et `npm run build` consolidés sur
  l'ensemble du code accumulé Phase 1→4 — les deux passent sans erreur,
  toutes les routes (dont les nouvelles `/admin`, `/admin/clients/[id]`,
  `/api/adaptations/[id]/confirmer`, `/rejeter`, `/api/programmes/[pilier]/
  reprendre`) compilent et sont bien générées par Next.js.
- **Fait** : test visuel par composant (page temporaire non commitée,
  supprimée après coup) avec données simulées — `AdaptationResultat` (cas
  décision actionnable et cas données insuffisantes), `AdaptationNotificationCard`
  (statuts PROPOSEE et APPLIQUEE), `SemaineChangeButton` (ouverture de la
  modale + sous-formulaire "Je voyage" cliqué en conditions réelles),
  `ReprendreProgrammeButton`, `ValidateProgrammeCard` avec suggestion COAI.
  Captures Playwright mobile (390px) et desktop (1280px) : aucun débordement,
  aucune régression visuelle, textes français corrects. Un badge "1 error"
  Next.js aperçu pendant le test vient d'un warning webpack préexistant
  (Sentry/`require-in-the-middle`), sans lien avec ce chantier.
- **Pas fait, impossible depuis ce sandbox** : aucun test de bout en bout
  avec de vraies données/authentification. Ce sandbox n'a pas d'accès direct
  à la base Supabase (`npx prisma db execute` échoue en P1001 sur le pooler,
  déjà constaté plus tôt) ni d'URL de déploiement joignable
  (`NEXT_PUBLIC_APP_URL=http://localhost:3000` en local uniquement) — donc
  impossible de vérifier ici qu'un vrai abonné peut réellement analyser son
  programme, accepter/rejeter une adaptation, ou qu'un coach peut valider
  une suggestion, en conditions réelles.
- **Reste à faire par Anthony** : appliquer les 3 migrations encore en
  attente (`20260811120000_add_phase2_programme_vivant`,
  `20260811150000_add_adaptation_confirmation`, `20260811170000_add_hrv` —
  cf. checklist plus bas) puis tester lui-même en conditions réelles sur le
  site déployé : loguer 2-3 séances, cliquer "Analyser mon programme",
  Accepter puis vérifier que `/programme/evolution` affiche bien le
  changement ; tester "Ma semaine change" → voyage puis "Reprendre mon
  programme habituel" ; côté coach, valider/rejeter une suggestion sur
  `/admin/clients/[id]` et vérifier que la note s'affiche côté abonné.

## Phase 4 — dashboard coach, validation humaine (11/08/2026, soir)

Quatrième et dernière phase du découpage initial de la vision "programme
évolutif" — livrée et vérifiée (`tsc`/`build` réels + captures Playwright
mobile/desktop).

**Bug de fond corrigé au passage** : les routes de validation/rejet coach
(`/api/admin/programmes/[id]/valider` et `/rejeter`, existantes avant
cette vision) ne mettaient jamais à jour la `ProgrammeAdaptation`
d'origine quand le programme validé venait d'une adaptation (créée par
`confirmerAdaptation`, Phase 2) — elle restait "EN_ATTENTE" indéfiniment
même une fois réellement validée par le coach, avec un `programmeSuivantId`
pointant vers un programme parfois supprimé (cas du rejet). Corrigé : la
validation marque l'adaptation `VALIDEE` (ou `MODIFIEE` si le coach édite
le contenu avant de valider), le rejet la marque `REJETEE` — les deux
supportent maintenant une note coach optionnelle (`noteCoach`), affichée
côté abonné sur `/programme/evolution`.

- **`/admin`** (nouveau, n'existait pas) : dashboard coach — nombre de
  clients Transformation actifs, programmes à valider (dont adaptations),
  alertes actives, clients nécessitant attention (top 5, lien vers leur
  fiche). Ajouté en premier lien de `AdminNav`.
- **`/admin/clients/[id]`** (nouveau) : fiche client — profil, alertes,
  programme actuel par pilier, feedback récent (séances/check-in/mesures),
  suggestion COAI en attente avec les boutons Valider/Modifier déjà
  fournis par `ValidateProgrammeCard` (réutilisé tel quel), bouton
  Contacter (WhatsApp). Accessible depuis `/admin` et `/admin/suivi`
  (noms de clients maintenant cliquables).
- **`ValidateProgrammeCard`** affiche désormais la suggestion COAI
  (résumé + changements avant→après) quand le programme en attente vient
  d'une adaptation — le coach voit le "pourquoi" suggéré par l'IA, pas
  seulement le contenu brut à relire à l'œil.
- **`src/lib/admin/flags.ts`** (nouveau) : logique de flags (douleur,
  inactivité, pas de mesure récente, régression de perf) extraite de
  `/admin/suivi` pour être réutilisée par le nouveau dashboard — même
  calcul, pas de divergence entre les deux pages.

## Phase 3 — nutrition adaptative, récupération, wearables (11/08/2026, soir)

Troisième phase de la vision "programme évolutif" — livrée et vérifiée
(`tsc`/`build` réels). Explicitement **pas touché** : Phase 4 (dashboard
coach), qui reste à venir sur demande.

**Découverte utile en démarrant cette phase** : le moteur d'adaptation
(Phases 1-2) a été conçu dès le départ pilier-agnostique
(`analyserEtAdapter`/`proposerAdaptation` prend `pilier: Pilier` en
paramètre, `genererPilier` gère déjà ENTRAINEMENT/NUTRITION/RECUPERATION,
`pilier-page.tsx` — composant partagé par les 3 pages de pilier — affiche
déjà "Analyser mon programme" partout). L'essentiel de "nutrition
adaptative" et "récupération adaptative" fonctionnait donc déjà de bout
en bout sans rien coder de nouveau. Le vrai travail de cette phase a été
de **rendre ces adaptations réellement bien informées et sûres**, pas de
les rendre possibles :

- **Signal d'adhérence nutrition** — `collecterSignaux` intègre désormais
  les check-ins repas existants (`RepasLog`, comme prévu/petit écart/gros
  écart sur 14 jours), injecté dans le prompt de décision. Avant ça, une
  analyse sur le pilier nutrition utilisait les mêmes signaux
  d'entraînement (difficulté de séance, régression de perf) qui n'ont pas
  grand-chose à voir avec l'alimentation.
- **Garde-fou calorique bidirectionnel** (nouveau type `CALORIES`,
  `src/lib/adaptation/engine.ts`) — contrairement à `LOAD` (plafonné
  uniquement à la hausse, pertinent pour la charge d'entraînement), un
  changement calorique est plafonné à ±10% **dans les deux sens** : une
  restriction extrême est tout aussi dangereuse qu'un surplus extrême
  (exigence explicite de la vision : "ne jamais faire de modification
  extrême"). Une adaptation nutrition peut aussi être proposée même sans
  aucune séance loguée, dès 3 check-ins repas (`donneesSuffisantes`
  étendue) — sinon un utilisateur qui ne fait que suivre son alimentation
  sur COAI n'aurait jamais pu recevoir de recommandation.
- **Récupération** : vérifiée fonctionnelle telle quelle (signaux
  sommeil/stress/énergie du check-in hebdomadaire déjà pertinents,
  aucune règle spécifique à l'entraînement ne s'applique par erreur).
- **Wearables — champ HRV** (`Profile.hrv`, migration
  `20260811170000_add_hrv`) — variabilité de fréquence cardiaque en ms,
  extraite automatiquement du screenshot montre/app santé comme les
  autres métriques (VO2 max, fréquence cardiaque de repos...), utilisée
  dans le prompt de génération récupération. L'architecture "Données
  récupération" demandée par la vision existait déjà (upload screenshot
  → extraction IA → `Profile`) — HRV était la seule métrique wearable
  explicitement citée qui manquait.
- **"Ce que COAI apprend sur toi"** enrichi de 2 items : "Durée moyenne"
  (à partir de `SeanceLog.dureeMinutes`, ajouté en Phase 2) et "Adhérence
  nutrition" (% de repas "comme prévu" sur repas loggés, seuil minimum 5
  check-ins) — mêmes garde-fous de seuil minimum que les items existants.

## Phase 2 — rendre COAI vivant et intelligent (11/08/2026, soir)

Deuxième phase de la vision "programme évolutif" (cf. section ci-dessous),
livrée et vérifiée (`tsc` + `build` réels + captures Playwright mobile/
desktop) — reste à appliquer 2 migrations en prod (cf. checklist).
Explicitement **pas touché** : nutrition adaptative, dashboard coach
(Phase 3/4, à venir sur demande).

- **COAI Insight** (carte premium en tête de dashboard) : réutilise le
  résumé de la dernière adaptation réelle si elle existe (zéro coût IA
  supplémentaire), sinon compose un constat court à partir des signaux du
  moteur d'adaptation. Jamais de donnée inventée ; "COAI apprend encore à
  te connaître" si rien d'exploitable.
- **"Ce que COAI apprend sur toi"** (section sur `/programme/evolution`) :
  fréquence habituelle, meilleur jour, récupération, exercice en
  progression, zone à surveiller — chaque conclusion nécessite un seuil
  minimum de données réelles (ex: 6 séances sur 90 jours pour la
  fréquence), jamais affichée sinon. Durée de séance ajoutée (facultative)
  au check-in post-séance pour une future "durée moyenne".
- **Timeline "Mon évolution"** — mêmes page, événements réels uniquement
  (compte créé, première séance, premier programme par pilier,
  adaptations avec leur résumé, check-ins hebdo, nouveaux records
  détectés par comparaison chronologique) — aucun événement fabriqué.
- **"Ma semaine change"** (bouton sur le dashboard) — 10 motifs (voyage,
  manque de temps, sommeil, fatigue, douleur, maladie, changement de
  salle/matériel, emploi du temps, autre), chacun avec son
  sous-formulaire minimal, qui alimente le moteur d'adaptation existant
  (`contrainteUtilisateur`) avec un texte + un `contexte` JSON structuré
  et extensible. La douleur signalée ici renforce le même garde-fou
  anti-progression que la douleur loguée en séance (paramètre
  `douleurSignaleeManuelle`), avec la phrase de prudence obligatoire
  ("COAI ne remplace pas un professionnel de santé...").
- **Mode voyage** — la version générée est marquée `temporaire` avec une
  `finPrevue` (jours renseignés par l'utilisateur) ; bandeau "Mode voyage
  activé — jusqu'au ..." + bouton "Reprendre mon programme habituel" sur
  la page du pilier, qui recrée une version à partir du contenu
  d'AVANT l'adaptation (jamais une suppression, l'historique reste
  consultable).
- **Accepter / Garder mon programme actuel — geste réel avant application**
  (11/08/2026 soir, suite à la demande explicite d'Anthony sur le point 10) :
  le moteur d'adaptation ne régénère plus rien ni ne crée de version au
  moment de l'analyse. Une décision actionnable reste `PROPOSEE` — contenu
  et version ne sont créés qu'après confirmation explicite. Nouvelles
  fonctions `confirmerAdaptation`/`rejeterAdaptation` (`src/lib/adaptation/
  engine.ts`), routes `POST /api/adaptations/[id]/confirmer` et `/rejeter`,
  nouveaux statuts `PROPOSEE`/`REJETEE` (migration
  `20260811150000_add_adaptation_confirmation`). Bénéfice annexe : une
  adaptation refusée ne déclenche plus jamais de génération IA inutile
  (le coût de régénération est désormais payé à la confirmation, pas à la
  proposition). La carte de notification et `AdaptationResultat` (partagé
  entre "Analyser mon programme" et "Ma semaine change") portent les vrais
  boutons "Accepter" / "Garder mon programme actuel" quand une décision est
  en attente ; sinon (déjà appliquée ou en attente du coach), ils restent
  informatifs avec un simple dismiss.
- **Page "Ton programme évolue"** améliorée : chaque changement affiché en
  bloc AVANT → APRÈS distinct avec sa raison, plus premium que l'ancien
  format en ligne. Timeline et liste d'adaptations excluent les
  `PROPOSEE`/`REJETEE` (rien de réel à raconter tant que non confirmées).
- **Architecture analytics produit interne** (`src/lib/analytics/
  product-events.ts`) — pas de nouvelle dépendance, événements typés
  (workout_completed, weekly_checkin_completed, adaptation_proposed,
  adaptation_accepted, adaptation_rejected, travel_mode_started/finished...)
  actuellement juste loggés côté serveur, prêts à être branchés sur un
  vrai outil plus tard.

## Nouvelle vision produit : programme évolutif (11/08/2026, soir)

Changement de cap demandé par Anthony : COAI ne doit plus être perçu comme
"une IA qui génère un programme" mais comme "un coaching intelligent qui
apprend et fait évoluer le programme en continu". Signature retenue :
**« L'humain valide. L'IA personnalise. »** Promesses centrales : « Ton
programme n'est jamais terminé. Il évolue avec toi. » / « Ta vie change.
Ton corps change. Ton programme aussi. »

Découpage en 4 phases fourni par Anthony ; **Phase 1 (boucle centrale)
livrée et vérifiée** (`tsc` + `build` réels + captures Playwright
mobile/desktop) cette session — reste à appliquer la migration en prod
(cf. checklist ci-dessous) :

1. **Check-in post-séance structuré** — intégré au formulaire de log
   existant (`suivi/seances`) plutôt qu'un écran séparé : difficulté 1-5,
   énergie 1-5, douleur (aucune/légère/importante) + zone, commentaire.
   `ressenti` (texte libre existant) conservé tel quel, pas remplacé.
2. **Check-in hebdomadaire** — carte sur le dashboard, visible uniquement
   si aucun check-in n'existe pour la semaine ISO en cours (lundi de
   référence), modal <1min (sommeil/énergie/stress/faim/motivation/poids/
   douleurs/séances réalisées/commentaire).
3. **Versionnage explicite** — `ProgrammeGenerated.version` (V1, V2...),
   affiché sur chaque page de pilier avec lien vers l'historique dès qu'on
   dépasse V1.
4. **Moteur d'adaptation** (`src/lib/adaptation/`) — architecture en
   couches, comme demandé (jamais de règle critique uniquement dans le
   prompt) :
   - `signals.ts` : indicateurs calculés en code à partir des données
     réelles (moyenne difficulté/énergie sur 14j, douleur récente,
     tendance poids, régression de perf déjà détectée façon
     `admin/suivi`, dernier check-in hebdo).
   - `programme-adaptation-decision.ts` (prompt) : décision IA structurée
     en JSON strict (`GARDER`/`PROGRESSER`/`REDUIRE`/`MODIFIER`/`ADAPTER`
     + changements + résumé) — jamais du texte libre interprété à la main.
   - `engine.ts` : garde-fous appliqués **en code après** la réponse IA
     (jamais uniquement dans le prompt) — douleur importante ne peut
     jamais mener à "PROGRESSER" (forcé à "GARDER"), augmentation de
     charge plafonnée à +10%. Si décision actionnable : régénère le
     contenu du pilier via le même pipeline que la génération initiale
     (extrait dans `src/lib/programmes/generer.ts`, réutilisé par les
     deux), avec la décision injectée comme directive d'adaptation
     (`ProfilUtilisateur.directivesAdaptation`, nouveau champ optionnel).
     Nouvelle version créée + `ProgrammeAdaptation` tracée avec sa raison.
     Sur Transformation (coach humain), la nouvelle version reste
     `EN_ATTENTE` (jamais appliquée silencieusement) — même principe que
     la génération initiale, notification admin identique.
   - Si moins de 2 séances loguées sur 14 jours et aucun check-in
     hebdomadaire : retourne "Pas encore assez de données pour
     recommander une modification" **sans appeler l'IA** — rien à
     analyser, rien à inventer (exigence explicite de la vision).
   - Déclenchement **manuel** pour l'instant (bouton "Analyser mon
     programme" sur chaque page de pilier) — l'automatisation après
     chaque check-in est prévue pour une phase ultérieure, une fois le
     comportement observé en conditions réelles avec de vrais abonnés.
5. **Page "Ton programme évolue"** (`/programme/evolution`, nouvelle
   entrée de menu sous "Votre programme") — timeline des adaptations avec
   leur raison + historique des versions par pilier. Jamais de changement
   silencieux : chaque `ProgrammeAdaptation` explique son "pourquoi".

Nouveaux modèles Prisma : `WeeklyCheckin`, `ProgrammeAdaptation` ; champs
ajoutés à `SeanceLog` (difficulté/énergie/douleur/zone) et
`ProgrammeGenerated` (`version`). Migration
`20260811090000_add_programme_evolutif` écrite mais **pas encore
appliquée en prod** — à faire via Supabase SQL Editor comme les
précédentes (cf. checklist ci-dessous).

**Reste des phases (pas commencé, dans l'ordre donné par Anthony)** :
Phase 2 (COAI Insight sur le dashboard, timeline "Mon évolution" dédiée
même si l'historique existe déjà côté données, "Ce que COAI apprend sur
toi", bouton "Ma semaine change" + mode voyage, déclenchement automatique
de l'adaptation), Phase 3 (nutrition/récupération adaptatives avec la
même logique que l'entraînement, wearables), Phase 4 (COAI HUMAN —
dashboard coach dédié aux adaptations en attente, au-delà de
`/admin/programmes` qui gère déjà la validation des programmes ; alertes
formalisées au-delà des flags déjà calculés dans `/admin/suivi`).
Onboarding progressif (actuellement un formulaire unique sur
`compte/profil`) pas encore découpé en étapes — pas dans le découpage en
phases d'Anthony, à clarifier avec lui si prioritaire.

## À faire en priorité (checklist du 11/08/2026 au soir)

Pour reprendre facilement demain — mis à jour à chaque session, à garder
courte et actionnable (pas un journal, voir les sections datées plus bas
pour le détail/contexte de chaque sujet) :

**Côté Anthony (hors code)** :
- [x] **Migrations automatisées (11/08/2026, nuit)** — le script `build`
      lance désormais `prisma migrate deploy` avant `next build` : chaque
      déploiement Vercel applique automatiquement les migrations en
      attente, fini le copier-coller manuel dans Supabase SQL Editor à
      chaque fois (source de l'erreur de troncature déjà vécue). Script de
      baseline (37 lignes insérées dans `_prisma_migrations`, aucune donnée
      applicative touchée) collé par Anthony dans Supabase SQL Editor —
      Prisma sait maintenant que les 37 migrations précédentes sont déjà
      appliquées et ne tentera pas de les rejouer.
- [x] `DIRECT_URL` existait déjà sur Vercel (Production + Preview) mais
      avec un mot de passe périmé — jamais réellement utilisé avant cette
      nuit (`prisma migrate deploy` est le premier appel à s'en servir).
      Provoquait `P1000: Authentication failed` au build. Corrigé : mot de
      passe de la base régénéré sur Supabase (Database Settings → Reset
      password), `DATABASE_URL` et `DIRECT_URL` mises à jour sur Vercel
      avec le nouveau mot de passe (les deux, sinon l'app en prod aurait
      cassé aussi).
- [x] Déployé — build passé au vert avec `prisma migrate deploy` inclus.
      Les 3 migrations encore en attente
      (`20260811120000_add_phase2_programme_vivant`,
      `20260811150000_add_adaptation_confirmation`, `20260811170000_add_hrv`)
      ont dû s'appliquer automatiquement à ce déploiement.
- [ ] Une fois déployé : tester en conditions réelles le parcours
      "programme évolutif" (logue 2-3 séances → Analyser mon programme →
      Accepter → vérifie `/programme/evolution` ; teste "Ma semaine
      change" en mode voyage ; valide/rejette une suggestion côté
      `/admin/clients/[id]`) — non testable depuis le sandbox Claude Code
      (pas d'accès direct à Supabase ni d'URL de déploiement joignable,
      cf. section "Test de bout en bout" plus haut)
- [x] Migration `20260811090000_add_programme_evolutif` appliquée sur
      Supabase (11/08 après-midi) — check-in séance/hebdo, versionnage et
      adaptations opérationnels en prod
- [x] Migration `dernierBilanMensuelEnvoyeAt` appliquée sur Supabase (11/08
      matin) — le cron bilan-mensuel a maintenant sa colonne
- [x] Quota de crons Vercel (plan Hobby) vérifié le 11/08 matin : les 2
      crons (`relance-inactifs` 09:00, `bilan-mensuel` 08:00) apparaissent
      bien actifs sur la page Cron Jobs du projet, aucune alerte de quota
- [x] Contenu des 2 emails de rétention relu et validé par Anthony (11/08
      matin, texte inchangé) — reste à confirmer un vrai envoi une fois
      qu'un cron se sera déclenché en conditions réelles (rien à forcer,
      les crons tournent tout seuls désormais)
- [ ] Acheter la carte SIM prépayée, l'insérer dans le vieux téléphone
      (numéro jamais utilisé sur WhatsApp classique — condition Meta)
- [ ] Créer le compte ManyChat, lancer la connexion WhatsApp Business
      ("Embedded Signup") — je prends le relais dès que t'es à cette étape
- [ ] Relire les 6 "conseils de coach" ajoutés sur le dashboard
      (`src/components/dashboard/conseils-coach.tsx`) — premier jet rédigé
      par Claude dans l'esprit de ta méthode, à valider/corriger avant que
      ça parle en ton nom auprès des abonnés
- [ ] Confirmer avec ton ami que l'email "Ton diagnostic COAI" arrive bien
      (vérifier aussi les spams) — dernier maillon du pipeline notifs
      réparé cette nuit à valider en conditions réelles
- [ ] Activer sur Stripe (Réglages → Emails clients) l'email automatique
      de rappel avant fin d'essai — jamais fait, toujours en attente
- [ ] Faire relire par un juriste le texte de consentement de l'offre
      (7 jours puis facturation) — rédigé par Claude, jamais validé
      juridiquement, à faire avant que le volume d'inscriptions grossisse
- [ ] Vérifier que le portail de résiliation Stripe respecte bien
      l'obligation légale française de résiliation en 3 clics

**Côté Claude (code, à la prochaine session)** :
- [ ] Construire l'endpoint ManyChat côté COAI est fait
      (`/api/webhooks/whatsapp-manychat`) — reste à brancher une fois
      qu'Anthony a un flow ManyChat actif (clé `WHATSAPP_WEBHOOK_SECRET`
      à créer sur Vercel, puis renseigner côté ManyChat)
- [ ] Re-vérifier la liste complète des tables Supabase après les 3
      créées cette nuit (`diagnostic_leads`, `repas_log`, `avis`) — pas
      re-testé après coup que les 14 tables attendues (13 modèles +
      `_prisma_migrations`) sont bien toutes là
- [ ] Statut Apple Pay sur le checkout à essai (0€) — hypothèse
      SetupIntent vs PaymentIntent jamais confirmée ni corrigée
- [ ] Témoignages/preuves sociales — toujours en attente de vrai contenu
      client d'Anthony, ne pas fabriquer. Vérifié le 11/08/2026 : le
      formulaire `/avis` existant est privé par design (`model Avis` sans
      champ de consentement public) — pas réutilisable tel quel pour la
      homepage. Si Anthony veut avancer : ajouter une case de consentement
      explicite à `/avis` + une section témoignages publique qui ne se
      remplit qu'avec les avis consentis (rien à afficher tant qu'aucun
      abonné n'a coché la case).

## SEO technique : Open Graph par page + maillage interne (11/08/2026)

Quatrième repêchage de la même autre session Cowork (patch jamais poussé),
repris et vérifié ici (`tsc` + `build` réels). Jusqu'ici, seul le layout
racine déclarait des champs `openGraph`/`twitter` (titre/description
génériques "COAI — HI × AI™") — Next.js ne déduit pas automatiquement ces
champs à partir du `title`/`description` propres à chaque page. Résultat :
partager n'importe quelle page publique (pricing, une des 4 pages SEO...)
sur WhatsApp/Facebook/LinkedIn affichait toujours le même aperçu générique
au lieu du titre/texte spécifique à la page partagée.

- `openGraph`/`twitter` ajoutés sur les 7 pages publiques (accueil,
  pricing, diagnostic, + les 4 pages SEO) — `TITLE`/`DESCRIPTION` hissés en
  constantes réutilisées par `metadata`, `openGraph` et `twitter` pour
  éviter la duplication. L'image de partage reste celle générée
  dynamiquement par `src/app/opengraph-image.tsx` (déjà en place,
  héritée par toutes les pages via la convention de fichier Next.js).
- Nouveau composant `src/components/marketing/related-seo-links.tsx` :
  maillage interne entre les 4 pages SEO (`/coach-sportif-paris`,
  `/coach-sportif-en-ligne`, `/programme-musculation-ia`,
  `/coaching-nutrition-ia`) — chacune renvoie désormais vers les 3 autres
  juste avant son bloc CTA final. Avant ça, chacune était une impasse SEO
  (aucun lien interne vers les 3 autres), ce qui n'aidait ni la navigation
  ni la compréhension par Google de leur cohérence thématique.

## Tracking conversions Meta Pixel (11/08/2026)

Troisième repêchage de la même autre session Cowork (patch jamais poussé),
repris et vérifié ici (`tsc` + `build` réels). Le Pixel Meta (installé le
09/08, cf. section SEO/acquisition plus bas) n'envoyait que "PageView"
depuis son installation — aucun signal de conversion réelle ne remontait à
Meta, alors qu'un premier budget pub Meta/Instagram a déjà été dépensé :
l'algorithme de diffusion ne pouvait optimiser que sur les clics/vues, pas
sur qui convertit vraiment.

Trois points du funnel instrumentés avec les événements standards Meta
(en plus de GA4, déjà en place, `src/lib/analytics.ts#trackMetaEvent`) :
- Quiz diagnostic public → `Lead` (le seul point qui n'envoyait encore
  aucun signal, alors que c'est la page vers laquelle pointent les pubs
  Meta actuelles)
- Création de compte (`/sign-up`, flow email/mot de passe) →
  `CompleteRegistration` — **pas encore fait sur le flow Google OAuth**
  (`completer-inscription-form.tsx`), à faire si Anthony veut une couverture
  complète
- Confirmation d'abonnement (`/bienvenue`) → `StartTrial` ou `Subscribe`
  selon que l'essai de 7 jours est en cours ou déjà sauté, avec la valeur
  mensuelle réelle de l'offre (19/49/199€)

## Réassurance page publique (11/08/2026)

Même repêchage qu'au-dessus : patch d'une autre session Cowork (jamais
poussé), repris et vérifié ici (`tsc` + `build` réels).

En attendant les témoignages consentis (cf. checklist du haut), renforcé ce
qui ne dépend pas de vrais avis clients — tout est un fait déjà vrai
ailleurs sur le site (CGV, confidentialité), rien de nouveau promis :

- `src/components/marketing/trust-badges.tsx` (nouveau) : bandeau de badges
  "Sans engagement", "Résiliable à tout moment", "Coach diplômé d'État",
  "Paiement sécurisé (Stripe)", "Données hébergées en UE (RGPD)" — ajouté
  sous les CTA du hero (homepage) et sous le titre de `/pricing`.
  Volontairement **pas** de "satisfait ou remboursé" : les CGV excluent
  explicitement le remboursement au prorata et la rétractation sur la
  période d'essai déjà consommée — en ajouter un aurait contredit le
  contrat.
- 2 questions FAQ ajoutées sur la homepage : "Et si mon programme ne me
  convient pas ?" (réponse honnête : ajustements/régénération, puis
  résiliation si besoin — pas de promesse de remboursement) et "Mes
  données sont-elles en sécurité ?" (RGPD/UE, Stripe, export/suppression
  déjà existants).

## Rétention : relance étendue + bilan mensuel (11/08/2026)

Une autre session Claude Code (Cowork, sans accès `git push` direct) avait
préparé ce chantier sous forme de patch email à appliquer à la main —
jamais poussé nulle part, repéré et repris proprement ici (avec `tsc` et
`build` réels, contrairement à cette session-là qui n'avait pas accès
réseau npm).

1. **Relance d'inactivité étendue à Transformation/Premium** (jusque-là
   Impulsion uniquement) — `src/app/api/cron/relance-inactifs/route.ts`.
   Message personnalisé et signé "Anthony" sur ces deux paliers (au lieu de
   "L'équipe COAI") pour préserver le positionnement coaching humain.
   `alerterDouleurImpulsion` non touchée (reste Impulsion uniquement —
   Transformation a déjà un coach humain qui lit les mentions de douleur
   via `/admin/suivi`).
2. **Bilan mensuel automatique** (nouveau) —
   `src/app/api/cron/bilan-mensuel/route.ts`, nouvelle route + nouveau cron
   Vercel (`vercel.json`). Récap par email (séances loggées, delta de
   poids, delta de charge sur l'exercice le mieux renseigné) calculé sur
   une fenêtre glissante par abonné (~30 jours depuis son dernier bilan ou
   son inscription), pas un envoi groupé le 1er du mois. Rien envoyé si
   aucune séance sur la période (le cas "inactif" est déjà couvert par le
   point 1).
3. Nouveau champ `User.dernierBilanMensuelEnvoyeAt` + migration
   `20260811060000_add_bilan_mensuel` — **pas encore appliquée en prod**,
   cf. checklist du haut.
4. Helper `src/lib/cron/auth.ts` extrait (dupliqué avant dans
   relance-inactifs).

Vérifié cette fois : `npx tsc --noEmit` et `npm run build` passent tous les
deux. Reste à vérifier (cf. checklist) : migration appliquée en prod, quota
de crons Vercel, et un vrai envoi test des 2 emails avant qu'un abonné
payant les reçoive.

## Assistant WhatsApp automatisé (10/08/2026)

Le code existant (`src/lib/whatsapp/client.ts`, `/api/webhooks/whatsapp`,
env `MAKE_OUTGOING_WEBHOOK_URL`/`WHATSAPP_WEBHOOK_SECRET`) supposait depuis le
tout début du projet qu'Anthony avait déjà un assistant WhatsApp automatisé
("Coaching 2.0", Make.com + Twilio) — **hypothèse fausse, jamais vérifiée
avec lui**, découverte le 10/08 en creusant pourquoi `notifyMakeScenario`
échouait silencieusement (même famille de bug que les notifs email/tables
manquantes découvertes le même jour). Rien n'existait réellement côté
Anthony.

Décision du 10/08 : construire cette fois pour de vrai, avec **ManyChat**
(plus adapté que Make.com+Twilio — WhatsApp Business intégré nativement,
pas besoin de gérer Twilio séparément) plutôt que l'ancienne hypothèse
Make.com. Le vieux code Make.com sera à remplacer/adapter, pas juste
complété.

Étapes, dans l'ordre :
1. **Anthony (hors code)** : acheter une carte SIM prépayée (prévu le
   11/08), l'insérer dans un vieux téléphone dont il dispose déjà — ce
   numéro doit être neuf pour WhatsApp (jamais utilisé sur l'app WhatsApp
   classique), condition requise par Meta pour le brancher sur WhatsApp
   Business Platform (API).
2. **Anthony (hors code)** : créer un compte ManyChat, connecter WhatsApp
   via leur flow "Embedded Signup" (crée le compte Meta Business si besoin
   + valide le numéro en même temps).
3. **Claude (code)** : construire l'endpoint côté COAI que ManyChat
   appellera (via son "External Request") à chaque message reçu sur
   WhatsApp — identifie l'abonné par numéro de téléphone, va chercher son
   profil/dernier programme en base, génère une réponse IA avec ce
   contexte (réutilise la logique déjà en place pour `/coach`), renvoie la
   réponse à ManyChat qui l'affiche sur WhatsApp. Remplace l'ancien
   webhook sortant Make.com par l'API ManyChat (clé API + id abonné) pour
   les notifications proactives (ex: "ton programme est prêt").

## Pistes de croissance / distribution (08/08/2026)

Idées d'Anthony pour élargir la distribution de COAI au-delà des abonnés
particuliers :

- **Coachs indépendants** : leur proposer COAI en marque blanche / outil pour
  gérer leurs propres clients. Cycle de vente court, valide le produit en
  B2B2C avant d'attaquer plus gros.
  - **Cadrage produit fait le 08/08/2026 (à laisser mûrir, pas démarré)** :
    inspiré de TrueCoach (logiciel US pour coachs indépendants, ~26-137€/mois
    selon nb de clients, mais programmation 100% manuelle — pas d'IA). COAI
    garderait sa différenciation "l'IA génère, le coach valide", sauf que le
    validateur ne serait plus systématiquement Anthony mais le coach abonné
    lui-même, pour ses propres clients.
    - Nouveaux rôles à introduire : `Particulier` (existant), `Coach`
      (nouveau — gère un portefeuille de clients, ne voit que les siens),
      `Admin` (déjà Anthony, supervise tout). Techniquement : champ `role`
      sur `User` + relation coach→clients + routage de la file
      `EN_ATTENTE` vers le bon coach au lieu d'atterrir toujours chez
      Anthony.
    - 3 modèles de facturation envisagés, à trancher avant de coder : (1)
      coach paie par client actif façon TrueCoach, (2) coach paie un
      abonnement plateforme fixe quel que soit son volume, (3) le client
      final paie COAI directement et le coach touche une commission
      (facturation multi-parties, plus complexe).
    - Autres décisions en attente : tester d'abord avec 1-2 coachs pilotes
      vs. self-service ouvert direct ; nom/branding de l'offre (ex: "COAI
      Pro" / "COAI for Coaches").
    - Ampleur estimée : plusieurs jours de dev (rôles/permissions,
      facturation coach, UI dédiée liste clients/invitations, ~15-20
      fichiers existants supposent aujourd'hui un seul coach validateur) —
      réutilise l'essentiel du moteur déjà là (génération IA, statuts de
      programme, Stripe).
- **Clubs de sport** : proposer COAI aux clubs pour leurs adhérents. Plus
  lourd à vendre (contrats, plusieurs décideurs, intégration) mais gros
  volume potentiel si ça prend.
- **Levée de fonds bancaire** : peu réaliste en amorçage sans CA — les
  banques ne financent pas ce profil. Cible plus pertinente : business
  angels / VC / BPI France, qui demanderont des métriques (abonnés,
  rétention) qu'on n'a pas encore.
- **Partenaire type Mounir Lagoune** : utile pour visibilité/réseau, mais ce
  type de profil embarque généralement après un minimum de traction, pas
  avant.

**Priorité recommandée** : d'abord obtenir quelques dizaines d'abonnés
payants + une rétention correcte (via coachs indépendants en premier), ce
qui rend ensuite les clubs, les investisseurs et les partenaires beaucoup
plus faciles à convaincre.

- **Partenariat kiné / diététicienne** (idée du 08/08/2026, à creuser) :
  s'associer avec un kinésithérapeute et une diététicienne pour compléter
  l'offre COAI (aujourd'hui centrée entraînement/nutrition/récupération
  via IA + validation coach) — renforcerait la crédibilité santé et
  ouvrirait des cas d'usage complémentaires (rééducation, suivi
  nutritionnel plus poussé). Détails du modèle (rémunération, intégration
  produit) restent à définir.

## Levée / financement (08/08/2026)

- **Montant recherché** : pas encore arrêté — un chiffre de 150 000 € a été
  mentionné une fois puis retiré (Anthony ne se souvenait pas de l'avoir
  écrit), à reconfirmer avec lui avant de le remettre où que ce soit.
- Utilisation prévue : acquisition (coachs indépendants, campagne),
  développement produit, recrutement d'un second coach validateur.
- Ce qui est proposé en échange reste à définir selon l'interlocuteur
  (participation, intérêts, visibilité croisée, accès réseau).
- Un deck de présentation (COAI-presentation.pptx, 12 slides) a été généré
  pour ces rendez-vous : problème/solution, produit, fondateur, modèle
  économique, marché (chiffres sourcés), positionnement, traction (renvoie
  vers `/admin/business`), stratégie de distribution, demande de
  financement (slide "montant" volontairement laissée en placeholder tant
  que le chiffre n'est pas confirmé). Livré à Anthony, pas versionné dans
  le repo.

## Pricing (08/08/2026)

- **Restructuration de l'offre Gratuite en offre d'appel** : au lieu d'un
  palier gratuit illimité, nouvelle inscription = 1 mois offert avec carte
  bancaire obligatoire dès le départ, puis passage automatique à un tarif
  payant (produit Stripe `COAI gratuit`). Prix initial 9€/mois
  (`price_1U277IAPYODLq9KTSpX3vjKC`), remonté le jour même à **19€/mois**
  (`price_1U29OpAPYODLq9KTXU5kusap`, nouveau produit "Coai gratuit
  strantard puis 19") suite à l'ajout de la génération de programme IA à
  ce palier (cf. plus bas). Palier du milieu (STANDARD, 49€/mois)
  inchangé en prix. Décision prise sans abonnés existants à migrer.
- **Renommage des paliers (08/08/2026)** : GRATUIT (19€) affiché
  "**Impulsion**", STANDARD (49€) affiché "**Transformation**" — partout
  sur le site (pricing, compte, dashboard, CGV, emails). L'enum Prisma
  `PREMIUM` (199€, ancienne offre 1-to-1, non vendue) garde son propre
  label "Ancien Premium", à ne pas confondre avec le nouveau nom
  "Transformation" du palier STANDARD.
- **Palier Impulsion (Gratuit/19€) : programme généré par IA sans
  relecture coach** (08/08/2026) — jusque-là ce palier n'avait pas accès
  à la génération de programme du tout (réservée à Transformation).
  Nouveau statut `GENERE_IA` (distinct de `EN_ATTENTE`/`VALIDE`) : le
  programme est généré et visible immédiatement, jamais envoyé à la file
  de relecture d'Anthony. Objectif explicite : que la validation humaine
  ne soit plus un facteur limitant pour scaler (recrutement prévu
  d'autres coachs pour Transformation, cf. section Levée/financement).
- Palier "Premium+" (199€/mois, self-serve) ajouté puis retiré le jour
  même sur demande d'Anthony — le produit Stripe `COAI Premium` à 199€ a
  été archivé (renommage `COAI standard` → `COAI Premium` fait par Anthony
  pour la clarté du dashboard Stripe, sans lien avec le nom affiché côté
  site qui reste piloté par `price_id`, pas par le nom du produit).
- Case de consentement dédiée ajoutée au flow d'inscription (RGPD +
  aptitude sportive existaient déjà) : reconnaissance des conditions de
  l'offre (7 jours puis 19€/mois) + renonciation au droit de rétractation de
  14 jours pour la partie du service consommée pendant la période offerte.
  Texte rédigé par Claude, **pas relu par un juriste** — à faire valider
  avant que le volume d'inscriptions grossisse.
- **Essai gratuit ramené à 7 jours** (08/08/2026, était 1 mois) : décision
  d'Anthony pour raccourcir le cycle avant premier prélèvement. Changement
  fait uniquement côté code (`trial_period_days: 7` dans
  `/api/stripe/checkout`) — rien à modifier côté Stripe (le prix
  `price_1U29OpAPYODLq9KTXU5kusap` à 19€/mois est inchangé, la durée
  d'essai est un paramètre de la session Checkout, pas de l'objet Price) ni
  nouvelle migration Prisma (le champ `trialEnd` existait déjà). Toutes les
  mentions "1 mois offert" liées à l'essai signup ont été remplacées par
  "7 jours offerts" (pricing, CGV, sign-up, dashboard/compte, homepage). Ne
  concerne PAS la récompense de parrainage ci-dessous, qui reste 1 mois.
- **Génération de programme bloquée pendant l'essai** (09/08/2026) :
  jusque-là rien n'empêchait de générer son programme IA pendant les 7
  jours offerts puis de résilier avant le premier prélèvement (programme
  gratuit sans jamais payer). Bloqué désormais côté serveur
  (`/api/programmes/generate` renvoie 403 si `isInTrial()`, nouvelle
  fonction dans `src/lib/subscription/plan.ts`) et côté UI (bouton
  générer masqué, message explicatif à la place tant que l'essai n'est
  pas terminé). Se débloque au premier prélèvement réel (fin d'essai
  Impulsion, ou souscription directe à Transformation qui n'a pas
  d'essai).
- **Option "démarrer tout de suite" à l'inscription** (09/08/2026) : pour
  qui ne veut pas attendre 7 jours, un second choix sur les deux flux
  d'inscription (email/mdp et Google OAuth) facture l'abonnement
  Impulsion (19€/mois) immédiatement au lieu de passer par l'essai Stripe
  (`skipTrial: true` dans le body de `/api/stripe/checkout`, qui omet
  simplement `trial_period_days`) — texte de consentement adapté en
  conséquence. Comme la génération se débloque au premier paiement réel
  (cf. ci-dessus), ce choix donne accès au programme dès la fin du
  paiement.
- **Parrainage** (08/08/2026) : lien unique par utilisateur
  (`/sign-up?ref=CODE`, généré à la demande), visible sur une carte dédiée
  dans compte/abonnement. Quand un filleul passe payant (fin de ses 7 jours
  offerts), le parrain reçoit automatiquement 1 mois offert sur son propre
  abonnement (coupon Stripe créé à la demande, appliqué via webhook). Le
  filleul n'a aucun avantage en plus d'une inscription normale.
- Reste à activer côté Stripe (Réglages → Emails clients) : l'email
  automatique de rappel avant la fin de l'essai, pour réduire les litiges
  et donner une vraie visibilité aux futurs abonnés avant le prélèvement.
- Résiliation : repose sur le portail Stripe existant (`PortalButton`) —
  à vérifier qu'il respecte bien l'obligation légale française de
  résiliation en 3 clics (juin 2023) une fois que des abonnés réels
  passeront par ce flow.

## Identité publicitaire / direction créative (10/08/2026)

Direction donnée par Anthony pour toute future création publicitaire/visuelle
COAI (pub payante, réseaux, futures pages de vente) — à respecter par défaut
sauf instruction contraire :

- **Ordre du message : le désir d'abord, le produit ensuite.** On ne vend pas
  une liste de fonctionnalités en premier — on vend un univers désirable, et
  seulement après on explique comment COAI y mène.
- **Univers visuel voulu** : corps fit, athlétiques et sexy (homme et femme),
  confiance en soi, énergie, peau au soleil, plage, piscine, palmiers,
  hôtel/villa premium, beaux vêtements, nourriture saine, récupération.
  **Explicitement pas le cliché "bodybuilding"** — un physique désirable,
  esthétique et accessible, pas une esthétique de compétition.
- **Exemples d'accroches à garder sous le coude** (proposées par Anthony,
  pas encore choisies/tranchées pour un usage précis) :
  - « Ton corps. Ton rythme. Ton objectif. »
  - « Deviens la meilleure version de toi-même. »
  - « COAI — L'IA génère. Ton coach valide. »
- **La crédibilité vient après le rêve, pas à sa place** : une fois
  l'attention captée par l'univers désirable, le message redescend sur ce
  qui rend la promesse crédible — entraînement + nutrition + récupération +
  personnalisation + validation humaine.
- **Formule résumée à garder comme identité publicitaire COAI** : désir +
  lifestyle + technologie + accompagnement humain. C'est la combinaison à
  retenir pour toute future pub/visuel, pas juste un one-off pour une
  campagne donnée.

## SEO / acquisition (09/08/2026)

Objectif fixé par Anthony : les 100 premiers abonnés, **en acquisition
externe uniquement** — ses clients actuels restent en présentiel, pas de
conversion de sa base existante vers COAI. Priorité donc aux canaux qui
touchent des gens qui ne le connaissent pas encore.

**Précision importante (09/08/2026)** : la règle couvre tout son réseau
personnel/professionnel, pas seulement ses clients payants actuels — il le
garde volontairement pour du VIP présentiel, pas pour COAI. Concrètement :
**pas de démarchage ciblé de ses contacts** (pas de message individuel à
son réseau pour lui proposer COAI), même si un contact s'inscrit de
lui-même sans sollicitation (ex : David Benzaken, ami à Miami, inscrit
spontanément le 09/08). Le contenu organique public (Reels/Shorts) reste
OK — il touche qui veut bien s'abonner, ce n'est pas du démarchage ciblé.
Ne plus proposer d'outreach personnel comme levier d'acquisition.

- **Fiche Google Business Profile** créée (`Prestataire de services`,
  catégorie "Coach sportif", zone de service Paris/Île-de-France, sans
  adresse affichée). En attente de validation Google (jusqu'à 5 jours,
  vérification par téléphone). Description, photos (portrait + bannière
  COAI générée) et infos renseignées.
- **Chaîne YouTube** habillée : bannière (2560×1440), avatar (logomark
  officiel — arc doré ouvert + œil bleu, généré via `next/og`/satori),
  filigrane vidéo (150×150, affichage "Intégralité de la vidéo"),
  description, **identifiant renommé en COAI (09/08/2026, fait par
  Anthony)**.
- **4 pages d'atterrissage SEO** créées et poussées : `/programme-musculation-ia`,
  `/coach-sportif-en-ligne`, `/coaching-nutrition-ia`, `/coach-sportif-paris`
  — chacune écrite autour d'une intention de recherche précise (pas la
  page d'accueil générale qui doit couvrir tous les sujets à la fois),
  avec FAQ + données structurées FAQPage (schema.org) pour les rich
  snippets Google. Ajoutées au sitemap, liées depuis le footer.
- **TikTok créé** (09/08/2026, par Anthony) — canal supplémentaire,
  cohérent avec la stratégie (contenu public, pas du démarchage ciblé).
- **Pixel Meta installé** (09/08/2026) — `NEXT_PUBLIC_META_PIXEL_ID` câblé
  dans le code (`src/components/analytics/meta-pixel.tsx`, même schéma que
  GoogleAnalytics), ID du dataset Events Manager : `921687973761982`,
  variable ajoutée par Anthony sur Vercel. Premier test de pub Meta/
  Instagram lancé (ciblage Paris + fitness, ~75-100€ sur 5-7 jours, lien
  vers `/coach-sportif-paris` avec UTM `utm_source=meta`).
- **Idées explorées mais pas retenues pour l'instant** : lien
  d'affiliation avec commission (proposé de tester à la main avec 1-2
  influenceurs avant de développer un vrai système), Meta Verified (pas
  utile tant que l'audience est minuscule, coût récurrent sans effet sur
  l'algorithme), page/calculateur gratuit comme aimant à leads (pas fait).
- **Contenu organique** (Shorts/Reels) déjà démarré par Anthony de son
  côté, en parallèle.
- **Règle stricte confirmée (09/08/2026)** : pas de démarchage ciblé du
  réseau personnel/professionnel d'Anthony pour COAI — il le garde pour du
  VIP présentiel. Seuls leviers acceptés : pub payante externe, SEO,
  contenu organique public. Voir aussi la précision plus haut dans la
  section Pistes de croissance.

## À faire plus tard

- **App mobile (iOS/Android) — décision révisée le 08/08/2026** : Anthony
  veut désormais viser le grand public ("toute la planète"), pas
  uniquement ses abonnés déjà inscrits via le site — ça change la stack et
  le modèle de monétisation par rapport à la décision initiale du même
  jour (ci-dessous, obsolète) :
  - **Stack : React Native** (au lieu de Capacitor). Capacitor aurait
    permis de réutiliser le site Next.js tel quel dans une coque native ;
    React Native impose une réécriture complète du front (vues natives,
    pas de HTML/CSS/DOM), le backend/API restant inchangés. Choix assumé
    par Anthony malgré le travail supplémentaire, en échange d'une vraie
    expérience native.
  - **Paiement : Stripe + Apple IAP en parallèle**, pas de bascule
    complète vers Apple. Stripe reste le paiement par défaut sur le site
    (frais bas ~2,9%+0,30€, couvre aussi Android/desktop). L'achat intégré
    Apple (commission 15-30% selon le programme Small Business) s'ajoute
    uniquement pour les abonnements souscrits depuis l'app iOS —
    nécessitera de synchroniser les deux systèmes d'abonnement
    (entitlements côté app selon la source de paiement).
  - **Chantier démarré (08/08/2026)** : repo dédié
    [`coai-mobile`](https://github.com/anthonydarmon213-ux/coai-mobile)
    créé (Expo + React Native, TypeScript). Scaffold + v1 poussés : écrans
    Connexion, Dashboard, Programme, Suivi séances, Suivi mesures,
    Compte/abonnement — branchés sur le même Supabase et les mêmes routes
    `/api/*` que le site. Reportés à une v2 : Coach IA (chat), tests
    physiques + partage, parrainage, upload bracelet connecté/photo
    morphologique. Reste à faire : Apple IAP + synchronisation
    Stripe/Apple, tester sur device réel (Expo Go), build App Store
    Connect (sur le Mac d'Anthony).
  - **Changement backend associé (repo `lab-coach`)** : `getCurrentUser()`
    (`src/lib/auth/server.ts`) accepte désormais un header
    `Authorization: Bearer <access_token>` en plus du flux cookie web —
    c'est ce qui permet à l'app mobile de s'authentifier contre les routes
    `/api/*` existantes sans navigateur. Deux nouvelles routes JSON ajoutées
    pour l'app (le site les affichait jusque-là uniquement via des Server
    Components) : `GET /api/compte/moi` (résumé plan/abonnement) et
    `GET /api/programmes` (dernier programme par pilier).
  - Contrainte technique inchangée : build/soumission App Store Connect
    nécessitent Xcode (macOS uniquement) — à faire sur le Mac d'Anthony ;
    le code React Native peut en revanche être développé depuis n'importe
    quel environnement, y compris les sessions Claude Code actuelles
    (Linux).
  - *Décision initiale du 08/08/2026, remplacée par ce qui précède* : app
    via Capacitor, réservée aux abonnés déjà inscrits via le site web,
    sans inscription/paiement dans l'app (pour éviter l'IAP).

## Incidents résolus

- **08/08/2026** — Deux bugs production successifs corrigés et confirmés en
  Sentry : (1) `NotFoundError: removeChild` causé par le conflit
  React/traduction auto du navigateur (fix : `translate="no"` sur `<html>`
  + meta `notranslate`) ; (2) "Cookies can only be modified in a Server
  Action or Route Handler" causé par les callbacks `set`/`remove` non
  protégés dans `src/lib/auth/server.ts` (fix : try/catch, le middleware
  gère déjà la persistance du token rafraîchi).
## Phase Revenus 1 — tunnel et relance diagnostic (12/08/2026)

Le dashboard business mesure désormais sur 30 jours le passage entre quatre
étapes internes vérifiables : diagnostic terminé, compte créé, essai actif et
client réellement sorti d'essai. Le rapprochement se fait par email normalisé,
sans nouveau traceur ni donnée personnelle.

Le cron quotidien existant relance une seule fois, après 24 heures, les
diagnostics dont le résumé a bien été envoyé mais qui n'ont créé aucun compte.
La relance rappelle les deux formules, l'essai de 7 jours et les tarifs annuels.
Un compte existant exclut immédiatement le prospect de cette relance. Le champ
`conversionReminderSentAt` empêche les doubles envois.

## Phase Revenus 2 — priorité à l'annuel (12/08/2026)

Les offres annuelles existantes deviennent le choix affiché par défaut sur la
page Formules et après le diagnostic. Le mensuel reste disponible en un clic.
Les économies exactes sont explicitées : 38 € sur Impulsion et 98 € sur
Transformation. Les prix et les 7 jours d'essai ne changent pas. Les événements
de sélection transmettent désormais aussi le rythme de facturation afin de
comparer mensuel et annuel dans GA4.

## Phase Revenus 3 — acquisition attribuable (12/08/2026)

Le dashboard business ventile désormais les 30 derniers jours par première
source/campagne connue : diagnostics uniques, comptes, essais actifs, clients
payants et conversion diagnostic → payant. Les rapprochements utilisent les
emails normalisés déjà recueillis ; aucune nouvelle donnée ni plateforme n'est
ajoutée. Deux liens Meta normalisés (`video_1` et `video_2`) sont fournis pour
envoyer chaque publicité vers le diagnostic tout en conservant une attribution
comparable dans GA4 et dans COAI.

## Phase Revenus 4 — activation des essais (12/08/2026)

Le dashboard suit désormais, parmi les essais actifs, la génération d'un
programme et la première séance. Le cron quotidien relance une seule fois les
essais actifs depuis plus de 24 heures qui n'ont encore aucun programme, puis
les renvoie vers `/bienvenue` pour reprendre l'activation. Les essais déjà
activés, annulés ou terminés sont exclus. Aucun nouvel outil d'email n'est
ajouté : Resend et le cron existants sont réutilisés.

## Phase Revenus 5 — récupération Checkout (12/08/2026)

Le début d'un Checkout Stripe est désormais mémorisé côté serveur avec le plan
et la périodicité, sans aucune donnée bancaire. Si aucun abonnement actif
n'existe deux heures plus tard, une relance unique permet de reprendre l'offre
choisie. La validation Stripe neutralise immédiatement la relance. Le retour
d'annulation affiche aussi une confirmation explicite qu'aucun paiement n'a
été enregistré. Le dashboard mesure les Checkouts commencés et relancés ; les
échecs de paiement continuent d'être traités par le webhook Stripe existant.

## Phase Revenus 6 — récupération des paiements échoués (12/08/2026)

Le premier échec déclenche toujours l'email immédiat du webhook Stripe. Si
l'abonnement reste en retard 48 heures plus tard, le cron envoie une relance
unique vers le portail de facturation sécurisé. Un paiement réussi neutralise
automatiquement toute relance restante. Le dashboard mesure les relances, les
paiements régularisés sous 14 jours et le revenu ainsi récupéré. COAI ne stocke
aucune donnée bancaire.
