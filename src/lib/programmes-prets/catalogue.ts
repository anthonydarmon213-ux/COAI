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
  | "BUREAU"
  | "CHALLENGE_30_JOURS"
  | "RECUPERATION";

export const CATEGORIE_PROGRAMME_LABEL: Record<CategorieProgrammePret, string> = {
  MOBILITE: "Mobilité",
  CARDIO_SEMI_MARATHON: "Semi-marathon",
  CARDIO_HYROX: "Hyrox",
  PERTE_DE_POIDS: "Perte de poids",
  POIDS_DU_CORPS: "Poids du corps",
  FESSIERS: "Fessiers",
  BUREAU: "Bureau & chaise",
  CHALLENGE_30_JOURS: "Challenge 30 jours",
  RECUPERATION: "Récupération",
};

export type JourProgrammePret = {
  jour: string;
  focus: string;
  contenu: string;
};

export type VisuelProgrammePret = {
  nom: string;
  photoFemme: string;
  photoHomme: string;
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
  photoFemme?: string;
  photoHomme?: string;
  visuels?: VisuelProgrammePret[];
  jours: JourProgrammePret[];
};

export const PROGRAMMES_PRETS: ProgrammePret[] = [
  {
    slug: "special-bureau-chaise",
    nom: "Spécial bureau — Bouger sans quitter sa chaise",
    categorie: "BUREAU",
    niveau: "Tous niveaux",
    duree: "4 semaines",
    frequence: "5 micro-séances / semaine, 8-12 min",
    accroche: "Déverrouille ton corps entre deux réunions, sans matériel et sans transpirer.",
    description:
      "Pensé pour les dirigeants, indépendants et salariés qui passent l'essentiel de leur journée assis. Toutes les séances se font sur une chaise stable : mobilité, activation musculaire, posture, circulation et respiration. Le but n'est pas de remplacer l'entraînement principal, mais de casser les longues périodes d'inactivité avec une routine réellement tenable.",
    objectifs: [
      "Réduire les raideurs liées à la position assise prolongée",
      "Réactiver jambes, fessiers, dos et sangle abdominale sans se changer",
      "Améliorer la mobilité thoracique et le confort des épaules",
      "Installer cinq pauses actives faciles à tenir chaque semaine",
    ],
    photoQuery: "office worker seated chair mobility exercise",
    photoFemme: "/programmes/bureau-femme-blonde-premium.jpg",
    photoHomme: "/programmes/bureau-homme-blond-premium.jpg",
    visuels: [
      {
        nom: "Rotation thoracique assise",
        photoFemme: "/programmes/bureau-femme-blonde-premium.jpg",
        photoHomme: "/programmes/bureau-homme-blond-premium.jpg",
      },
      {
        nom: "Extension de genou assise",
        photoFemme: "/programmes/bureau/femme-extension-genou.jpg",
        photoHomme: "/programmes/bureau/homme-extension-genou.jpg",
      },
      {
        nom: "Étirement fessier assis",
        photoFemme: "/programmes/bureau/femme-etirement-fessier.jpg",
        photoHomme: "/programmes/bureau/homme-etirement-fessier.jpg",
      },
      {
        nom: "Ouverture de poitrine assise",
        photoFemme: "/programmes/bureau/femme-ouverture-poitrine.jpg",
        photoHomme: "/programmes/bureau/homme-ouverture-poitrine.jpg",
      },
      {
        nom: "Marche assise & gainage",
        photoFemme: "/programmes/bureau/femme-marche-assise.jpg",
        photoHomme: "/programmes/bureau/homme-marche-assise.jpg",
      },
      {
        nom: "Mollets assis",
        photoFemme: "/programmes/bureau/femme-mollets-assis.jpg",
        photoHomme: "/programmes/bureau/homme-mollets-assis.jpg",
      },
    ],
    jours: [
      {
        jour: "Jour 1",
        focus: "Nuque, épaules & haut du dos",
        contenu:
          "Assis au bord d'une chaise stable : 8 rentrées de menton lentes, 12 rétractions d'omoplates, 8 rotations thoraciques par côté, puis 5 respirations profondes avec une expiration longue. Deux tours, sans forcer l'amplitude.",
      },
      {
        jour: "Jour 2",
        focus: "Jambes & circulation",
        contenu:
          "3 tours : 12 extensions de genou par jambe, 20 montées de mollets assis, 30 secondes de marche assise genoux alternés, puis 20 secondes de contraction volontaire des fessiers. Repos 30 secondes entre les tours.",
      },
      {
        jour: "Jour 3",
        focus: "Hanches & mobilité",
        contenu:
          "Cheville posée sur le genou opposé : étirement fessier 30 secondes par côté. Enchaîne 10 ouvertures de genou par côté, 8 bascules contrôlées du bassin et 8 inclinaisons du buste vers l'avant, dos long. Deux tours.",
      },
      {
        jour: "Jour 4",
        focus: "Posture & sangle abdominale",
        contenu:
          "Assis grandis-toi : 5 fois 10 secondes de gainage en pressant les mains contre les cuisses, 10 levées de genou alternées sans t'affaisser, 12 tirages de coudes imaginaires vers l'arrière et 30 secondes de maintien postural. Deux tours.",
      },
      {
        jour: "Jour 5",
        focus: "Reset complet",
        contenu:
          "Circuit calme : 8 rotations thoraciques par côté, 12 extensions de genou, 20 mollets assis, 30 secondes de marche assise, 30 secondes d'étirement fessier par côté, puis 2 minutes de respiration 4 secondes à l'inspiration et 6 secondes à l'expiration.",
      },
    ],
  },
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
  {
    slug: "sommeil-reparateur",
    nom: "Sommeil réparateur — 14 jours",
    categorie: "RECUPERATION",
    niveau: "Tous niveaux",
    duree: "14 jours",
    frequence: "Une habitude par jour, à garder ensuite",
    accroche: "Un vrai sommeil de récupération ne s'improvise pas, il se construit jour après jour.",
    description:
      "14 jours pour installer, une habitude à la fois, les repères qui font le plus de différence sur la qualité du sommeil — horaires, lumière, écrans, caféine, température de la chambre. Chaque jour ajoute une habitude à la précédente, sans jamais tout changer d'un coup.",
    objectifs: [
      "Stabiliser un horaire de coucher et de lever régulier",
      "Réduire les perturbateurs du sommeil (écrans, caféine tardive, lumière)",
      "Créer un vrai rituel de fin de journée",
      "Améliorer la qualité perçue du sommeil, pas seulement sa durée",
    ],
    photoQuery: "peaceful bedroom night sleep",
    jours: [
      { jour: "Jour 1", focus: "Horaire fixe", contenu: "Choisis une heure de coucher et de lever réaliste, et tiens-la ce soir — même le week-end." },
      { jour: "Jour 2", focus: "Caféine", contenu: "Plus aucune caféine après 14h aujourd'hui (café, thé noir, certains sodas)." },
      { jour: "Jour 3", focus: "Écrans", contenu: "Coupe les écrans 30 minutes avant de te coucher — lis, étire-toi ou respire à la place." },
      { jour: "Jour 4", focus: "Lumière", contenu: "Baisse les lumières de la maison 1h avant le coucher, dès ce soir." },
      { jour: "Jour 5", focus: "Température", contenu: "Vise une chambre fraîche (autour de 18°C) — aère 10 minutes avant de dormir." },
      { jour: "Jour 6", focus: "Rituel", contenu: "Fixe un rituel court de 10 minutes avant de dormir (étirements légers, lecture, respiration) et répète-le chaque soir dès aujourd'hui." },
      { jour: "Jour 7", focus: "Bilan", contenu: "Relis les 6 habitudes posées cette semaine — laquelle est la plus dure à tenir ? Concentre-toi dessus la semaine prochaine." },
      { jour: "Jour 8", focus: "Activité physique", contenu: "Termine tout effort intense au moins 3h avant le coucher aujourd'hui." },
      { jour: "Jour 9", focus: "Repas du soir", contenu: "Dîne au moins 2-3h avant de te coucher, repas léger plutôt que copieux." },
      { jour: "Jour 10", focus: "Alcool", contenu: "L'alcool aide à s'endormir mais dégrade le sommeil profond — réduis ou évite-le ce soir." },
      { jour: "Jour 11", focus: "Réveil", contenu: "Dès le réveil, expose-toi à la lumière du jour quelques minutes — ça aide à régler l'horloge interne pour la nuit suivante." },
      { jour: "Jour 12", focus: "Sieste", contenu: "Si tu fais une sieste, limite-la à 20 minutes et avant 15h — au-delà, elle perturbe la nuit." },
      { jour: "Jour 13", focus: "Anxiété du soir", contenu: "Note sur un papier ce qui te trotte dans la tête avant de dormir — sortir les pensées de la tête aide à lâcher prise." },
      { jour: "Jour 14", focus: "Bilan final", contenu: "Regarde le chemin parcouru : quelles habitudes gardes-tu au-delà de ces 14 jours ? Choisis-en 3 à conserver durablement." },
    ],
  },
  {
    slug: "respiration-anti-stress",
    nom: "Respiration & anti-stress",
    categorie: "RECUPERATION",
    niveau: "Tous niveaux",
    duree: "4 techniques",
    frequence: "5 minutes, quand tu en as besoin",
    accroche: "4 techniques de respiration simples pour calmer le système nerveux en quelques minutes.",
    description:
      "Des techniques de respiration courtes et concrètes, à utiliser avant de dormir, pendant une journée stressante, ou en récupération après une séance intense. Pas besoin de matériel ni d'expérience — juste 5 minutes et un endroit calme.",
    objectifs: [
      "Calmer le système nerveux en quelques minutes",
      "Améliorer l'endormissement",
      "Récupérer plus vite après un effort intense",
      "Avoir un outil simple à utiliser n'importe où",
    ],
    photoQuery: "calm breathing exercise relaxation",
    jours: [
      {
        jour: "Technique 1",
        focus: "Respiration diaphragmatique",
        contenu:
          "Allongé·e ou assis·e, une main sur le ventre : inspire lentement par le nez en gonflant le ventre (pas la poitrine), expire lentement par la bouche. 10 respirations, à ton rythme.",
      },
      {
        jour: "Technique 2",
        focus: "Cohérence cardiaque (5-5)",
        contenu: "Inspire 5 secondes, expire 5 secondes, sans pause entre les deux. Répète pendant 5 minutes — idéal avant une réunion stressante ou en fin de journée.",
      },
      {
        jour: "Technique 3",
        focus: "4-7-8, pour l'endormissement",
        contenu: "Inspire 4 secondes, retiens 7 secondes, expire lentement sur 8 secondes. Répète 4 cycles, allongé·e, juste avant de dormir.",
      },
      {
        jour: "Technique 4",
        focus: "Box breathing, pour se recentrer",
        contenu: "Inspire 4 secondes, retiens 4 secondes, expire 4 secondes, retiens poumons vides 4 secondes. Répète 4 à 6 cycles — utile pour se recentrer avant ou après une séance intense.",
      },
    ],
  },
  {
    slug: "meditation-guidee",
    nom: "Méditation guidée — 7 jours",
    categorie: "RECUPERATION",
    niveau: "Tous niveaux",
    duree: "7 jours",
    frequence: "5 à 10 minutes par jour",
    accroche: "Une courte pratique par jour pour découvrir la méditation sans pression de performance.",
    description:
      "7 courtes séances pour découvrir la méditation en douceur, sans application ni matériel — juste toi, un endroit calme et quelques minutes. Chaque jour propose un focus différent : ce n'est pas grave si l'esprit vagabonde, c'est normal, le but est de recommencer, pas d'y arriver parfaitement.",
    objectifs: [
      "Découvrir la méditation sans pression de performance",
      "Réduire le stress accumulé dans la journée",
      "Améliorer la capacité à se recentrer",
      "Installer une pause mentale régulière dans la semaine",
    ],
    photoQuery: "person meditating calm peaceful",
    jours: [
      { jour: "Jour 1", focus: "La respiration", contenu: "5 minutes assis·e, les yeux fermés, à simplement observer ta respiration sans essayer de la changer." },
      { jour: "Jour 2", focus: "Le corps", contenu: "5 minutes de scan corporel : parcours mentalement ton corps des pieds à la tête, en relâchant chaque zone tendue." },
      { jour: "Jour 3", focus: "Les sons", contenu: "5 minutes à simplement écouter les sons autour de toi, sans les juger ni les analyser — juste les remarquer." },
      { jour: "Jour 4", focus: "La gratitude", contenu: "5 minutes assis·e, pense à 3 choses pour lesquelles tu es reconnaissant·e aujourd'hui, en t'attardant sur chacune." },
      { jour: "Jour 5", focus: "Lâcher-prise", contenu: "7 minutes : à chaque pensée qui arrive, imagine-la comme un nuage qui passe, sans t'y accrocher, puis reviens à ta respiration." },
      { jour: "Jour 6", focus: "La marche méditative", contenu: "10 minutes de marche lente et silencieuse, en portant toute ton attention sur chaque pas et chaque sensation." },
      { jour: "Jour 7", focus: "Bilan", contenu: "10 minutes assis·e en silence, puis note en une phrase ce que cette semaine t'a appris sur ton rapport au calme." },
    ],
  },
  {
    slug: "recuperation-passive-sauna-hammam-massage",
    nom: "Récupération passive — Sauna, hammam & massage",
    categorie: "RECUPERATION",
    niveau: "Tous niveaux",
    duree: "4 protocoles",
    frequence: "1 à 2 fois par semaine",
    accroche: "Le bon protocole, avec les bonnes précautions — pas juste \"aller transpirer\".",
    description:
      "Sauna, hammam et massage sont d'excellents outils de récupération quand ils sont utilisés avec un vrai protocole — durée, cycles, hydratation. Utilisés n'importe comment, ils fatiguent plus qu'ils ne récupèrent. Toujours en dehors de toute contre-indication médicale (grossesse, problème cardiovasculaire, hypertension non contrôlée) — demande un avis médical en cas de doute.",
    objectifs: [
      "Utiliser le sauna et le hammam avec un vrai protocole, pas au hasard",
      "Accélérer la récupération musculaire après un effort intense",
      "Réduire les tensions accumulées dans la semaine",
      "Éviter les erreurs qui transforment la récupération en fatigue supplémentaire",
    ],
    photoQuery: "sauna wellness relaxation spa",
    jours: [
      {
        jour: "Protocole 1",
        focus: "Sauna (chaleur sèche)",
        contenu:
          "3 cycles de 8 à 12 minutes dans le sauna (70-90°C), séparés de 5 à 10 minutes de repos à température ambiante en buvant de l'eau. Jamais juste après un effort très intense — attends que le rythme cardiaque soit redescendu. Hydrate-toi avant, pendant et après (eau, éventuellement une pincée de sel).",
      },
      {
        jour: "Protocole 2",
        focus: "Hammam (chaleur humide)",
        contenu:
          "2 à 3 passages de 10 à 15 minutes (40-50°C, forte humidité), avec une pause fraîche entre chaque. Plus doux que le sauna sur le système cardiovasculaire mais tout aussi déshydratant — bois régulièrement. Termine par une douche fraîche pour resserrer la circulation.",
      },
      {
        jour: "Protocole 3",
        focus: "Auto-massage",
        contenu:
          "10 à 15 minutes avec un rouleau de massage (foam roller) ou une balle de tennis sur les zones les plus sollicitées (mollets, quadriceps, dos) — pression progressive, jamais sur une articulation directement, jamais sur une douleur aiguë ou une zone inflammée.",
      },
      {
        jour: "Protocole 4",
        focus: "Massage professionnel",
        contenu:
          "Un massage sportif (30 à 60 min) une à deux fois par mois en période d'entraînement intense soulage les tensions profondes qu'un auto-massage n'atteint pas — à réserver plutôt en fin de cycle ou avant une semaine de récupération plutôt que juste avant une séance clé.",
      },
    ],
  },
];
