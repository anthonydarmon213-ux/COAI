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

import { PROGRAMMES_RENTREE } from "./catalogue-rentree";
import { ENRICHISSEMENTS_PROGRAMMES } from "./enrichissements";

export type CategorieProgrammePret =
  | "MOBILITE"
  | "CARDIO_SEMI_MARATHON"
  | "CARDIO_HYROX"
  | "FITNESS_HYBRIDE"
  | "PERTE_DE_POIDS"
  | "REMISE_EN_FORME"
  | "TRX"
  | "PRISE_DE_MASSE"
  | "POIDS_DU_CORPS"
  | "FESSIERS"
  | "STRETCH"
  | "ABDOS"
  | "BUREAU"
  | "CHALLENGE_30_JOURS"
  | "RECUPERATION";

export const CATEGORIE_PROGRAMME_LABEL: Record<CategorieProgrammePret, string> = {
  MOBILITE: "Mobilité",
  CARDIO_SEMI_MARATHON: "Semi-marathon",
  CARDIO_HYROX: "Hyrox",
  FITNESS_HYBRIDE: "Fitness hybride",
  PERTE_DE_POIDS: "Perte de poids",
  REMISE_EN_FORME: "Remise en forme",
  TRX: "TRX",
  PRISE_DE_MASSE: "Prise de masse",
  POIDS_DU_CORPS: "Poids du corps",
  FESSIERS: "Fessiers",
  STRETCH: "Stretch",
  ABDOS: "Abdos & Core",
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
  photoFemme?: string;
  photoHomme?: string;
};

export type PhaseProgrammePret = {
  periode: string;
  titre: string;
  contenu: string;
};

export type ConseilProgrammePret = {
  titre: string;
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
  photoFemme?: string;
  photoHomme?: string;
  visuels?: VisuelProgrammePret[];
  badge?: string;
  medias?: string[];
  progression?: PhaseProgrammePret[];
  nutrition?: ConseilProgrammePret[];
  recuperation?: ConseilProgrammePret[];
  note?: string;
  jours: JourProgrammePret[];
};

const PROGRAMMES_DE_BASE: ProgrammePret[] = [
  {
    slug: "coai-reset-rentree",
    nom: "COAI RESET — Reprise complète",
    categorie: "REMISE_EN_FORME",
    niveau: "Débutant à intermédiaire",
    duree: "6 semaines",
    frequence: "3 séances / semaine, 35-45 min",
    badge: "Brouillon · À valider",
    accroche: "Six semaines pour retrouver du souffle, de la force et une routine qui tient.",
    description:
      "Un redémarrage progressif après une période moins active. Trois séances full body, une marche active optionnelle et une charge qui monte seulement quand la technique reste propre. Le pack associe entraînement, repères alimentaires simples et récupération guidée.",
    objectifs: [
      "Reprendre sans courbatures excessives ni séance punitive",
      "Reconstruire les mouvements fondamentaux et le cardio de base",
      "Passer de l'assiduité à une progression mesurable",
      "Installer des repas et un sommeil compatibles avec la reprise",
    ],
    photoQuery: "beginner full body fitness restart premium gym",
    photoFemme: "/programmes/v2/presse-cuisses-femme-v2.png",
    photoHomme: "/exercices/kettlebell-goblet-squat.jpg",
    medias: [
      "Goblet squat",
      "Pompes inclinées",
      "Rowing haltères",
      "Rowing haltère unilatéral",
      "Fentes arrière haltères",
      "Développé épaules haltères",
      "Gainage planche",
    ],
    progression: [
      { periode: "Semaine 1", titre: "Reconnexion", contenu: "2 séries par exercice, effort perçu 5/10, priorité à l'amplitude confortable et à la respiration." },
      { periode: "Semaine 2", titre: "Régularité", contenu: "Même structure, ajoute 1 à 2 répétitions par série sans dégrader la technique." },
      { periode: "Semaine 3", titre: "Volume", contenu: "Passe à 3 séries sur les quatre mouvements principaux et garde deux répétitions en réserve." },
      { periode: "Semaine 4", titre: "Endurance", contenu: "Réduis légèrement les repos et ajoute 8 minutes de cardio facile après deux séances." },
      { periode: "Semaine 5", titre: "Progression", contenu: "Augmente légèrement la charge ou choisis une variante plus difficile sur deux mouvements." },
      { periode: "Semaine 6", titre: "Consolidation", contenu: "Stabilise les charges, compare tes répétitions à la semaine 1 et prépare le cycle suivant." },
    ],
    nutrition: [
      { titre: "Assiette RESET", contenu: "1 paume de protéines, 1 poing de féculents, 2 poings de légumes et 1 pouce de bonnes graisses." },
      { titre: "Rythme", contenu: "Trois repas structurés, une collation seulement si la faim est réelle. Eau : environ 30 à 35 ml/kg/jour." },
      { titre: "Recettes recommandées", contenu: "Porridge fruits rouges, poulet-riz-haricots, saumon-quinoa-brocolis et omelette épinards." },
    ],
    recuperation: [
      { titre: "Après séance", contenu: "5 minutes de marche lente puis respiration 4 secondes inspire / 6 secondes expire pendant 2 minutes." },
      { titre: "Mobilité", contenu: "Deux fois par semaine : hanches 90/90, rotation thoracique et mobilité de cheville, 8 minutes au total." },
      { titre: "Sommeil", contenu: "Horaire de lever régulier et écrans coupés 30 minutes avant le coucher au minimum." },
    ],
    jours: [
      { jour: "Séance A", focus: "Fondations", contenu: "Goblet squat 3×8-12, pompes inclinées 3×6-12, rowing haltères 3×10-12, gainage planche 3×20-40 s." },
      { jour: "Séance B", focus: "Chaîne postérieure", contenu: "Deadlift roumain haltères 3×8-12, fentes arrière 3×8/jambe, développé épaules haltères 3×8-12, dead bug 3×8/côté." },
      { jour: "Séance C", focus: "Circuit contrôlé", contenu: "4 tours : 10 goblet squats, 8 pompes inclinées, 10 rowings, 20 s de gainage. Repos 75 s entre les tours." },
      { jour: "Option", focus: "Marche active", contenu: "25 à 40 minutes à allure conversationnelle, idéalement en extérieur." },
    ],
  },
  {
    slug: "coai-lean-rentree",
    nom: "COAI LEAN — Perte de gras",
    categorie: "PERTE_DE_POIDS",
    niveau: "Débutant à intermédiaire",
    duree: "8 semaines",
    frequence: "4 séances / semaine, 40-55 min",
    badge: "Brouillon · À valider",
    accroche: "Perdre du gras avec un déficit raisonnable, des charges maintenues et zéro méthode extrême.",
    description:
      "Trois séances de renforcement et une séance cardio en zone 2 pour soutenir la dépense sans sacrifier le muscle. Le plan alimentaire propose des portions ajustables, des recettes rassasiantes et un suivi fondé sur la tendance, pas sur une pesée isolée.",
    objectifs: ["Réduire progressivement la masse grasse", "Préserver force et masse musculaire", "Limiter la faim avec des repas riches en protéines et fibres", "Maintenir une récupération compatible avec le déficit"],
    photoQuery: "fat loss strength training premium gym",
    photoFemme: "/programmes/v2/leg-curl-femme-v2.png",
    photoHomme: "/programmes/v2/rowing-machine-homme-v2.png",
    medias: [
      "Back squat",
      "Développé couché haltères",
      "Rowing haltères",
      "Fentes arrière haltères",
      "Développé épaules haltères",
      "Goblet squat",
      "Pompes",
      "Kettlebell swing",
      "Curl biceps haltères",
      "Gainage planche",
    ],
    progression: [
      { periode: "Semaines 1-2", titre: "Base", contenu: "Trouve tes charges de travail, 3 séries par mouvement, 2 à 3 répétitions en réserve." },
      { periode: "Semaines 3-4", titre: "Surcharge", contenu: "Ajoute des répétitions dans la fourchette prévue, puis 2 à 5 % de charge quand le haut de fourchette est atteint." },
      { periode: "Semaine 5", titre: "Allègement", contenu: "Réduis le volume d'environ 30 %, garde la marche et le cardio faciles." },
      { periode: "Semaines 6-7", titre: "Densité", contenu: "Reviens aux charges de semaine 4 et raccourcis les repos uniquement sur les exercices d'assistance." },
      { periode: "Semaine 8", titre: "Bilan", contenu: "Maintiens l'intensité, réduis légèrement le volume et compare mensurations, photos et performances." },
    ],
    nutrition: [
      { titre: "Déficit modéré", contenu: "Point de départ : environ 10 à 15 % sous l'entretien. Ajuste seulement après deux semaines de tendance stable." },
      { titre: "Protéines", contenu: "Vise environ 1,6 à 2,2 g/kg/jour si cela convient à ta situation, répartis sur 3 à 4 prises." },
      { titre: "Recettes recommandées", contenu: "Cabillaud-lentilles-carottes, thon-patate douce-asperges, tofu-sarrasin-légumes et collation yaourt grec-myrtilles." },
    ],
    recuperation: [
      { titre: "Sommeil", contenu: "Vise 7 à 9 heures et ne compense pas une mauvaise nuit par davantage de cardio intense." },
      { titre: "Pas quotidiens", contenu: "Choisis un objectif réaliste et stable ; augmente par paliers de 1 000 pas, pas d'un seul coup." },
      { titre: "Signal d'alerte", contenu: "Si énergie, sommeil et performance baissent plusieurs jours, remonte légèrement les apports et allège une séance." },
    ],
    jours: [
      { jour: "Jour 1", focus: "Bas du corps", contenu: "Back squat 4×6-10, deadlift roumain haltères 3×8-12, fentes arrière 3×10/jambe, gainage 3 séries." },
      { jour: "Jour 2", focus: "Haut du corps", contenu: "Développé couché haltères 4×6-10, rowing haltères 4×8-12, développé épaules 3×8-12, bras 2×12-15." },
      { jour: "Jour 3", focus: "Full body", contenu: "Goblet squat, pompes, rowing et kettlebell swing : 4 blocs maîtrisés, sans aller à l'échec." },
      { jour: "Jour 4", focus: "Zone 2", contenu: "35 à 50 minutes à allure conversationnelle, suivies de 8 minutes de mobilité." },
    ],
  },
  {
    slug: "coai-hybrid-engine-rentree",
    nom: "COAI HYBRID ENGINE — Force & endurance",
    categorie: "FITNESS_HYBRIDE",
    niveau: "Intermédiaire à avancé",
    duree: "12 semaines",
    frequence: "5 séances / semaine, 45-70 min",
    badge: "Brouillon · À valider",
    accroche: "Construis le moteur, la force fonctionnelle et les transitions d'une course hybride.",
    description:
      "Un cycle complet mêlant course, force et ateliers fonctionnels. La progression va d'une base aérobie solide vers des simulations spécifiques, avec une semaine allégée avant le test final. Compatible avec les formats de course hybride, sans affiliation à une marque ou compétition.",
    objectifs: ["Courir efficacement sous fatigue musculaire", "Progresser sur poussée, tirage, portés et wall balls", "Maîtriser les transitions et l'allure", "Arriver frais sur la semaine de test"],
    photoQuery: "hybrid fitness race sled push wall ball",
    photoFemme: "/exercices/hyrox-wall-ball.jpg",
    photoHomme: "/programmes/v2/hyrox-sled-homme-v2.png",
    medias: [
      "Front squat",
      "Soulevé de terre conventionnel",
      "Fentes arrière barre",
      "Développé militaire barre",
      "Traction pronation",
      "Poussée de traîneau",
      "Tirage de traîneau à la corde",
      "Burpee broad jump",
      "Burpee",
      "Marche du fermier kettlebells",
      "Kettlebell swing",
      "Mountain climber",
      "Box jump",
      "Thruster haltères",
      "Soulevé de terre trap bar",
      "Overhead squat",
      "Power clean",
      "Devil press",
      "Windmill haltère",
      "Ballon lesté par-dessus l’épaule",
      "Cordes ondulatoires alternées",
      "Cordes ondulatoires doubles",
      "Sauts latéraux step",
    ],
    progression: [
      { periode: "Semaines 1-3", titre: "Base aérobie & technique", contenu: "Deux courses faciles, deux séances de force et un circuit technique sans recherche de chrono." },
      { periode: "Semaine 4", titre: "Allègement", contenu: "Volume réduit de 25 à 35 %, mobilité et technique prioritaires." },
      { periode: "Semaines 5-7", titre: "Seuil & force", contenu: "Intervalles plus longs, charges progressives et premiers enchaînements course-atelier." },
      { periode: "Semaine 8", titre: "Allègement", contenu: "Garde l'intensité sur quelques répétitions, diminue nettement le nombre de séries." },
      { periode: "Semaines 9-10", titre: "Spécifique", contenu: "Une simulation partielle par semaine, transitions chronométrées et allure cible contrôlée." },
      { periode: "Semaine 11", titre: "Simulation", contenu: "Répétition générale à 80-90 % du volume prévu, sans sprint final." },
      { periode: "Semaine 12", titre: "Affûtage & test", contenu: "Volume divisé par deux, sommeil prioritaire, test en fin de semaine." },
    ],
    nutrition: [
      { titre: "Jours intenses", contenu: "Place davantage de glucides avant et après les intervalles, simulations et séances jambes." },
      { titre: "Hydratation", contenu: "Teste à l'entraînement l'eau, le sodium et les glucides que tu utiliseras le jour du test." },
      { titre: "Recettes recommandées", contenu: "Poulet-riz-haricots, saumon-quinoa-brocolis, dinde-grenailles-épinards et avoine-fruits rouges." },
    ],
    recuperation: [
      { titre: "48 heures", contenu: "Évite de coller la séance jambes lourde et la simulation. Garde au moins 48 h entre les deux." },
      { titre: "Retour au calme", contenu: "8 minutes : marche, mobilité cheville, psoas et respiration diaphragmatique." },
      { titre: "Semaine allégée", contenu: "Elle fait partie du plan : ne remplace pas les séries retirées par du cardio supplémentaire." },
    ],
    jours: [
      { jour: "Jour 1", focus: "Course facile + éducatifs", contenu: "40 à 60 min en aisance respiratoire, puis 6 accélérations de 15 secondes." },
      { jour: "Jour 2", focus: "Force jambes", contenu: "Front squat, deadlift et fentes : 3 à 5 séries, puis poussée de traîneau technique." },
      { jour: "Jour 3", focus: "Intervalles", contenu: "6 à 10 répétitions de 2 à 4 min soutenues, récupération active égale à la moitié du temps d'effort." },
      { jour: "Jour 4", focus: "Force haut + portés", contenu: "Développé, tirage, marche du fermier et gainage anti-rotation." },
      { jour: "Jour 5", focus: "Brick hybride", contenu: "4 à 8 blocs : course courte puis un atelier. Intensité progressive au fil du cycle." },
    ],
    note: "COAI HYBRID ENGINE est un programme indépendant. HYROX est une marque tierce et n'est pas partenaire de COAI.",
  },
  {
    slug: "coai-trx-sculpt-rentree",
    nom: "COAI TRX SCULPT — Suspension training",
    categorie: "TRX",
    niveau: "Tous niveaux",
    duree: "8 semaines",
    frequence: "3 séances / semaine, 35-50 min",
    badge: "Brouillon · À valider",
    accroche: "Un programme complet avec sangles, progressif par l'angle, le tempo et la stabilité.",
    description:
      "Trois séances hebdomadaires pour renforcer tout le corps avec les sangles. Chaque mouvement possède une démonstration réelle issue de la bibliothèque COAI. La difficulté se règle en déplaçant les pieds et en conservant une ligne corporelle solide.",
    objectifs: ["Renforcer le corps entier avec un matériel minimal", "Améliorer gainage, stabilité et contrôle", "Progresser sans multiplier les exercices", "Pouvoir s'entraîner à domicile ou en déplacement"],
    photoQuery: "trx suspension training premium studio",
    photoFemme: "/programmes/v2/trx-planche-femme-v2.png",
    photoHomme: "/exercices/trx-rowing-homme-premium-v2.png",
    medias: ["Rowing TRX", "Pompes TRX", "Planche dynamique TRX", "Pistol squat assisté TRX", "Fente arrière TRX", "Montée de genou TRX"],
    progression: [
      { periode: "Semaines 1-2", titre: "Positions", contenu: "Angle facile, 2 à 3 séries, tempo contrôlé et verrouillage du tronc." },
      { periode: "Semaines 3-4", titre: "Volume", contenu: "Ajoute une série aux mouvements principaux ou 2 répétitions par série." },
      { periode: "Semaines 5-6", titre: "Tempo", contenu: "Descente en 3 secondes, pause d'une seconde sur les positions les plus stables." },
      { periode: "Semaine 7", titre: "Densité", contenu: "Même volume avec des repos réduits de 15 secondes, sans perdre l'alignement." },
      { periode: "Semaine 8", titre: "Maîtrise", contenu: "Teste un angle légèrement plus exigeant et compare la qualité d'exécution à la semaine 1." },
    ],
    nutrition: [
      { titre: "Base", contenu: "Une source de protéines et des légumes à chaque repas principal ; portions de féculents adaptées à la faim et au niveau d'activité." },
      { titre: "Autour de la séance", contenu: "Si besoin, fruit et yaourt avant ou après. Aucun complément n'est obligatoire." },
      { titre: "Recettes recommandées", contenu: "Omelette épinards, poulet-boulgour-courgettes, tofu-sarrasin-légumes et fromage blanc-miel." },
    ],
    recuperation: [
      { titre: "Épaules", contenu: "Après séance : 6 rotations thoraciques par côté et 8 passages de bras sans douleur." },
      { titre: "Avant-bras", contenu: "Relâche les sangles entre les séries ; étirements doux des poignets 30 secondes par côté." },
      { titre: "Règle technique", contenu: "Une douleur articulaire n'est pas un signe d'efficacité : redresse l'angle ou arrête le mouvement." },
    ],
    jours: [
      { jour: "Séance A", focus: "Tirage & jambes", contenu: "Rowing TRX 4×8-15, fente arrière TRX 3×10/jambe, pistol squat assisté 3×6-10/jambe, gainage 3 séries." },
      { jour: "Séance B", focus: "Poussée & tronc", contenu: "Pompes TRX 4×6-12, planche dynamique TRX 3×8-12, montée de genou TRX 4×20-30 s." },
      { jour: "Séance C", focus: "Full body", contenu: "5 tours : rowing, pompes, fentes arrière, montée de genou. 40 s de travail / 20 s de transition." },
    ],
  },
  {
    slug: "coai-mass-rentree",
    nom: "COAI MASS — Prise de masse maîtrisée",
    categorie: "PRISE_DE_MASSE",
    niveau: "Intermédiaire",
    duree: "12 semaines",
    frequence: "4 séances / semaine, 55-75 min",
    badge: "Brouillon · À valider",
    accroche: "Du muscle avec une surcharge progressive, un surplus mesuré et une récupération suivie.",
    description:
      "Un split haut/bas quatre jours, construit autour des mouvements de base et d'un volume progressif. Le guide alimentaire aide à créer un surplus léger avec des repas denses mais digestes, sans transformer la prise de masse en prise de gras incontrôlée.",
    objectifs: ["Augmenter le volume d'entraînement de façon tolérable", "Progresser en répétitions puis en charge", "Créer un surplus calorique modéré", "Mesurer poids, mensurations et performances sans obsession"],
    photoQuery: "muscle gain strength training premium gym",
    photoFemme: "/exercices/developpe-couche-barre-femme-blonde-v2.jpg",
    photoHomme: "/programmes/v2/developpe-incline-machine-homme-v2.png",
    medias: [
      "Back squat",
      "Front squat",
      "Développé couché haltères",
      "Rowing haltères",
      "Développé militaire barre",
      "Développé épaules haltères",
      "Traction pronation",
      "Élévations latérales",
      "Élévations frontales",
      "Oiseau haltères",
      "Rowing menton",
      "Curl biceps haltères",
      "Extension triceps couché",
      "Écarté haltères",
      "Pullover haltères",
      "Chin-up",
      "Rowing barre buste penché",
      "Fentes arrière barre",
      "Step up",
      "Gainage planche",
    ],
    progression: [
      { periode: "Semaines 1-3", titre: "Accumulation 1", contenu: "3 séries par mouvement, fourchettes de 6-12 répétitions et 2 répétitions en réserve." },
      { periode: "Semaine 4", titre: "Allègement", contenu: "Réduis les séries d'environ un tiers, conserve une exécution dynamique." },
      { periode: "Semaines 5-7", titre: "Accumulation 2", contenu: "Ajoute une série sur les groupes prioritaires et progresse en double progression." },
      { periode: "Semaine 8", titre: "Allègement", contenu: "Même principe que semaine 4, sommeil et appétit surveillés." },
      { periode: "Semaines 9-11", titre: "Intensification", contenu: "Légère hausse des charges sur les mouvements de base, volume d'isolation maintenu." },
      { periode: "Semaine 12", titre: "Bilan", contenu: "Volume réduit, séries repères sans échec et comparaison des performances du cycle." },
    ],
    nutrition: [
      { titre: "Surplus", contenu: "Commence autour de +150 à +300 kcal/jour. Ajuste selon la tendance du poids sur deux à trois semaines." },
      { titre: "Construction", contenu: "Protéines réparties sur la journée, glucides autour de l'entraînement, lipides suffisants et fruits/légumes quotidiens." },
      { titre: "Recettes recommandées", contenu: "Bœuf-patate douce-salade, poulet-riz-haricots, saumon-quinoa-brocolis et petit-déjeuner œufs-avocat." },
    ],
    recuperation: [
      { titre: "Repos", contenu: "Garde au moins un jour sans musculation après deux jours consécutifs d'entraînement." },
      { titre: "Auto-régulation", contenu: "Si deux séances de suite régressent, retire une série par exercice pendant une semaine." },
      { titre: "Sommeil", contenu: "La progression dépend aussi de 7 à 9 heures de sommeil et d'un horaire régulier." },
    ],
    jours: [
      { jour: "Jour 1", focus: "Haut A", contenu: "Développé couché 4×6-10, rowing haltères 4×8-12, développé épaules 3×8-12, tirage vertical 3×8-12, bras 2×12-15." },
      { jour: "Jour 2", focus: "Bas A", contenu: "Back squat 4×6-10, deadlift roumain 4×8-10, fentes arrière 3×10/jambe, mollets et gainage." },
      { jour: "Jour 3", focus: "Haut B", contenu: "Développé incliné 4×8-12, traction ou tirage 4×6-12, élévations latérales 3×12-20, oiseau et bras." },
      { jour: "Jour 4", focus: "Bas B", contenu: "Front squat 4×6-10, deadlift roumain haltères 3×10-12, step-up 3×10/jambe, ischios et mollets." },
    ],
  },
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
        nom: "Rotation du buste avec appui sur le genou opposé",
        photoFemme: "/programmes/bureau/femme-rotation-buste-appui-genou.jpg",
        photoHomme: "/programmes/bureau/homme-rotation-buste-appui-genou.jpg",
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
      {
        nom: "Étirement latéral de la nuque",
        photoFemme: "/programmes/bureau/femme-etirement-nuque.jpg",
        photoHomme: "/programmes/bureau/homme-etirement-nuque.jpg",
      },
      {
        nom: "Étirement debout de la chaîne postérieure avec chaise",
        photoFemme: "/programmes/bureau/femme-etirement-chaine-posterieure-chaise.jpg",
        photoHomme: "/programmes/bureau/homme-etirement-chaine-posterieure-chaise.jpg",
      },
    ],
    jours: [
      {
        jour: "Jour 1",
        focus: "Nuque, épaules & haut du dos",
        contenu:
          "Assis au bord d'une chaise stable : 8 rentrées de menton lentes, puis incline doucement l'oreille vers l'épaule et maintiens 20 à 30 secondes par côté, sans tourner la tête ni tirer fort avec la main. Enchaîne 12 rétractions d'omoplates, puis 8 rotations thoraciques par côté : pose la main sur l'extérieur du genou opposé, garde les deux pieds au sol et le bassin face à l'avant, puis tourne doucement le buste en expirant. Termine par 5 respirations profondes. Deux tours, sans douleur ni amplitude forcée.",
      },
      {
        jour: "Jour 2",
        focus: "Jambes & circulation",
        contenu:
          "3 tours : 12 extensions de genou par jambe, 20 montées de mollets assis, 30 secondes de marche assise genoux alternés, puis 20 secondes de contraction volontaire des fessiers. Repos 30 secondes entre les tours.",
      },
      {
        jour: "Jour 3",
        focus: "Hanches & chaîne postérieure",
        contenu:
          "Cheville posée sur le genou opposé : étirement fessier 30 secondes par côté. Puis, debout face à une chaise stable sans roulettes, pose les deux mains sur le haut du dossier, recule les pieds et pousse les hanches vers l'arrière en gardant le dos long. Maintiens 30 à 45 secondes, genoux légèrement fléchis et talons au sol. Enchaîne 10 ouvertures de genou par côté et 8 bascules contrôlées du bassin. Deux tours, sans douleur ni rebond.",
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
    badge: "Enrichi · À valider",
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
    photoFemme: "/programmes/v2/mobilite-rotation-femme-v2.png",
    photoHomme: "/exercices/mobilite-ouverture-epaules-baton.jpg",
    visuels: [
      { nom: "Fente basse — ouverture de hanche", photoFemme: "/exercices/mobilite-fente-basse-ouverture-hanche.jpg" },
      { nom: "Squat profond assisté — mobilité hanches & chevilles", photoHomme: "/exercices/mobilite-squat-profond-assiste-homme-metis.jpg" },
      { nom: "Rotation thoracique allongée", photoFemme: "/exercices/mobilite-rotation-thoracique-allongee.jpg" },
      { nom: "Ouverture d'épaules au bâton", photoHomme: "/exercices/mobilite-ouverture-epaules-baton.jpg" },
      { nom: "Chat-vache", photoFemme: "/exercices/mobilite-chat-vache-flexion.jpg" },
      { nom: "Étirement du psoas en fente", photoHomme: "/exercices/mobilite-etirement-psoas-fente.jpg" },
    ],
    medias: [
      "Air squat",
      "Pompes inclinées",
      "Rowing TRX",
      "Gainage planche",
      "Sauts à la corde",
      "Mountain climber",
    ],
    progression: [
      { periode: "Semaine 1", titre: "Repères", contenu: "Travaille dans une amplitude confortable, 1 à 2 séries par mouvement, avec une tension maximale de 3/10." },
      { periode: "Semaine 2", titre: "Contrôle", contenu: "Ajoute 2 répétitions ou 10 secondes par position sans rebondir et sans compenser avec le bas du dos." },
      { periode: "Semaine 3", titre: "Amplitude active", contenu: "Ajoute un maintien actif de 5 secondes en fin d'amplitude sur les mouvements contrôlés." },
      { periode: "Semaine 4", titre: "Fluidité", contenu: "Enchaîne les mouvements avec moins de pauses et compare uniquement les amplitudes indolores à celles de la première semaine." },
    ],
    jours: [
      {
        jour: "Jour 1",
        focus: "Hanches & chevilles",
        contenu:
          "2 tours : 6 transitions 90/90 par côté, fente basse 30 secondes par côté, 6 à 8 squats profonds assistés avec les talons au sol et 12 montées lentes sur demi-pointes. Termine par 5 respirations profondes en position confortable.",
      },
      {
        jour: "Jour 2",
        focus: "Épaules & thoracique",
        contenu:
          "2 tours : 8 passages de bâton ou de serviette dans une amplitude confortable, 8 rotations thoraciques par côté, 30 secondes d'étirement pectoral par côté et 8 cycles de chat-vache. Expire pendant l'ouverture thoracique.",
      },
      {
        jour: "Jour 3",
        focus: "Mobilité globale & respiration",
        contenu:
          "2 tours fluides : 8 cycles de chat-vache, 5 fentes basses dynamiques par côté, posture de l'enfant 45 secondes, 6 rotations thoraciques par côté et ouverture d'épaules au bâton 8 fois. Termine par 5 minutes de respiration diaphragmatique calme.",
      },
    ],
    nutrition: [
      { titre: "Hydratation", contenu: "Bois régulièrement dans la journée ; cette séance douce ne nécessite ni boisson énergétique ni supplément spécifique." },
      { titre: "Repas", contenu: "Garde des repas complets et réguliers. La mobilité n'impose pas de déficit calorique ni de protocole alimentaire restrictif." },
      { titre: "Après entraînement", contenu: "Si la mobilité suit une séance sportive, utilise le plan alimentaire associé à ton objectif principal et conserve une source de protéines au repas suivant." },
    ],
    recuperation: [
      { titre: "Intensité", contenu: "Reste entre 2 et 4/10 de tension. Arrête en cas de douleur vive, d'engourdissement ou de sensation électrique." },
      { titre: "Respiration", contenu: "Expire lentement dans la mise en tension et ne bloque jamais le souffle pour gagner artificiellement de l'amplitude." },
      { titre: "Fréquence", contenu: "Laisse au moins un jour entre les trois séances structurées ; une respiration douce ou quelques mouvements confortables restent possibles quotidiennement." },
    ],
    note: "La mobilité ne doit jamais forcer une articulation. En cas de blessure récente, d'hypermobilité connue ou de douleur persistante, demande l'avis d'un professionnel de santé.",
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
    photoFemme: "/exercices/sauts-corde.jpg",
    photoHomme: "/exercices/sauts-corde-reel.jpg",
    medias: ["Sauts à la corde", "Gainage latéral"],
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
    photoFemme: "/exercices/hyrox-wall-ball.jpg",
    photoHomme: "/exercices/poussee-traineau.jpg",
    medias: [
      "Poussée de traîneau",
      "Tirage de traîneau à la corde",
      "Burpee broad jump",
      "Marche du fermier kettlebells",
      "Kettlebell swing",
      "Burpee",
      "Mountain climber",
      "Gainage planche",
      "Gainage latéral",
    ],
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
    slug: "perte-de-gras-maintien-musculaire",
    nom: "Perte de gras — Muscle préservé",
    categorie: "PERTE_DE_POIDS",
    niveau: "Débutant à intermédiaire",
    duree: "8 semaines",
    frequence: "4 séances / semaine",
    accroche: "Perdre du gras sans sacrifier la force ni la masse musculaire.",
    description:
      "Un plan rentable en énergie et efficace : trois séances de musculation avec surcharge progressive, une séance cardio en zone 2, un déficit calorique modéré et des protéines élevées. La priorité reste la performance : si les charges se maintiennent, le muscle est mieux protégé.",
    objectifs: [
      "Préserver la masse musculaire pendant la perte de poids",
      "Soutenir la dépense énergétique sans s'épuiser",
      "Construire une routine tenable sur la durée",
      "Garder de l'énergie au quotidien malgré le déficit",
    ],
    photoQuery: "athletic person barbell squat dark premium gym",
    photoFemme: "/exercices/deadlift-conventionnel-femme-blonde-v2.jpg",
    photoHomme: "/exercices/back-squat-barre.jpg",
    medias: [
      "Back squat",
      "Développé couché haltères",
      "Fentes arrière haltères",
      "Rowing barre buste penché",
      "Rowing haltère unilatéral",
      "Élévations latérales",
      "Gainage planche",
    ],
    jours: [
      {
        jour: "Jour 1",
        focus: "Force A — bas du corps & poussée",
        contenu: "Squat, développé couché, fentes et gainage — 3 à 4 séries de 6 à 10 répétitions. Note chaque charge et cherche d'abord à la maintenir pendant le déficit.",
      },
      {
        jour: "Jour 2",
        focus: "Force B — tirage & chaîne postérieure",
        contenu: "Soulevé de terre roumain, rowing, tirage vertical et curl ischio-jambiers — 3 à 4 séries de 6 à 12 répétitions, sans aller à l'échec.",
      },
      {
        jour: "Jour 3",
        focus: "Full body — volume maîtrisé",
        contenu:
          "Presse à cuisses, développé incliné, rowing, hip thrust et élévations latérales — 3 séries de 8 à 15 répétitions. Garde 1 à 3 répétitions en réserve.",
      },
      {
        jour: "Jour 4",
        focus: "Zone 2 + dépense quotidienne",
        contenu:
          "35 à 45 min de marche inclinée, vélo ou rameur à allure conversationnelle. Ajoute des pas au quotidien plutôt que du cardio épuisant.",
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
    photoFemme: "/exercices/pompes-femme-eurasienne.jpg",
    photoHomme: "/exercices/poids-du-corps-pompe-homme-coai-v2.png",
    medias: [
      "Pompes",
      "Dips sur banc",
      "Superman",
      "Gainage planche",
      "Burpee",
      "Mountain climber",
      "Squat jump",
      "Shadow boxing",
      "Gainage latéral",
    ],
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
    photoFemme: "/exercices/fentes-bulgares.jpg",
    photoHomme: "/exercices/pont-fessier-homme-metis-v2.jpg",
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
    photoFemme: "/exercices/squat-poids-du-corps-femme-metisse-v2.jpg",
    photoHomme: "/anthony-trx-studio-premium.jpg",
    medias: ["Pompes", "Gainage planche"],
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
    photoFemme: "/recuperation/chambre-sommeil.jpg",
    photoHomme: "/recuperation/recup3-08-sommeil-homme.jpg",
    visuels: [
      {
        nom: "Rituel d'endormissement",
        photoFemme: "/recuperation/recup3-08-sommeil-femme.jpg",
        photoHomme: "/recuperation/recup3-08-sommeil-homme.jpg",
      },
      {
        nom: "Réglage de l'environnement",
        photoFemme: "/recuperation/recup3-07-assise-femme.jpg",
        photoHomme: "/recuperation/recup3-07-assise-homme.jpg",
      },
      {
        nom: "Préparation mentale du soir",
        photoFemme: "/recuperation/recup3-06-respiration-femme.jpg",
        photoHomme: "/recuperation/recup-v4-homme-metis-04-respiration-diaphragmatique.png",
      },
    ],
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
    photoFemme: "/recuperation/recup-v4-femme-blonde-10-etirement-lateral.png",
    photoHomme: "/recuperation/recup-v4-homme-metis-04-respiration-diaphragmatique.png",
    visuels: [
      {
        nom: "Respiration diaphragmatique",
        photoFemme: "/recuperation/recup-v4-femme-blonde-10-etirement-lateral.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-04-respiration-diaphragmatique.png",
      },
      {
        nom: "Cohérence cardiaque",
        photoFemme: "/recuperation/recup3-07-assise-femme.jpg",
        photoHomme: "/recuperation/recup3-07-assise-homme.jpg",
      },
      {
        nom: "Technique 4-7-8",
        photoFemme: "/recuperation/recup3-05-meditation-femme.jpg",
        photoHomme: "/recuperation/recup-v4-homme-metis-05-meditation.png",
      },
      {
        nom: "Box breathing",
        photoFemme: "/recuperation/recup3-06-respiration-femme.jpg",
        photoHomme: "/recuperation/recup-v4-homme-metis-04-respiration-diaphragmatique.png",
      },
    ],
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
    photoFemme: "/recuperation/recup3-05-meditation-femme.jpg",
    photoHomme: "/recuperation/recup-v4-homme-metis-05-meditation.png",
    visuels: [
      {
        nom: "Respiration d'observation",
        photoFemme: "/recuperation/recup3-05-meditation-femme.jpg",
        photoHomme: "/recuperation/recup-v4-homme-metis-05-meditation.png",
      },
      {
        nom: "Assise calme",
        photoFemme: "/recuperation/recup3-07-assise-femme.jpg",
        photoHomme: "/recuperation/recup3-07-assise-homme.jpg",
      },
      {
        nom: "Scan corporel",
        photoFemme: "/recuperation/recup3-03-dos-femme.jpg",
        photoHomme: "/recuperation/recup3-03-dos-homme.jpg",
      },
      {
        nom: "Marche méditative",
        photoFemme: "/recuperation/recup3-24-enfant-femme.jpg",
        photoHomme: "/recuperation/recup-v4-homme-metis-10-posture-enfant.png",
      },
    ],
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
    photoFemme: "/recuperation/recup-v4-femme-blonde-07-pressotherapie.png",
    photoHomme: "/recuperation/recup-v4-homme-metis-02-percussion-mollet.png",
    visuels: [
      {
        nom: "Sauna (chaleur sèche)",
        photoFemme: "/recuperation/sauna-femme-blonde-premium.jpg",
        photoHomme: "/recuperation/sauna-homme-blond-premium.jpg",
      },
      {
        nom: "Hammam (chaleur humide)",
        photoFemme: "/recuperation/hammam-femme-blonde-premium.jpg",
        photoHomme: "/recuperation/hammam-homme-blonde-premium.jpg",
      },
      {
        nom: "Auto-massage ciblé",
        photoFemme: "/recuperation/recup-v4-femme-blonde-01-foam-ischios.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-03-foam-haut-dos.png",
      },
      {
        nom: "Auto-massage par percussion",
        photoFemme: "/recuperation/recup-v4-femme-blonde-02-percussion-epaule.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-02-percussion-mollet.png",
      },
    ],
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
        focus: "Auto-massage par percussion",
        contenu:
          "Utilise une intensité faible à modérée pendant 30 à 60 secondes par zone, sans dépasser 2 à 3 minutes sur le même groupe musculaire. Reste sur le muscle, jamais sur un os, une articulation, la nuque, une zone inflammée ou douloureuse aiguë.",
      },
    ],
  },
  {
    slug: "routine-recuperation-complete",
    nom: "Routine récupération complète — 10 protocoles",
    categorie: "RECUPERATION",
    niveau: "Tous niveaux",
    duree: "10 protocoles",
    frequence: "10 à 20 minutes, 3 à 5 fois par semaine",
    accroche: "Une boîte à outils complète pour relâcher, respirer, mobiliser et mieux récupérer.",
    description:
      "10 protocoles courts à sélectionner selon les tensions et la fatigue du jour. Chaque visuel présente une variante homme ou femme différente, avec un geste techniquement lisible. Reste sur une sensation confortable : une douleur vive, un engourdissement ou un gonflement inhabituel impose d'arrêter et de demander un avis professionnel.",
    objectifs: [
      "Relâcher les zones musculaires les plus sollicitées",
      "Améliorer la mobilité sans ajouter de fatigue",
      "Favoriser le retour au calme après l'entraînement",
      "Construire une routine de récupération simple et régulière",
    ],
    photoQuery: "athletic recovery mobility premium studio",
    photoFemme: "/recuperation/recup-v4-femme-blonde-01-foam-ischios.png",
    photoHomme: "/recuperation/recup-v4-homme-metis-01-massage-plantaire.png",
    visuels: [
      {
        nom: "Auto-massage du bas du corps",
        photoFemme: "/recuperation/recup-v4-femme-blonde-01-foam-ischios.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-02-percussion-mollet.png",
      },
      {
        nom: "Relâchement du haut du corps",
        photoFemme: "/recuperation/recup-v4-femme-blonde-02-percussion-epaule.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-03-foam-haut-dos.png",
      },
      {
        nom: "Pied et cheville",
        photoFemme: "/recuperation/recup-v4-femme-blonde-04-mobilite-cheville.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-01-massage-plantaire.png",
      },
      {
        nom: "Respiration et ouverture latérale",
        photoFemme: "/recuperation/recup-v4-femme-blonde-10-etirement-lateral.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-04-respiration-diaphragmatique.png",
      },
      {
        nom: "Pause de récupération",
        photoFemme: "/recuperation/recup-v4-femme-blonde-06-hydratation.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-05-meditation.png",
      },
      {
        nom: "Mobilité des hanches et ischio-jambiers",
        photoFemme: "/recuperation/recup-v4-femme-blonde-09-ischios-sangle.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-06-mobilite-90-90.png",
      },
      {
        nom: "Mobilité de la colonne",
        photoFemme: "/recuperation/recup-v4-femme-blonde-05-cat-cow.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-07-open-book.png",
      },
      {
        nom: "Retour veineux",
        photoFemme: "/recuperation/recup-v4-femme-blonde-07-pressotherapie.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-08-jambes-au-mur.png",
      },
      {
        nom: "Détente des extrémités",
        photoFemme: "/recuperation/recup-v4-femme-blonde-08-poignets.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-09-detente-nuque.png",
      },
      {
        nom: "Étirements doux de fin de séance",
        photoFemme: "/recuperation/recup-v4-femme-blonde-03-etirement-mollet.png",
        photoHomme: "/recuperation/recup-v4-homme-metis-10-posture-enfant.png",
      },
    ],
    jours: [
      {
        jour: "Protocole 1",
        focus: "Auto-massage du bas du corps",
        contenu:
          "Travaille 30 à 60 secondes par zone, sur 1 à 2 passages lents. La pression reste tolérable (maximum 4/10) et ne s'applique jamais directement sur un os, une articulation ou une zone douloureuse aiguë.",
      },
      {
        jour: "Protocole 2",
        focus: "Relâchement du haut du corps",
        contenu:
          "Foam roller sur le haut du dos ou percussion légère autour de l'épaule : 30 à 45 secondes par zone, puis 3 respirations lentes. Évite la nuque, la colonne directement et l'avant de l'épaule.",
      },
      {
        jour: "Protocole 3",
        focus: "Pied et cheville",
        contenu:
          "Pieds nus, roule une balle sous la voûte plantaire pendant 60 à 90 secondes par côté, puis effectue 8 à 10 avancées lentes du genou au-dessus des orteils sans décoller le talon.",
      },
      {
        jour: "Protocole 4",
        focus: "Respiration",
        contenu:
          "Assis·e, inspire 5 secondes par le nez puis expire 5 secondes, sans forcer, pendant 5 minutes. Les épaules restent basses et l'abdomen accompagne naturellement le souffle.",
      },
      {
        jour: "Protocole 5",
        focus: "Retour au calme et hydratation",
        contenu:
          "Prends 5 minutes assis·e au calme après la séance, puis bois progressivement 500 à 750 ml d'eau dans l'heure qui suit, à ajuster selon la chaleur, la durée de l'effort et ta transpiration.",
      },
      {
        jour: "Protocole 6",
        focus: "Hanches et ischio-jambiers",
        contenu:
          "Effectue 2 séries de 30 à 45 secondes par côté en 90/90 ou avec une sangle d'ischio-jambiers. Cherche une tension modérée, sans arrondir fortement le bas du dos ni rebondir.",
      },
      {
        jour: "Protocole 7",
        focus: "Colonne thoracique",
        contenu:
          "Réalise 6 à 8 répétitions lentes par côté en open book ou 8 cycles contrôlés de cat-cow. Expire pendant l'ouverture ou l'arrondissement, sans chercher l'amplitude maximale.",
      },
      {
        jour: "Protocole 8",
        focus: "Retour veineux",
        contenu:
          "Place les jambes au mur 5 à 10 minutes, sans engourdissement. Pour la pressothérapie, utilise 15 à 30 minutes à pression confortable et respecte toujours les réglages et contre-indications du fabricant.",
      },
      {
        jour: "Protocole 9",
        focus: "Nuque et poignets",
        contenu:
          "Tiens chaque étirement doux 20 à 30 secondes, 2 fois par côté. Garde le menton légèrement rentré pour la nuque et le coude souple pour le poignet, sans tirer jusqu'à la douleur.",
      },
      {
        jour: "Protocole 10",
        focus: "Fin de séance",
        contenu:
          "Termine par 2 positions confortables de 45 à 60 secondes : mollet au mur et posture de l'enfant soutenue. Respire lentement et sors progressivement de chaque position.",
      },
    ],
  },
];

// La nouvelle version 6 semaines remplace le premier brouillon fessiers.
// Les autres packs historiques restent inchangés et les nouveautés sont
// ajoutées à la fin, toutes signalées « À valider » dans l'interface.
const PROGRAMMES_BRUTS: ProgrammePret[] = [
  ...PROGRAMMES_DE_BASE.filter(({ slug }) => slug !== "special-fessiers"),
  ...PROGRAMMES_RENTREE,
];

export const PROGRAMMES_PRETS: ProgrammePret[] = PROGRAMMES_BRUTS.map(
  (programme) => ({
    ...programme,
    ...(ENRICHISSEMENTS_PROGRAMMES[programme.slug] ?? {}),
  }),
);
