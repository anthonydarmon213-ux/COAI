import type {
  CleEntrainement,
  CleNutrition,
  CleRecuperation,
  FrequenceSocle,
  NiveauSocle,
  ObjectifSocle,
  RegimeSocle,
} from "@/lib/programmes-socles/cle";
import { filtrerExercicesAvecMedias } from "@/lib/exercices/media-coai";
import { sontSupersetAntagoniste } from "@/lib/programmes/supersets";

// Bibliothèque éditoriale COAI : ces programmes sont construits une fois,
// versionnés et servis à tous les abonnés Pass IA sans aucun appel à un
// modèle payant. Les noms d'exercices et de repas sont volontairement ceux
// de notre médiathèque afin que chaque carte affiche une photo COAI locale.

const JOURS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
const JOURS_ENTRAINEMENT = ["Lundi", "Mercredi", "Vendredi", "Samedi", "Dimanche"] as const;

type Prescription = {
  series: string;
  repetitions: string;
  repos: string;
  charge: string;
};

type ExerciceModele = {
  nom: string;
  phases: [string, string, string];
};

type SeanceModele = {
  nom: string;
  exercices: ExerciceModele[];
};

const SEANCES: SeanceModele[] = [
  {
    nom: "Full Body — les fondamentaux",
    exercices: [
      { nom: "Squat barre", phases: ["Pieds stables, poitrine haute", "Hanches en arrière, genoux alignés", "Pousse le sol, remonte gainé"] },
      { nom: "Développé couché haltères", phases: ["Pieds ancrés, omoplates serrées", "Descends les haltères sous contrôle", "Pousse sans décoller les épaules"] },
      { nom: "Rowing TRX", phases: ["Corps aligné, bras tendus", "Tire les coudes près du corps", "Serre les omoplates puis contrôle"] },
      { nom: "Soulevé de terre conventionnel", phases: ["Pieds stables, dos neutre", "Pousse le sol, barre proche", "Verrouille debout sans cambrer"] },
      { nom: "Gainage planche", phases: ["Corps aligné épaules-talons", "Ventre et fessiers contractés", "Respire sans creuser le dos"] },
      { nom: "Crunch", phases: ["Bas du dos plaqué", "Décolle seulement les omoplates", "Expire puis redescends lentement"] },
    ],
  },
  {
    nom: "Jambes & fessiers",
    exercices: [
      { nom: "Fentes arrière haltères", phases: ["Grand pas arrière, buste haut", "Descends le genou sous contrôle", "Pousse dans le pied avant"] },
      { nom: "Air squat (poids du corps)", phases: ["Pieds stables, poitrine haute", "Descends genoux dans l’axe", "Pousse le sol, remonte gainé"] },
      { nom: "Kettlebell swing", phases: ["Charnière de hanche, dos plat", "Projette les hanches vers l’avant", "Laisse la charge revenir seule"] },
      { nom: "Fente arrière TRX", phases: ["Sangles tendues, buste vertical", "Recule et descends contrôlé", "Pousse dans le talon avant"] },
      { nom: "Russian twist", phases: ["Buste incliné, dos long", "Tourne les épaules et le tronc", "Contrôle chaque changement de côté"] },
    ],
  },
  {
    nom: "Haut du corps — posture & force",
    exercices: [
      { nom: "Développé couché haltères", phases: ["Pieds ancrés, omoplates serrées", "Descends les haltères sous contrôle", "Pousse sans décoller les épaules"] },
      { nom: "Pompes TRX", phases: ["Corps aligné, sangles stables", "Descends les coudes à 45°", "Pousse sans creuser le dos"] },
      { nom: "Rowing haltère unilatéral", phases: ["Buste incliné, dos neutre", "Tire le coude vers la hanche", "Contrôle la descente sans tourner"] },
      { nom: "Élévations latérales", phases: ["Épaules basses, coudes souples", "Monte jusqu’à hauteur d’épaule", "Redescends sans laisser tomber"] },
      { nom: "Superman", phases: ["Allongé, nuque dans l’axe", "Décolle bras et jambes ensemble", "Tiens puis repose sans à-coup"] },
      { nom: "Gainage latéral", phases: ["Coude placé sous l’épaule", "Hanches hautes, corps aligné", "Respire en gardant le bassin fixe"] },
    ],
  },
  {
    nom: "Athlétique — puissance contrôlée",
    exercices: [
      { nom: "Kettlebell swing", phases: ["Charnière de hanche, dos plat", "Projette les hanches vers l’avant", "Laisse la kettlebell revenir seule"] },
      { nom: "Fentes arrière haltères", phases: ["Grand pas arrière, buste vertical", "Genou arrière proche du sol", "Pousse dans le pied avant"] },
      { nom: "Développé militaire haltères", phases: ["Haltères aux épaules, tronc gainé", "Pousse verticalement sans cambrer", "Redescends sous contrôle aux épaules"] },
      { nom: "Rowing haltère unilatéral", phases: ["Buste incliné, dos neutre", "Tire le coude vers la hanche", "Contrôle sans tourner le bassin"] },
      { nom: "Mountain climber", phases: ["Mains sous les épaules", "Ramène un genou à la fois", "Bassin stable, rythme contrôlé"] },
    ],
  },
  {
    nom: "Force globale — progression",
    exercices: [
      { nom: "Soulevé de terre trap bar", phases: ["Pieds centrés, dos plat", "Pousse le sol, poitrine haute", "Verrouille debout sans te pencher"] },
      { nom: "Front squat barre", phases: ["Coudes hauts, tronc vertical", "Descends entre les hanches", "Remonte en gardant les coudes hauts"] },
      { nom: "Développé couché haltères", phases: ["Pieds ancrés, omoplates serrées", "Descends les haltères sous contrôle", "Pousse sans décoller les épaules"] },
      { nom: "Curl biceps haltères", phases: ["Coudes fixes près du buste", "Monte sans élan du dos", "Redescends lentement sous contrôle"] },
      { nom: "Gainage latéral", phases: ["Coude placé sous l’épaule", "Hanches hautes, corps aligné", "Respire en gardant le bassin fixe"] },
    ],
  },
];

function prescription(objectif: ObjectifSocle, niveau: NiveauSocle): Prescription {
  if (niveau === "DEBUTANT") {
    return {
      series: "3",
      repetitions: "8-12 répétitions",
      repos: "75 sec",
      charge: "charge confortable — garde 3 répétitions possibles et une technique parfaite",
    };
  }
  if (objectif === "PERFORMANCE") {
    return {
      series: niveau === "AVANCE" ? "5" : "4",
      repetitions: "5-8 répétitions",
      repos: "120 sec",
      charge: "charge exigeante mais propre — garde 1 à 2 répétitions possibles",
    };
  }
  if (objectif === "MUSCLE") {
    return {
      series: niveau === "AVANCE" ? "4" : "3-4",
      repetitions: "8-12 répétitions",
      repos: "90 sec",
      charge: "les 2 dernières répétitions sont difficiles mais restent techniquement propres",
    };
  }
  if (objectif === "PERTE") {
    return {
      series: "3",
      repetitions: "12-15 répétitions",
      repos: "45-60 sec",
      charge: "charge modérée — rythme continu sans dégrader le mouvement",
    };
  }
  return {
    series: "3",
    repetitions: "10-12 répétitions",
    repos: "60-75 sec",
    charge: "charge maîtrisée — garde 2 répétitions possibles",
  };
}

function decomposerCleEntrainement(cle: CleEntrainement): {
  objectif: ObjectifSocle;
  niveau: NiveauSocle;
  frequence: FrequenceSocle;
} {
  const morceaux = cle.split("_");
  if (morceaux[0] === "BASE") {
    return { objectif: "FORME", niveau: "DEBUTANT", frequence: Number(morceaux[2]) as FrequenceSocle };
  }
  return {
    objectif: morceaux[0] as ObjectifSocle,
    niveau: morceaux[1] as NiveauSocle,
    frequence: Number(morceaux[2]) as FrequenceSocle,
  };
}

const LABEL_OBJECTIF: Record<ObjectifSocle, string> = {
  PERTE: "Composition corporelle",
  MUSCLE: "Force & muscle",
  FORME: "Forme & équilibre",
  PERFORMANCE: "Performance",
};

export function construireSocleEntrainement(cle: CleEntrainement) {
  const { objectif, niveau, frequence } = decomposerCleEntrainement(cle);
  const format = prescription(objectif, niveau);
  const seances = SEANCES.slice(0, frequence).map((modele, index) => ({
    jour: JOURS_ENTRAINEMENT[index] ?? "Lundi",
    nom: modele.nom,
    photoQuerySeance: modele.exercices[0]?.nom ?? modele.nom,
    echauffement:
      "7 min : cardio léger, mobilité des hanches et des épaules, puis 3 séries d’approche progressives sur le premier exercice (50 % × 10, 70 % × 6, 85 % × 3).",
    exercices: filtrerExercicesAvecMedias(modele.exercices.map((exercice) => ({
      nom: exercice.nom,
      series: exercice.nom.toLowerCase().includes("gainage") ? "3" : format.series,
      repetitions: exercice.nom.toLowerCase().includes("gainage") ? "30-45 sec" : format.repetitions,
      repos: exercice.nom.toLowerCase().includes("gainage") ? "30 sec" : format.repos,
      charge: /gainage|crunch|superman|roue abdominale|russian twist/i.test(exercice.nom)
        ? "poids du corps — exécution lente et contrôlée"
        : format.charge,
      methode: "Série classique",
      photoQuery: exercice.nom,
      phases: exercice.phases,
    }))).map((exercice, exerciceIndex, exercices) => {
      const suivant = exercices[exerciceIndex + 1];
      const nom = typeof exercice.nom === "string" ? exercice.nom : "";
      const nomSuivant = suivant && typeof suivant.nom === "string" ? suivant.nom : "";
      if (niveau !== "DEBUTANT" && nomSuivant && sontSupersetAntagoniste(nom, nomSuivant)) {
        return {
          ...exercice,
          methode: `Superset agoniste–antagoniste · enchaîner avec ${nomSuivant}`,
          supersetAvec: nomSuivant,
        };
      }
      return exercice;
    }),
    retourAuCalme:
      "6 à 8 min : marche lente, étirements légers des zones travaillées, puis rouleau de mousse sur quadriceps ou haut du dos sans rechercher la douleur.",
  }));

  return {
    _source: "SOCLE_COAI",
    titre: `${LABEL_OBJECTIF[objectif]} — ${frequence} séance${frequence > 1 ? "s" : ""}/semaine`,
    frequenceParSemaine: `${frequence} séance${frequence > 1 ? "s" : ""} par semaine`,
    dureeProgramme: "4 semaines, puis progression et réévaluation",
    vueEnsemble:
      "Un programme volontairement simple et progressif : mouvements fondamentaux, technique prioritaire et volume soutenable. Note tes charges et ajoute seulement 1 à 2 répétitions ou 2,5 % de charge quand toutes les séries restent propres.",
    contreIndications: [],
    seances,
  };
}

const MENUS = [
  [
    ["Petit-déjeuner", "Flocons d’avoine, fruits rouges et amandes", "60 g de flocons d’avoine, 150 g de fruits rouges, 15 g d’amandes effilées"],
    ["Déjeuner", "Poulet grillé, riz basmati et haricots verts", "150 g de poulet, 120 g de riz cuit, 200 g de haricots verts, 1 càs d’huile d’olive"],
    ["Dîner", "Saumon grillé, quinoa et brocolis", "150 g de saumon, 120 g de quinoa cuit, 200 g de brocolis"],
    ["Collation", "Amandes et noix de cajou", "25 g d’amandes et noix de cajou"],
  ],
  [
    ["Petit-déjeuner", "Œufs brouillés, avocat et pain complet", "3 œufs, 1/2 avocat, 1 tranche de pain complet"],
    ["Déjeuner", "Dinde, pommes de terre grenaille et épinards", "160 g de dinde, 220 g de pommes de terre, 180 g d’épinards"],
    ["Dîner", "Cabillaud, lentilles vertes et carottes rôties", "170 g de cabillaud, 140 g de lentilles cuites, 180 g de carottes"],
    ["Collation", "Fromage blanc, miel et noix", "200 g de fromage blanc, 1 càc de miel, 15 g de noix"],
  ],
  [
    ["Petit-déjeuner", "Omelette aux épinards et feta", "3 œufs, 80 g d’épinards, 30 g de feta, 100 g de tomates cerises"],
    ["Déjeuner", "Bœuf maigre, patate douce et salade", "150 g de bœuf maigre, 220 g de patate douce, 120 g de salade verte"],
    ["Dîner", "Tofu mariné, sarrasin et légumes croquants", "180 g de tofu, 120 g de nouilles de sarrasin cuites, 220 g de légumes"],
    ["Collation", "Amandes et noix de cajou", "25 g d’oléagineux"],
  ],
  [
    ["Petit-déjeuner", "Fromage blanc, banane, miel et noix", "200 g de fromage blanc, 1 banane, 1 càc de miel, 15 g de noix"],
    ["Déjeuner", "Poulet rôti, boulgour et courgettes", "160 g de poulet, 130 g de boulgour cuit, 200 g de courgettes"],
    ["Dîner", "Curry de pois chiches et riz complet", "180 g de pois chiches cuits, 120 g de riz complet cuit, 200 g de légumes"],
    ["Collation", "Œufs durs", "2 œufs durs et un fruit de saison"],
  ],
  [
    ["Petit-déjeuner", "Flocons d’avoine, fruits rouges et amandes", "60 g de flocons d’avoine, 150 g de fruits rouges, 15 g d’amandes"],
    ["Déjeuner", "Steak de thon, patate douce et asperges", "160 g de thon, 220 g de patate douce, 180 g d’asperges"],
    ["Dîner", "Saumon en papillote, riz sauvage et poireaux", "150 g de saumon, 120 g de riz sauvage cuit, 200 g de poireaux"],
    ["Collation", "Pomme et beurre d’amande", "1 pomme et 15 g de beurre d’amande"],
  ],
  [
    ["Petit-déjeuner", "Œufs brouillés, avocat et pain complet", "3 œufs, 1/2 avocat, 1 tranche de pain complet"],
    ["Déjeuner", "Cabillaud, lentilles vertes et carottes rôties", "170 g de cabillaud, 140 g de lentilles cuites, 180 g de carottes"],
    ["Dîner", "Poulet grillé, riz basmati et haricots verts", "150 g de poulet, 120 g de riz cuit, 200 g de haricots verts"],
    ["Collation", "Fromage blanc, miel et noix", "200 g de fromage blanc, 1 càc de miel, 15 g de noix"],
  ],
  [
    ["Petit-déjeuner", "Omelette aux épinards et feta", "3 œufs, 80 g d’épinards, 30 g de feta, 100 g de tomates cerises"],
    ["Déjeuner", "Tofu mariné, sarrasin et légumes croquants", "180 g de tofu, 120 g de nouilles de sarrasin cuites, 220 g de légumes"],
    ["Dîner", "Bœuf maigre, patate douce et salade", "150 g de bœuf maigre, 220 g de patate douce, 120 g de salade"],
    ["Collation", "Amandes et noix de cajou", "25 g d’oléagineux"],
  ],
] as const;

// Deuxième semaine : mêmes aliments simples et disponibles, mais assemblés
// autrement pour éviter l'effet « menu copié-collé ». Les plats restent
// tous couverts par notre bibliothèque photo COAI.
const MENUS_SEMAINE_2 = [
  [
    ["Petit-déjeuner", "Fromage blanc, banane, miel et noix", "200 g de fromage blanc, 1 banane, 1 càc de miel, 15 g de noix"],
    ["Déjeuner", "Saumon grillé, quinoa et brocolis", "150 g de saumon, 120 g de quinoa cuit, 200 g de brocolis"],
    ["Dîner", "Dinde, pommes de terre grenaille et épinards", "160 g de dinde, 220 g de pommes de terre, 180 g d’épinards"],
    ["Collation", "Pomme et beurre d’amande", "1 pomme et 15 g de beurre d’amande"],
  ],
  [
    ["Petit-déjeuner", "Flocons d’avoine, fruits rouges et amandes", "60 g de flocons d’avoine, 150 g de fruits rouges, 15 g d’amandes"],
    ["Déjeuner", "Bœuf maigre, patate douce et salade", "150 g de bœuf maigre, 220 g de patate douce, 120 g de salade"],
    ["Dîner", "Cabillaud, lentilles vertes et carottes rôties", "170 g de cabillaud, 140 g de lentilles cuites, 180 g de carottes"],
    ["Collation", "Fromage blanc, miel et noix", "200 g de fromage blanc, 1 càc de miel, 15 g de noix"],
  ],
  [
    ["Petit-déjeuner", "Œufs brouillés, avocat et pain complet", "3 œufs, 1/2 avocat, 1 tranche de pain complet"],
    ["Déjeuner", "Poulet rôti, boulgour et courgettes", "160 g de poulet, 130 g de boulgour cuit, 200 g de courgettes"],
    ["Dîner", "Steak de thon, patate douce et asperges", "160 g de thon, 220 g de patate douce, 180 g d’asperges"],
    ["Collation", "Amandes et noix de cajou", "25 g d’oléagineux"],
  ],
  [
    ["Petit-déjeuner", "Omelette aux épinards et feta", "3 œufs, 80 g d’épinards, 30 g de feta, 100 g de tomates cerises"],
    ["Déjeuner", "Curry de pois chiches et riz complet", "180 g de pois chiches cuits, 120 g de riz complet cuit, 200 g de légumes"],
    ["Dîner", "Poulet grillé, riz basmati et haricots verts", "150 g de poulet, 120 g de riz cuit, 200 g de haricots verts"],
    ["Collation", "Œufs durs", "2 œufs durs et un fruit de saison"],
  ],
  [
    ["Petit-déjeuner", "Fromage blanc, banane, miel et noix", "200 g de fromage blanc, 1 banane, 1 càc de miel, 15 g de noix"],
    ["Déjeuner", "Tofu mariné, sarrasin et légumes croquants", "180 g de tofu, 120 g de nouilles de sarrasin cuites, 220 g de légumes"],
    ["Dîner", "Saumon en papillote, riz sauvage et poireaux", "150 g de saumon, 120 g de riz sauvage cuit, 200 g de poireaux"],
    ["Collation", "Pomme et beurre d’amande", "1 pomme et 15 g de beurre d’amande"],
  ],
  [
    ["Petit-déjeuner", "Flocons d’avoine, fruits rouges et amandes", "60 g de flocons d’avoine, 150 g de fruits rouges, 15 g d’amandes"],
    ["Déjeuner", "Dinde, pommes de terre grenaille et épinards", "160 g de dinde, 220 g de pommes de terre, 180 g d’épinards"],
    ["Dîner", "Curry de pois chiches et riz complet", "180 g de pois chiches cuits, 120 g de riz complet cuit, 200 g de légumes"],
    ["Collation", "Amandes et noix de cajou", "25 g d’oléagineux"],
  ],
  [
    ["Petit-déjeuner", "Œufs brouillés, avocat et pain complet", "3 œufs, 1/2 avocat, 1 tranche de pain complet"],
    ["Déjeuner", "Steak de thon, patate douce et asperges", "160 g de thon, 220 g de patate douce, 180 g d’asperges"],
    ["Dîner", "Poulet rôti, boulgour et courgettes", "160 g de poulet, 130 g de boulgour cuit, 200 g de courgettes"],
    ["Collation", "Fromage blanc, miel et noix", "200 g de fromage blanc, 1 càc de miel, 15 g de noix"],
  ],
] as const;

const OBJECTIFS_NUTRITION: Record<ObjectifSocle, { titre: string; calories: string; proteines: string; glucides: string; lipides: string }> = {
  PERTE: { titre: "Nutrition — déficit modéré et durable", calories: "~1 800 à 2 200 kcal", proteines: "~130 à 160 g", glucides: "~170 à 230 g", lipides: "~55 à 75 g" },
  MUSCLE: { titre: "Nutrition — énergie pour construire", calories: "~2 300 à 2 800 kcal", proteines: "~150 à 180 g", glucides: "~260 à 340 g", lipides: "~70 à 90 g" },
  FORME: { titre: "Nutrition — équilibre et énergie", calories: "~2 000 à 2 500 kcal", proteines: "~120 à 160 g", glucides: "~220 à 300 g", lipides: "~65 à 85 g" },
  PERFORMANCE: { titre: "Nutrition — soutenir la performance", calories: "~2 300 à 2 900 kcal", proteines: "~140 à 180 g", glucides: "~280 à 380 g", lipides: "~65 à 90 g" },
};

const LABEL_REGIME: Record<RegimeSocle, string> = {
  CLASSIQUE: "équilibrée",
  SANS_GLUTEN: "sans gluten",
  VEGETARIEN: "végétarienne",
  VEGAN: "végane",
  PALEO: "paléo",
};

type RepasTuple = readonly [string, string, string];

function adapterRepasAuRegime(repas: RepasTuple, regime: RegimeSocle): RepasTuple {
  const [type, nom, quantite] = repas;
  if (regime === "CLASSIQUE") return repas;

  if (regime === "SANS_GLUTEN") {
    return [
      type,
      nom.replace("pain complet", "galettes de sarrasin").replace("boulgour", "quinoa"),
      quantite
        .replace("tranche de pain complet", "galettes de sarrasin certifiées sans gluten")
        .replace("boulgour", "quinoa")
        .replace("nouilles de sarrasin", "nouilles de sarrasin certifiées sans gluten"),
    ];
  }

  const estAnimal = /poulet|saumon|thon|cabillaud|dinde|bœuf|boeuf/i.test(nom);
  const contientOeufsOuLait = /œuf|oeuf|omelette|fromage|feta/i.test(nom);

  if (regime === "VEGETARIEN") {
    if (estAnimal) {
      return [type, "Tofu mariné, sarrasin et légumes croquants", "180 g de tofu, 120 g de nouilles de sarrasin cuites, 220 g de légumes"];
    }
    return repas;
  }

  if (regime === "VEGAN") {
    if (type === "Petit-déjeuner" || contientOeufsOuLait) {
      return [type, "Flocons d’avoine, fruits rouges et amandes", "70 g de flocons d’avoine, 200 ml de boisson soja, 150 g de fruits rouges, 15 g d’amandes"];
    }
    if (estAnimal || /œufs durs/i.test(nom)) {
      return [type, "Curry de pois chiches et riz complet", "200 g de pois chiches cuits, 130 g de riz complet cuit, 220 g de légumes"];
    }
    return repas;
  }

  // Paléo : pas de céréales, légumineuses ni produits laitiers. On reste
  // sur des aliments simples et des assiettes déjà représentées dans la
  // médiathèque COAI (œufs, poisson, viande, légumes, patate douce, noix).
  if (type === "Petit-déjeuner" || contientOeufsOuLait) {
    return [type, "Œufs brouillés, avocat et patate douce", "3 œufs, 1/2 avocat, 180 g de patate douce rôtie"];
  }
  if (/tofu|pois chiches|curry/i.test(nom)) {
    return [type, "Poulet grillé, patate douce et légumes verts", "170 g de poulet, 220 g de patate douce, 200 g de légumes verts"];
  }
  return [
    type,
    nom
      .replace(/riz basmati|riz complet|riz sauvage|quinoa|boulgour|lentilles vertes|nouilles de sarrasin/gi, "patate douce"),
    quantite
      .replace(/\d+ g de (riz basmati cuit|riz complet cuit|riz sauvage cuit|quinoa cuit|boulgour cuit|lentilles cuites|nouilles de sarrasin cuites)/gi, "220 g de patate douce rôtie"),
  ];
}

export function construireSocleNutrition(cle: CleNutrition) {
  const separation = cle.indexOf("_");
  const objectifCle = cle.slice(0, separation) as ObjectifSocle;
  const regime = cle.slice(separation + 1) as RegimeSocle;
  const objectif = OBJECTIFS_NUTRITION[objectifCle];
  return {
    _source: "SOCLE_COAI",
    titre: `${objectif.titre} · ${LABEL_REGIME[regime]} · rotation 14 jours`,
    vueEnsemble:
      "Trois repas complets et une collation optionnelle. Ajuste légèrement les quantités selon ta faim, ton gabarit et ton activité ; privilégie les aliments bruts, une source de protéines à chaque repas et des légumes variés.",
    contreIndications: [],
    objectifsJournaliers: {
      calories: objectif.calories,
      proteines: objectif.proteines,
      glucides: objectif.glucides,
      lipides: objectif.lipides,
      hydratation: "1,5 à 2 L, +0,5 à 1 L les jours chauds ou intenses",
    },
    conseilsHabitudes: [
      { sujet: "Hydratation", constatActuel: "Repère quotidien", conseil: "Bois régulièrement entre les repas ; augmente de 0,5 à 1 L en cas de chaleur ou de forte transpiration." },
      { sujet: "Préparation", constatActuel: "Semaine active", conseil: "Prépare deux protéines et deux féculents le dimanche pour assembler les repas en moins de 10 minutes." },
      { sujet: "Flexibilité", constatActuel: "Objectif durable", conseil: "Garde un repas libre par semaine, sans compensation ni culpabilité, puis reprends simplement le plan au repas suivant." },
    ],
    jours: [MENUS, MENUS_SEMAINE_2].flatMap((semaine, semaineIndex) =>
      semaine.map((repas, index) => ({
        jour: `Semaine ${semaineIndex + 1} · ${JOURS[index]}`,
        photoQueryJour: repas[1]?.[1] ?? repas[0][1],
        repas: repas.map((item) => {
          const [type, nom, quantite] = adapterRepasAuRegime(item, regime);
          return { type, nom, quantite, photoQuery: nom };
        }),
      }))
    ),
  };
}

export function construireSocleRecuperation(cle: CleRecuperation) {
  const frequence = Number(cle.replace("FREQ_", "")) as FrequenceSocle;
  const joursEntrainement = new Set([0, 2, 4, 5, 6].slice(0, frequence));
  const mobilites = [
    "10 min : rouleau de mousse sur les quadriceps puis mobilité de cheville en fente.",
    "8 min : posture de l’enfant et respiration diaphragmatique lente.",
    "10 min : rouleau de mousse sur le haut du dos puis rotation thoracique allongée.",
    "20 min de marche facile et étirement doux du cou.",
    "10 min : rouleau sur les ischio-jambiers puis étirement du psoas en fente.",
    "12 min : chat-vache, posture de l’enfant et respiration nasale.",
    "Jambes contre le mur 8 min, puis respiration calme.",
  ];
  const mobilitesSemaine2 = [
    "10 min : mobilité de cheville puis étirement doux du psoas en fente.",
    "8 min : balle de massage sous le pied puis respiration diaphragmatique.",
    "10 min : rouleau de mousse sur les ischio-jambiers et posture de l’enfant.",
    "20 min de marche facile puis étirement fessier assis.",
    "10 min : rouleau sur les quadriceps puis rotation thoracique allongée.",
    "12 min : chat-vache, ouverture d’épaules et respiration nasale.",
    "Jambes contre le mur 10 min dans une ambiance calme.",
  ];

  return {
    _source: "SOCLE_COAI",
    titre: "Récupération — rotation progressive sur 14 jours",
    vueEnsemble:
      "La progression vient de l’alternance entre effort et récupération. Conserve une heure de coucher régulière, marche les jours de repos et réduis l’intensité si la fatigue reste élevée plusieurs jours.",
    contreIndications: [],
    protocoles: [
      {
        nom: "Auto-massage ciblé",
        duree: "8 à 12 min",
        conseil: "Rouleau sur quadriceps, ischio-jambiers ou haut du dos, lentement et sans rechercher une douleur forte.",
        precaution: "Évite les zones blessées, inflammées ou directement sur une articulation.",
      },
      {
        nom: "Breathwork — expiration longue",
        duree: "5 min",
        conseil: "Inspire 4 secondes par le nez, expire 6 secondes, sans apnée forcée. Arrête si tu ressens un vertige.",
        precaution: "Pratique assis ou allongé, jamais dans l’eau ni en conduisant.",
      },
      {
        nom: "Méditation guidée / body scan",
        duree: "8 à 10 min",
        conseil: "Balaye mentalement le corps des pieds à la tête et relâche chaque zone sans chercher à performer.",
        precaution: "Une pratique courte et régulière vaut mieux qu’une longue séance occasionnelle.",
      },
      {
        nom: "Sauna",
        duree: "10 à 15 min",
        conseil: "Optionnel, sur une journée légère ou après réhydratation complète. Sors dès que l’inconfort augmente.",
        precaution: "À éviter sans avis médical en cas de problème cardiovasculaire, de grossesse, de fièvre ou de déshydratation.",
      },
      {
        nom: "Hammam",
        duree: "10 à 15 min",
        conseil: "Respiration calme, séance courte et hydratation avant puis après. Ne le considère pas comme un moyen de perdre du gras.",
        precaution: "Même prudence que le sauna ; ne reste jamais seul si tu es sujet aux malaises.",
      },
      {
        nom: "Bain froid",
        duree: "2 à 5 min · eau fraîche, progression graduelle",
        conseil: "Réserve-le surtout aux périodes de compétition, d’endurance ou de courbatures importantes.",
        precaution: "Évite juste après une séance de force orientée muscle ; jamais seul, et avis médical si risque cardiovasculaire.",
      },
      {
        nom: "Marche de récupération",
        duree: "20 à 30 min",
        conseil: "Allure facile permettant de parler normalement, idéalement à la lumière du jour.",
        precaution: "Ce n’est pas une séance cardio supplémentaire : garde une intensité basse.",
      },
      {
        nom: "Routine sommeil",
        duree: "45 min avant le coucher",
        conseil: "Lumière basse, écrans coupés, chambre fraîche et heure de coucher régulière.",
        precaution: "Si les troubles du sommeil persistent, demande conseil à un professionnel de santé.",
      },
    ],
    jours: [mobilites, mobilitesSemaine2].flatMap((semaine, semaineIndex) =>
      JOURS.map((jour, index) => ({
        jour: `Semaine ${semaineIndex + 1} · ${jour}`,
        type: joursEntrainement.has(index) ? "Jour d’entraînement" : "Jour de repos",
        photoQueryJour: semaine[index],
        mobiliteEtirements: semaine[index],
        sommeil: semaineIndex === 0
          ? "Vise 7 à 9 heures et coupe les écrans 45 minutes avant le coucher."
          : "Garde une heure de coucher stable et termine le dernier repas 2 heures avant de dormir.",
        gestionFatigue: joursEntrainement.has(index)
          ? "Hydrate-toi après la séance et garde 5 minutes de retour au calme."
          : "Marche 20 à 30 minutes à allure facile, sans chercher la performance.",
      }))
    ),
  };
}
