// Catalogue d'exercices filtrable (19/08/2026, chantier demandé par
// Anthony), inspiré de l'audit MyFitCoach : les exercices d'un programme
// utilisateur restent générés dynamiquement par l'IA (cf.
// src/lib/ai/prompts/programme-entrainement-*.ts, inchangé) — ce catalogue
// est une fonctionnalité séparée et statique : une bibliothèque de
// référence que l'utilisateur peut parcourir librement, indépendamment de
// son programme du jour.
//
// Première liste "seed" (48 exercices, 6 par groupe musculaire) rédigée à
// partir de repères de technique standards et largement documentés — à
// relire et enrichir par Anthony avant mise en avant massive (cf. note
// CLAUDE.md du 19/08/2026). Aucune statistique ni témoignage inventé,
// contrairement à MyFitCoach : uniquement des repères de mouvement.

export type GroupePrincipal =
  | "DOS"
  | "PECTORAUX"
  | "EPAULES"
  | "BRAS"
  | "JAMBES"
  | "FESSIERS"
  | "ABDOMINAUX"
  | "MOLLETS";

export type Materiel = "POIDS_DU_CORPS" | "HALTERES" | "BARRE" | "MACHINE" | "ELASTIQUE" | "KETTLEBELL" | "TRX";

export type TypeExercice = "FORCE" | "GAINAGE" | "MOBILITE" | "CARDIO";

export type NiveauExercice = "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE";

export type Exercice = {
  id: string;
  nom: string;
  groupePrincipal: GroupePrincipal;
  materiel: Materiel[];
  type: TypeExercice;
  niveau: NiveauExercice;
  consigne: string;
};

export const GROUPE_PRINCIPAL_LABEL: Record<GroupePrincipal, string> = {
  DOS: "Dos",
  PECTORAUX: "Pectoraux",
  EPAULES: "Épaules",
  BRAS: "Bras",
  JAMBES: "Jambes",
  FESSIERS: "Fessiers",
  ABDOMINAUX: "Abdominaux",
  MOLLETS: "Mollets",
};

export const MATERIEL_LABEL: Record<Materiel, string> = {
  POIDS_DU_CORPS: "Poids du corps",
  HALTERES: "Haltères",
  BARRE: "Barre",
  MACHINE: "Machine",
  ELASTIQUE: "Élastique",
  KETTLEBELL: "Kettlebell",
  TRX: "TRX / sangles",
};

export const TYPE_LABEL: Record<TypeExercice, string> = {
  FORCE: "Force",
  GAINAGE: "Gainage",
  MOBILITE: "Mobilité",
  CARDIO: "Cardio",
};

export const NIVEAU_EXERCICE_LABEL: Record<NiveauExercice, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
};

export const EXERCICES: Exercice[] = [
  // DOS
  { id: "tirage-horizontal-machine", nom: "Tirage horizontal (machine)", groupePrincipal: "DOS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Tire les coudes vers l'arrière en gardant le dos droit, sans t'aider de l'élan du buste." },
  { id: "rowing-haltere-unilateral", nom: "Rowing haltère unilatéral", groupePrincipal: "DOS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Dos plat, un genou et une main en appui sur un banc, tire l'haltère vers la hanche en gardant le coude proche du corps." },
  { id: "tirage-vertical-poulie", nom: "Tirage vertical (poulie)", groupePrincipal: "DOS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Amène la barre vers le haut de la poitrine en ouvrant les omoplates, sans basculer le buste en arrière." },
  { id: "traction-barre-fixe", nom: "Traction (barre fixe)", groupePrincipal: "DOS", materiel: ["BARRE"], type: "FORCE", niveau: "AVANCE", consigne: "Monte jusqu'à passer le menton au-dessus de la barre, redescends en contrôlant plutôt qu'en te laissant tomber." },
  { id: "superman", nom: "Superman", groupePrincipal: "DOS", materiel: ["POIDS_DU_CORPS"], type: "GAINAGE", niveau: "DEBUTANT", consigne: "Allongé sur le ventre, soulève simultanément bras et jambes tendus, sans forcer sur les lombaires." },
  { id: "rowing-elastique", nom: "Rowing élastique", groupePrincipal: "DOS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Élastique fixé devant toi, tire les poignées vers le buste en rapprochant les omoplates." },

  // PECTORAUX
  { id: "developpe-couche-barre", nom: "Développé couché (barre)", groupePrincipal: "PECTORAUX", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Descends la barre jusqu'à effleurer la poitrine, coudes à environ 45° du buste, pousse sans verrouiller brutalement les coudes." },
  { id: "developpe-couche-halteres", nom: "Développé couché haltères", groupePrincipal: "PECTORAUX", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Descends les haltères de chaque côté de la poitrine en contrôlant, pousse vers le haut sans les faire claquer entre eux." },
  { id: "pompes", nom: "Pompes", groupePrincipal: "PECTORAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Corps gainé de la tête aux talons, descends jusqu'à ce que la poitrine frôle le sol, pousse sans casser le dos." },
  { id: "ecarte-halteres", nom: "Écarté haltères", groupePrincipal: "PECTORAUX", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Coudes légèrement fléchis et fixes, ouvre les bras en arc de cercle jusqu'à sentir l'étirement, puis remonte." },
  { id: "dips-pectoraux", nom: "Dips", groupePrincipal: "PECTORAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "AVANCE", consigne: "Buste légèrement penché en avant, descends jusqu'à un angle de coude proche de 90°, sans forcer sur les épaules." },
  { id: "developpe-incline-machine", nom: "Développé incliné (machine)", groupePrincipal: "PECTORAUX", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Dos calé contre le dossier incliné, pousse devant toi sans décoller les omoplates du siège." },

  // EPAULES
  { id: "developpe-militaire-halteres", nom: "Développé militaire haltères", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Pousse les haltères au-dessus de la tête sans cambrer le bas du dos, redescends jusqu'aux épaules." },
  { id: "elevations-laterales", nom: "Élévations latérales", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Lève les bras sur les côtés jusqu'à hauteur d'épaule, coudes légèrement fléchis, sans élan." },
  { id: "elevations-frontales", nom: "Élévations frontales", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Lève un haltère devant toi jusqu'à hauteur d'épaule, redescends en contrôlant la phase de descente." },
  { id: "rowing-menton", nom: "Rowing menton", groupePrincipal: "EPAULES", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Tire la barre vers le menton en gardant les coudes hauts et hors du buste, arrête si tu sens une gêne à l'épaule." },
  { id: "face-pull-elastique", nom: "Face pull élastique", groupePrincipal: "EPAULES", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Tire l'élastique vers le visage en écartant les mains, coudes hauts, pour travailler l'arrière d'épaule." },
  { id: "developpe-arnold", nom: "Développé Arnold", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "AVANCE", consigne: "Pars paumes face à toi puis tourne les poignets en poussant vers le haut, redescends dans le même mouvement inversé." },

  // BRAS
  { id: "curl-biceps-halteres", nom: "Curl biceps haltères", groupePrincipal: "BRAS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Coudes fixes le long du corps, remonte l'haltère en fléchissant seulement l'avant-bras." },
  { id: "curl-marteau", nom: "Curl marteau", groupePrincipal: "BRAS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Paumes face à face tout le long du mouvement, remonte sans tourner le poignet." },
  { id: "extension-triceps-poulie", nom: "Extension triceps (poulie)", groupePrincipal: "BRAS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Coudes fixes près du buste, tends les avant-bras vers le bas sans les décoller du corps." },
  { id: "dips-banc-triceps", nom: "Dips sur banc (triceps)", groupePrincipal: "BRAS", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Mains sur le bord d'un banc, descends en pliant les coudes vers l'arrière, jambes tendues pour plus d'intensité." },
  { id: "curl-barre-ez", nom: "Curl barre EZ", groupePrincipal: "BRAS", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Coudes fixes, remonte la barre sans balancer le buste en arrière pour t'aider." },
  { id: "extension-triceps-unilaterale", nom: "Extension triceps haltère unilatérale", groupePrincipal: "BRAS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Bras tendu au-dessus de la tête, descends l'haltère derrière la nuque en gardant le coude fixe." },

  // JAMBES
  { id: "squat-barre", nom: "Squat barre", groupePrincipal: "JAMBES", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Descends genoux dans l'axe des pieds, dos gainé, jusqu'à ce que les hanches passent sous les genoux si la mobilité le permet." },
  { id: "squat-gobelet-kettlebell", nom: "Squat gobelet (kettlebell)", groupePrincipal: "JAMBES", materiel: ["KETTLEBELL"], type: "FORCE", niveau: "DEBUTANT", consigne: "Kettlebell tenue contre la poitrine, descends en gardant le buste droit, coudes entre les genoux en bas de mouvement." },
  { id: "fentes-avant-halteres", nom: "Fentes avant haltères", groupePrincipal: "JAMBES", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Grand pas en avant, descends jusqu'à ce que le genou arrière frôle le sol, pousse sur le talon avant pour remonter." },
  { id: "presse-a-cuisses", nom: "Presse à cuisses (machine)", groupePrincipal: "JAMBES", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Pieds écartés largeur d'épaules sur le plateau, descends sans décoller le bas du dos de l'assise." },
  { id: "leg-curl-machine", nom: "Leg curl (machine)", groupePrincipal: "JAMBES", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Fléchis les jambes vers l'arrière en contrôlant la remontée, sans à-coup." },
  { id: "squat-poids-du-corps", nom: "Squat poids du corps", groupePrincipal: "JAMBES", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Descends comme pour t'asseoir sur une chaise, poids réparti sur tout le pied, genoux dans l'axe." },

  // FESSIERS
  { id: "hip-thrust-barre", nom: "Hip thrust barre", groupePrincipal: "FESSIERS", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Dos calé sur un banc, pousse les hanches vers le haut jusqu'à l'alignement épaules-hanches-genoux, sans cambrer excessivement." },
  { id: "pont-fessier-poids-du-corps", nom: "Pont fessier", groupePrincipal: "FESSIERS", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Allongé, pieds à plat, pousse le bassin vers le haut en serrant les fessiers en haut du mouvement." },
  { id: "fentes-bulgares", nom: "Fentes bulgares", groupePrincipal: "FESSIERS", materiel: ["HALTERES"], type: "FORCE", niveau: "AVANCE", consigne: "Pied arrière surélevé sur un banc, descends la jambe avant en gardant le buste droit." },
  { id: "kickback-elastique", nom: "Kickback élastique", groupePrincipal: "FESSIERS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "À quatre pattes, élastique autour du pied, tends la jambe vers l'arrière sans creuser le dos." },
  { id: "souleve-terre-roumain-halteres", nom: "Soulevé de terre roumain haltères", groupePrincipal: "FESSIERS", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Jambes presque tendues, fais glisser les haltères le long des cuisses en poussant les hanches vers l'arrière, dos plat." },
  { id: "abduction-hanche-elastique", nom: "Abduction de hanche élastique", groupePrincipal: "FESSIERS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Élastique au-dessus des genoux, écarte une jambe sur le côté en gardant le bassin stable." },

  // ABDOMINAUX
  { id: "gainage-planche", nom: "Gainage planche", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "GAINAGE", niveau: "DEBUTANT", consigne: "Corps aligné des épaules aux talons, ventre gainé, sans laisser les hanches tomber ni monter." },
  { id: "crunch", nom: "Crunch", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Décolle les omoplates du sol en contractant les abdominaux, sans tirer sur la nuque avec les mains." },
  { id: "releve-jambes-suspendu", nom: "Relevé de jambes suspendu", groupePrincipal: "ABDOMINAUX", materiel: ["TRX", "BARRE"], type: "FORCE", niveau: "AVANCE", consigne: "Suspendu à une barre ou des sangles, remonte les jambes en contrôlant, sans te balancer." },
  { id: "russian-twist", nom: "Russian twist", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Buste légèrement en arrière, pivote le buste d'un côté à l'autre en gardant le dos droit." },
  { id: "gainage-lateral", nom: "Gainage latéral", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "GAINAGE", niveau: "INTERMEDIAIRE", consigne: "Appui sur un avant-bras, corps aligné sur le côté, hanches ni en avant ni en arrière." },
  { id: "roue-abdominale", nom: "Roue abdominale", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "AVANCE", consigne: "Fais rouler la roue devant toi en gardant le dos gainé, ne descends que jusqu'où tu peux remonter en contrôle." },

  // MOLLETS
  { id: "mollets-debout-machine", nom: "Mollets debout (machine)", groupePrincipal: "MOLLETS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Monte sur la pointe des pieds en contractant les mollets, redescends jusqu'à un étirement léger." },
  { id: "mollets-assis-machine", nom: "Mollets assis (machine)", groupePrincipal: "MOLLETS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Genoux fléchis, monte sur la pointe des pieds en contrôlant chaque répétition." },
  { id: "mollets-halteres-unilateral", nom: "Mollets unilatéral haltère", groupePrincipal: "MOLLETS", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "En équilibre sur une marche, monte sur la pointe du pied puis descends sous le niveau de la marche pour l'amplitude." },
  { id: "sauts-a-la-corde", nom: "Sauts à la corde", groupePrincipal: "MOLLETS", materiel: ["POIDS_DU_CORPS"], type: "CARDIO", niveau: "DEBUTANT", consigne: "Petits sauts sur l'avant du pied, coudes proches du corps, rythme régulier plutôt que sauts hauts." },
  { id: "mollets-elastique", nom: "Mollets debout élastique", groupePrincipal: "MOLLETS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Élastique sous la plante du pied, pointe le pied vers le bas en résistant à la tension." },
  { id: "marche-sur-pointes", nom: "Marche sur pointes", groupePrincipal: "MOLLETS", materiel: ["POIDS_DU_CORPS"], type: "MOBILITE", niveau: "DEBUTANT", consigne: "Marche sur la pointe des pieds sur une courte distance, en gardant les mollets contractés." },
];
