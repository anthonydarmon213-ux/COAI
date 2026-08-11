# Notes stratégiques COAI

Ce fichier sert de mémoire persistante entre les sessions pour les idées et
décisions business d'Anthony (pas de la doc technique — voir README.md pour
ça). Il est lu automatiquement au démarrage de chaque session Claude Code.

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
