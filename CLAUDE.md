# Notes stratégiques COAI

Ce fichier sert de mémoire persistante entre les sessions pour les idées et
décisions business d'Anthony (pas de la doc technique — voir README.md pour
ça). Il est lu automatiquement au démarrage de chaque session Claude Code.

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
