// Bibliothèque de programmes prêts à l'emploi (19/08/2026, demande Anthony),
// même principe que le catalogue d'exercices et les recettes : une
// bibliothèque de référence statique, indépendante et additive par rapport
// au programme généré dynamiquement par l'IA (jamais bloquante, jamais en
// remplacement) — l'utilisateur garde son programme personnalisé habituel,
// et peut piocher ici s'il veut un focus précis (objectif de course,
// mobilité, challenge...).
//
// Premier jet à relire par Anthony avant mise en avant massive : la
// "semaine type" de chaque programme est volontairement représentative
// plutôt qu'un détail exhaustif semaine par semaine.

export type CategorieProgrammePret =
  | "MOBILITE"
  | "CARDIO_SEMI_MARATHON"
  | "CARDIO_HYROX"
  | "PERTE_DE_POIDS"
  | "POIDS_DU_CORPS"
  | "FESSIERS"
  | "CHALLENGE_30_JOURS";

export const CATEGORIE_PROGRAMME_LABEL: Record<CategorieProgrammePret, string> = {
  MOBILITE: "Mobilité",
  CARDIO_SEMI_MARATHON: "Semi-marathon",
  CARDIO_HYROX: "Hyrox",
  PERTE_DE_POIDS: "Perte de poids",
  POIDS_DU_CORPS: "Poids du corps",
  FESSIERS: "Fessiers",
  CHALLENGE_30_JOURS: "Challenge 30 jours",
};

export type JourProgrammePret = {
  jour: string;
  focus: string;
  contenu: string;
};

export type ProgrammePret = {
  slug: string;
  nom: string;
  categorie: CategorieProgrammePret;
  niveau: string;
  duree: string;
  frequence: string;
  accroche: string;
  description: string;
  objectifs: string[];
  photoQuery: string;
  jours: JourProgrammePret[];
};

export const PROGRAMMES_PRETS: ProgrammePret[] = [
  {
    slug: "mobilite-totale",
    nom: "Mobilité totale — Débloque tes articulations",
    categorie: "MOBILITE",
    niveau: "Tous niveaux",
    duree: "4 semaines",
    frequence: "3 séances / semaine, 20-25 min",
    accroche: "Regagne de l'amplitude, réduis les raideurs, bouge sans y penser.",
    description:
      "Un programme court et régulier pour redonner de la liberté de mouvement aux articulations les plus sollicitées au quotidien — hanches, épaules, colonne thoracique, chevilles. Idéal en complément de ton entraînement principal ou en reprise en douceur.",
    objectifs: [
      "Retrouver de l'amplitude aux hanches et aux épaules",
      "Réduire les tensions liées à la position assise prolongée",
      "Préparer le corps aux séances plus intenses",
      "Améliorer la qualité de mouvement au quotidien",
    ],
    photoQuery: "person stretching mobility exercise",
    jours: [
      {
        jour: "Jour 1",
        focus: "Hanches & chevilles",
        contenu:
          "10 min de mobilité hanches (cercles de hanche, fentes avec rotation, grenouille tenue) puis 10 min chevilles (rotations, montées sur demi-pointe lentes). Termine par 3 respirations profondes en position basse.",
      },
      {
        jour: "Jour 2",
        focus: "Épaules & thoracique",
        contenu:
          "Mobilité épaules (cercles bras tendus, passages de bâton ou serviette derrière le dos) puis rotations thoraciques à quatre pattes. 15 à 20 répétitions lentes et contrôlées par mouvement.",
      },
      {
        jour: "Jour 3",
        focus: "Mobilité globale & respiration",
        contenu:
          "Enchaînement complet corps entier (chat-vache, salutation au soleil lente, torsions debout) suivi de 5 minutes de respiration diaphragmatique calme pour clôturer la semaine.",
      },
    ],
  },
  {
    slug: "prepa-semi-marathon",
    nom: "Prépa Semi-marathon — 8 semaines",
    categorie: "CARDIO_SEMI_MARATHON",
    niveau: "Intermédiaire",
    duree: "8 semaines",
    frequence: "4 séances / semaine",
    accroche: "Construis ton endurance et arrive à la ligne de départ prêt·e.",
    description:
      "Une trame progressive pour préparer un semi-marathon (21,1 km) sans te blesser : endurance fondamentale, fractionné pour développer ta vitesse, sortie longue pour habituer le corps à la distance, récupération active. À adapter selon ton niveau de course actuel.",
    objectifs: [
      "Construire une base d'endurance solide",
      "Améliorer ton allure sur la distance",
      "Habituer le corps à courir longtemps sans te blesser",
      "Arriver reposé·e le jour de la course",
    ],
    photoQuery: "person running outdoor training",
    jours: [
      {
        jour: "Jour 1",
        focus: "Endurance fondamentale",
        contenu:
          "40 à 50 min à allure confortable, celle où tu peux encore parler sans être essoufflé·e. C'est la base de tout le programme, jamais à sacrifier.",
      },
      {
        jour: "Jour 2",
        focus: "Fractionné",
        contenu:
          "Échauffement 10 min, puis 8 à 10 x 400m à allure rapide (récupération 90 sec trot léger entre chaque), retour au calme 10 min.",
      },
      {
        jour: "Jour 3",
        focus: "Récupération active",
        contenu: "20 à 30 min de course très lente ou vélo/marche rapide, plus 10 min de mobilité chevilles et hanches.",
      },
      {
        jour: "Jour 4",
        focus: "Sortie longue",
        contenu:
          "La séance clé de la semaine : distance qui augmente progressivement semaine après semaine (démarrer autour de 8-10 km, viser 16-18 km à l'approche de la course), toujours à allure très confortable.",
      },
    ],
  },
  {
    slug: "prepa-hyrox",
    nom: "Prépa Hyrox — 6 semaines",
    categorie: "CARDIO_HYROX",
    niveau: "Intermédiaire à avancé",
    duree: "6 semaines",
    frequence: "4 séances / semaine",
    accroche: "Course + ateliers fonctionnels : prépare-toi au format le plus exigeant du fitness compétitif.",
    description:
      "Hyrox alterne course à pied et ateliers fonctionnels (sled push/pull, wall balls, burpees broad jump, rowing, farmer carry...). Ce programme combine capacité cardio, force fonctionnelle et transitions rapides entre les efforts — le vrai facteur limitant de la discipline.",
    objectifs: [
      "Développer l'endurance cardio sous fatigue musculaire",
      "Renforcer les mouvements fonctionnels clés de la compétition",
      "Améliorer la vitesse de transition entre les ateliers",
      "Construire la résistance mentale sur un effort long",
    ],
    photoQuery: "functional fitness training sled push",
    jours: [
      {
        jour: "Jour 1",
        focus: "Course + force",
        contenu: "5 km à allure soutenue, puis circuit force (sled push/pull si disponible, sinon fentes chargées et tirages) 4 tours.",
      },
      {
        jour: "Jour 2",
        focus: "Ateliers fonctionnels",
        contenu:
          "Circuit type compétition : rowing 500m, 20 wall balls, 15 burpees broad jump, farmer carry 200m — 3 à 4 tours, transitions chronométrées.",
      },
      {
        jour: "Jour 3",
        focus: "Cardio + gainage",
        contenu:
          "30 min de cardio continu (course, vélo ou rameur) suivi de 10 min de gainage varié (planche, gainage latéral, dead bug chargé).",
      },
      {
        jour: "Jour 4",
        focus: "Simulation courte",
        contenu:
          "Enchaînement de 3 à 4 ateliers Hyrox à la suite, sans pause entre eux, pour habituer le corps à l'enchaînement course/atelier propre à la compétition.",
      },
    ],
  },
  {
    slug: "perte-de-poids",
    nom: "Programme Perte de poids — 6 semaines",
    categorie: "PERTE_DE_POIDS",
    niveau: "Débutant à intermédiaire",
    duree: "6 semaines",
    frequence: "4 séances / semaine",
    accroche: "Un déficit calorique soutenu par l'entraînement, pas l'inverse.",
    description:
      "L'entraînement seul ne suffit jamais à perdre du poids sans un vrai déficit calorique — mais il conditionne le corps pendant la perte : préserver le muscle, soutenir le métabolisme, garder l'énergie. Ce programme combine full body et cardio modéré.",
    objectifs: [
      "Préserver la masse musculaire pendant la perte de poids",
      "Soutenir la dépense énergétique sans s'épuiser",
      "Construire une routine tenable sur la durée",
      "Garder de l'énergie au quotidien malgré le déficit",
    ],
    photoQuery: "person full body workout gym",
    jours: [
      {
        jour: "Jour 1",
        focus: "Full body force",
        contenu: "Squat, tirage horizontal, développé, fentes, gainage — 3 séries de 10 à 15 répétitions par mouvement, charge modérée.",
      },
      {
        jour: "Jour 2",
        focus: "Cardio modéré",
        contenu: "30 à 40 min à intensité modérée (marche rapide inclinée, vélo, rameur) — jamais à bout de souffle, un rythme tenable.",
      },
      {
        jour: "Jour 3",
        focus: "Full body force (variante)",
        contenu:
          "Soulevé de terre roumain, pompes ou développé, rowing, presse à cuisses ou squat gobelet, gainage — même logique que le jour 1, exercices variés.",
      },
      {
        jour: "Jour 4",
        focus: "Cardio + marche active",
        contenu:
          "20 min de cardio à intensité modérée puis 20 à 30 min de marche à allure normale — construit le volume d'activité quotidien sans ajouter de fatigue excessive.",
      },
    ],
  },
  {
    slug: "poids-du-corps",
    nom: "100% Poids du corps — 4 semaines",
    categorie: "POIDS_DU_CORPS",
    niveau: "Tous niveaux",
    duree: "4 semaines",
    frequence: "3 à 4 séances / semaine",
    accroche: "Aucun matériel, aucune excuse — chez toi, en voyage, où tu veux.",
    description:
      "Un programme complet qui ne demande rien d'autre que ton corps et un peu d'espace. Idéal si tu voyages beaucoup, si tu n'as pas encore de salle, ou si tu veux simplement revenir à l'essentiel : le contrôle de ton propre poids.",
    objectifs: [
      "Construire de la force sans aucun équipement",
      "Pouvoir s'entraîner n'importe où, n'importe quand",
      "Améliorer le contrôle corporel et la stabilité",
      "Poser une base solide avant d'ajouter du matériel",
    ],
    photoQuery: "bodyweight workout push up",
    jours: [
      {
        jour: "Jour 1",
        focus: "Haut du corps",
        contenu:
          "Pompes (variante selon niveau), dips sur chaise, superman, gainage planche — 3 à 4 séries par mouvement, répétitions jusqu'à quasi-échec technique.",
      },
      {
        jour: "Jour 2",
        focus: "Bas du corps",
        contenu: "Squats, fentes avant, pont fessier, mollets sur une jambe — 3 à 4 séries de 12 à 20 répétitions selon le mouvement.",
      },
      {
        jour: "Jour 3",
        focus: "Full body & cardio",
        contenu: "Circuit enchaîné burpees, mountain climbers, squat jump, pompes — 4 tours avec 1 min de récupération entre chaque.",
      },
      {
        jour: "Jour 4 (optionnel)",
        focus: "Gainage & mobilité",
        contenu:
          "Gainage varié (planche, gainage latéral, superman tenu) puis mobilité complète pour terminer la semaine en douceur.",
      },
    ],
  },
  {
    slug: "special-fessiers",
    nom: "Programme Fessiers — 4 semaines",
    categorie: "FESSIERS",
    niveau: "Tous niveaux",
    duree: "4 semaines",
    frequence: "3 séances / semaine",
    accroche: "Un focus dédié, pensé pour progresser vite et sans se blesser.",
    description:
      "Un programme ciblé sur le renforcement des fessiers — souvent le groupe musculaire le plus sous-sollicité au quotidien (position assise prolongée). Ouvert à tous, particulièrement pensé pour les demandes récurrentes de nos abonnées : progression claire, mouvements variés, sans surcharger le bas du dos.",
    objectifs: [
      "Renforcer et tonifier les fessiers en 4 semaines",
      "Corriger les déséquilibres liés à la position assise",
      "Varier les angles de travail (extension, abduction, unilatéral)",
      "Progresser sans solliciter excessivement le bas du dos",
    ],
    photoQuery: "glute bridge hip thrust workout",
    jours: [
      {
        jour: "Jour 1",
        focus: "Force",
        contenu:
          "Hip thrust ou pont fessier chargé, squat sumo, fentes bulgares — 4 séries de 10 à 12 répétitions, charge progressive semaine après semaine.",
      },
      {
        jour: "Jour 2",
        focus: "Activation & isolation",
        contenu: "Abductions à la poulie ou élastique, donkey kicks, clamshells — 3 séries de 15 à 20 répétitions, tempo lent et contrôlé.",
      },
      {
        jour: "Jour 3",
        focus: "Unilatéral & stabilité",
        contenu:
          "Fentes marchées, step-up, soulevé de terre roumain unijambiste — 3 séries de 10 à 12 répétitions par jambe, priorité à la technique sur la charge.",
      },
    ],
  },
  {
    slug: "challenge-30-jours",
    nom: "Challenge 30 jours COAI",
    categorie: "CHALLENGE_30_JOURS",
    niveau: "Tous niveaux",
    duree: "30 jours",
    frequence: "Un défi par jour",
    accroche: "30 petites actions, un vrai changement d'habitude.",
    description:
      "Pas un programme d'entraînement classique : un défi quotidien pensé pour créer une habitude durable en 30 jours, en mêlant mouvement, nutrition, récupération et mental. Chaque jour prend quelques minutes — l'objectif n'est pas la performance, c'est la régularité.",
    objectifs: [
      "Créer une habitude de mouvement quotidienne",
      "Découvrir les 3 piliers COAI en pratique (entraînement, nutrition, récupération)",
      "Rester motivé·e sur la durée grâce à des actions courtes",
      "Terminer le mois avec une routine qui tient",
    ],
    photoQuery: "motivation fitness challenge calendar",
    jours: [
      { jour: "Jour 1", focus: "Mouvement", contenu: "10 minutes de marche, dehors si possible." },
      { jour: "Jour 2", focus: "Nutrition", contenu: "Bois un grand verre d'eau au réveil, avant même le café." },
      { jour: "Jour 3", focus: "Mental", contenu: "Note un objectif clair pour les 30 prochains jours." },
      { jour: "Jour 4", focus: "Mouvement", contenu: "15 squats, 15 pompes (genoux si besoin), répète 3 fois." },
      { jour: "Jour 5", focus: "Récupération", contenu: "Couche-toi 30 minutes plus tôt que d'habitude." },
      { jour: "Jour 6", focus: "Nutrition", contenu: "Ajoute une portion de légumes à un repas où tu n'en mets jamais." },
      { jour: "Jour 7", focus: "Mouvement", contenu: "20 minutes d'activité au choix — marche, vélo, danse, ce que tu veux." },
      { jour: "Jour 8", focus: "Repos", contenu: "Jour de repos complet. La récupération fait partie du progrès." },
      { jour: "Jour 9", focus: "Mental", contenu: "Écris 3 choses que tu as bien faites cette semaine." },
      { jour: "Jour 10", focus: "Mouvement", contenu: "Gainage planche, cumule 2 minutes dans la journée (en plusieurs fois si besoin)." },
      { jour: "Jour 11", focus: "Nutrition", contenu: "Prépare un repas à l'avance pour demain." },
      { jour: "Jour 12", focus: "Mouvement", contenu: "30 fentes (15 par jambe), à ton rythme." },
      { jour: "Jour 13", focus: "Récupération", contenu: "10 minutes d'étirements avant de dormir." },
      { jour: "Jour 14", focus: "Mouvement", contenu: "20 minutes de cardio à intensité modérée." },
      { jour: "Jour 15", focus: "Mental", contenu: "Mi-parcours : relis ton objectif du jour 3. Toujours d'actualité ?" },
      { jour: "Jour 16", focus: "Nutrition", contenu: "Réduis le sucre ajouté aujourd'hui — repère-le sur les étiquettes." },
      { jour: "Jour 17", focus: "Mouvement", contenu: "3 tours : 10 squats, 10 pompes, 10 secondes de gainage." },
      { jour: "Jour 18", focus: "Repos", contenu: "Jour de repos. Marche légère si tu en as envie, rien d'obligatoire." },
      { jour: "Jour 19", focus: "Récupération", contenu: "Coupe les écrans 30 minutes avant de dormir ce soir." },
      { jour: "Jour 20", focus: "Mouvement", contenu: "25 minutes d'activité de ton choix, à intensité modérée à soutenue." },
      { jour: "Jour 21", focus: "Mental", contenu: "Envoie un message à quelqu'un pour prendre de ses nouvelles." },
      { jour: "Jour 22", focus: "Nutrition", contenu: "Mange lentement, sans écran, au moins un repas aujourd'hui." },
      { jour: "Jour 23", focus: "Mouvement", contenu: "40 fentes ou 40 squats, en plusieurs séries dans la journée." },
      { jour: "Jour 24", focus: "Récupération", contenu: "15 minutes de mobilité complète (hanches, épaules, colonne)." },
      { jour: "Jour 25", focus: "Mouvement", contenu: "Gainage planche, cumule 3 minutes dans la journée." },
      { jour: "Jour 26", focus: "Repos", contenu: "Jour de repos. Prends le temps de faire un bilan de ta semaine." },
      { jour: "Jour 27", focus: "Nutrition", contenu: "Bois suffisamment d'eau toute la journée — objectif 1,5 à 2L." },
      { jour: "Jour 28", focus: "Mouvement", contenu: "30 minutes d'activité au choix, celle que tu préfères." },
      { jour: "Jour 29", focus: "Mental", contenu: "Note ce que ce mois t'a appris sur toi-même." },
      {
        jour: "Jour 30",
        focus: "Mouvement & mental",
        contenu: "Séance complète de ton choix, puis relis ton objectif du jour 1 : où en es-tu ?",
      },
    ],
  },
];
