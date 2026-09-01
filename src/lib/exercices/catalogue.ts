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

export type Materiel = "POIDS_DU_CORPS" | "HALTERES" | "BARRE" | "MACHINE" | "ELASTIQUE" | "KETTLEBELL" | "TRX" | "MEDECINE_BALL" | "CORDE" | "BOX" | "TRAINEAU" | "TRAP_BAR";

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
  // Requête Pexels en anglais (19/08/2026, demande Anthony — même traitement
  // que les recettes) : une recherche en anglais donne des résultats de
  // stock nettement plus pertinents qu'une traduction littérale du nom
  // français de l'exercice. Reste le repli si freeExerciseDbId est absent.
  photoQuery: string;
  // Free Exercise DB (20/08/2026, retour Anthony : photos Pexels parfois
  // fausses, ex. tirage horizontal — plus une recherche par mots-clés est
  // fiable pour un exercice précis). Domaine public (Unlicense), 800+
  // exercices avec photo(s) associée(s) par un humain à l'exercice exact,
  // fichiers statiques donc aucune clé API ni résolution serveur
  // nécessaire — voir buildFreeExerciseDbPhotoUrl(). Renseigné seulement
  // quand une correspondance fiable existe (même mouvement, matériel
  // cohérent) ; sinon absent volontairement, le repli Pexels reste actif
  // plutôt que d'afficher un mouvement ou un matériel différent.
  freeExerciseDbId?: string;
};

// https://github.com/yuhonas/free-exercise-db — Unlicense (domaine public).
export function buildFreeExerciseDbPhotoUrl(id: string): string {
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${id}/0.jpg`;
}

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
  MEDECINE_BALL: "Ballon lesté",
  CORDE: "Corde",
  BOX: "Caisson",
  TRAINEAU: "Traîneau",
  TRAP_BAR: "Trap bar",
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
  { id: "tirage-horizontal-machine", nom: "Tirage horizontal (machine)", groupePrincipal: "DOS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Tire les coudes vers l'arrière en gardant le dos droit, sans t'aider de l'élan du buste.", photoQuery: "seated cable row exercise gym", freeExerciseDbId: "Seated_Cable_Rows" },
  { id: "rowing-haltere-unilateral", nom: "Rowing haltère unilatéral", groupePrincipal: "DOS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Dos plat, un genou et une main en appui sur un banc, tire l'haltère vers la hanche en gardant le coude proche du corps.", photoQuery: "single arm dumbbell row exercise", freeExerciseDbId: "One-Arm_Dumbbell_Row" },
  { id: "tirage-vertical-poulie", nom: "Tirage vertical (poulie)", groupePrincipal: "DOS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Amène la barre vers le haut de la poitrine en ouvrant les omoplates, sans basculer le buste en arrière.", photoQuery: "lat pulldown machine gym", freeExerciseDbId: "Wide-Grip_Lat_Pulldown" },
  { id: "traction-barre-fixe", nom: "Traction (barre fixe)", groupePrincipal: "DOS", materiel: ["BARRE"], type: "FORCE", niveau: "AVANCE", consigne: "Monte jusqu'à passer le menton au-dessus de la barre, redescends en contrôlant plutôt qu'en te laissant tomber.", photoQuery: "pull up bar exercise athlete", freeExerciseDbId: "Pullups" },
  { id: "superman", nom: "Superman", groupePrincipal: "DOS", materiel: ["POIDS_DU_CORPS"], type: "GAINAGE", niveau: "DEBUTANT", consigne: "Allongé sur le ventre, soulève simultanément bras et jambes tendus, sans forcer sur les lombaires.", photoQuery: "superman back exercise floor", freeExerciseDbId: "Superman" },
  // Pas de correspondance Free Exercise DB fiable (rowing spécifiquement à
  // l'élastique) — repli Pexels conservé plutôt qu'un mouvement approchant.
  { id: "rowing-elastique", nom: "Rowing élastique", groupePrincipal: "DOS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Élastique fixé devant toi, tire les poignées vers le buste en rapprochant les omoplates.", photoQuery: "resistance band row exercise" },
  { id: "rowing-trx", nom: "Rowing TRX", groupePrincipal: "DOS", materiel: ["TRX"], type: "FORCE", niveau: "DEBUTANT", consigne: "Corps gainé et incliné en arrière, tire les poignées vers les côtes en rapprochant les omoplates.", photoQuery: "trx suspension row exercise" },

  // PECTORAUX
  { id: "developpe-couche-barre", nom: "Développé couché (barre)", groupePrincipal: "PECTORAUX", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Descends la barre jusqu'à effleurer la poitrine, coudes à environ 45° du buste, pousse sans verrouiller brutalement les coudes.", photoQuery: "barbell bench press gym", freeExerciseDbId: "Barbell_Bench_Press_-_Medium_Grip" },
  { id: "developpe-couche-halteres", nom: "Développé couché haltères", groupePrincipal: "PECTORAUX", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Descends les haltères de chaque côté de la poitrine en contrôlant, pousse vers le haut sans les faire claquer entre eux.", photoQuery: "dumbbell bench press exercise", freeExerciseDbId: "Dumbbell_Bench_Press" },
  { id: "pompes", nom: "Pompes", groupePrincipal: "PECTORAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Corps gainé de la tête aux talons, descends jusqu'à ce que la poitrine frôle le sol, pousse sans casser le dos.", photoQuery: "push up exercise athlete", freeExerciseDbId: "Pushups" },
  { id: "ecarte-halteres", nom: "Écarté haltères", groupePrincipal: "PECTORAUX", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Coudes légèrement fléchis et fixes, ouvre les bras en arc de cercle jusqu'à sentir l'étirement, puis remonte.", photoQuery: "dumbbell chest fly exercise", freeExerciseDbId: "Dumbbell_Flyes" },
  { id: "dips-pectoraux", nom: "Dips", groupePrincipal: "PECTORAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "AVANCE", consigne: "Buste légèrement penché en avant, descends jusqu'à un angle de coude proche de 90°, sans forcer sur les épaules.", photoQuery: "dips exercise gym parallel bars", freeExerciseDbId: "Dips_-_Chest_Version" },
  // Aucune variante "machine" trouvée dans Free Exercise DB (seulement
  // barre) — afficher une photo barre pour un exercice filtré "machine"
  // recréerait le même type d'erreur que celle signalée. Repli Pexels.
  { id: "developpe-incline-machine", nom: "Développé incliné (machine)", groupePrincipal: "PECTORAUX", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Dos calé contre le dossier incliné, pousse devant toi sans décoller les omoplates du siège.", photoQuery: "incline chest press machine gym" },
  { id: "pompes-trx", nom: "Pompes TRX", groupePrincipal: "PECTORAUX", materiel: ["TRX"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Mains dans les poignées, garde le corps aligné puis fléchis les coudes sans laisser les sangles s'écarter.", photoQuery: "trx suspension push up exercise" },

  // EPAULES
  { id: "developpe-militaire-halteres", nom: "Développé militaire haltères", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Pousse les haltères au-dessus de la tête sans cambrer le bas du dos, redescends jusqu'aux épaules.", photoQuery: "dumbbell shoulder press exercise", freeExerciseDbId: "Dumbbell_Shoulder_Press" },
  { id: "elevations-laterales", nom: "Élévations latérales", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Lève les bras sur les côtés jusqu'à hauteur d'épaule, coudes légèrement fléchis, sans élan.", photoQuery: "lateral raise dumbbell exercise", freeExerciseDbId: "Side_Lateral_Raise" },
  { id: "elevations-frontales", nom: "Élévations frontales", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Lève un haltère devant toi jusqu'à hauteur d'épaule, redescends en contrôlant la phase de descente.", photoQuery: "front raise dumbbell exercise", freeExerciseDbId: "Front_Dumbbell_Raise" },
  { id: "rowing-menton", nom: "Rowing menton", groupePrincipal: "EPAULES", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Tire la barre vers le menton en gardant les coudes hauts et hors du buste, arrête si tu sens une gêne à l'épaule.", photoQuery: "upright row barbell exercise", freeExerciseDbId: "Standing_Dumbbell_Upright_Row" },
  { id: "face-pull-elastique", nom: "Face pull élastique", groupePrincipal: "EPAULES", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Tire l'élastique vers le visage en écartant les mains, coudes hauts, pour travailler l'arrière d'épaule.", photoQuery: "face pull resistance band exercise", freeExerciseDbId: "Face_Pull" },
  { id: "developpe-arnold", nom: "Développé Arnold", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "FORCE", niveau: "AVANCE", consigne: "Pars paumes face à toi puis tourne les poignets en poussant vers le haut, redescends dans le même mouvement inversé.", photoQuery: "arnold press dumbbell shoulder", freeExerciseDbId: "Kettlebell_Arnold_Press" },

  // BRAS
  { id: "curl-biceps-halteres", nom: "Curl biceps haltères", groupePrincipal: "BRAS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Coudes fixes le long du corps, remonte l'haltère en fléchissant seulement l'avant-bras.", photoQuery: "dumbbell bicep curl exercise", freeExerciseDbId: "Dumbbell_Bicep_Curl" },
  { id: "curl-marteau", nom: "Curl marteau", groupePrincipal: "BRAS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Paumes face à face tout le long du mouvement, remonte sans tourner le poignet.", photoQuery: "hammer curl dumbbell exercise", freeExerciseDbId: "Hammer_Curls" },
  { id: "extension-triceps-poulie", nom: "Extension triceps (poulie)", groupePrincipal: "BRAS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Coudes fixes près du buste, tends les avant-bras vers le bas sans les décoller du corps.", photoQuery: "triceps pushdown cable exercise", freeExerciseDbId: "Triceps_Pushdown" },
  { id: "dips-banc-triceps", nom: "Dips sur banc (triceps)", groupePrincipal: "BRAS", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Mains sur le bord d'un banc, descends en pliant les coudes vers l'arrière, jambes tendues pour plus d'intensité.", photoQuery: "bench dips triceps exercise", freeExerciseDbId: "Bench_Dips" },
  { id: "curl-barre-ez", nom: "Curl barre EZ", groupePrincipal: "BRAS", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Coudes fixes, remonte la barre sans balancer le buste en arrière pour t'aider.", photoQuery: "ez bar curl exercise gym", freeExerciseDbId: "EZ-Bar_Curl" },
  { id: "extension-triceps-unilaterale", nom: "Extension triceps haltère unilatérale", groupePrincipal: "BRAS", materiel: ["HALTERES"], type: "FORCE", niveau: "DEBUTANT", consigne: "Bras tendu au-dessus de la tête, descends l'haltère derrière la nuque en gardant le coude fixe.", photoQuery: "overhead triceps extension dumbbell", freeExerciseDbId: "Dumbbell_One-Arm_Triceps_Extension" },
  { id: "extension-triceps-trx", nom: "Extension triceps TRX", groupePrincipal: "BRAS", materiel: ["TRX"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Corps incliné vers l'avant, garde les coudes fixes puis tends les bras sans casser l'alignement du corps.", photoQuery: "trx suspension triceps extension" },

  // JAMBES
  { id: "squat-barre", nom: "Squat barre", groupePrincipal: "JAMBES", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Descends genoux dans l'axe des pieds, dos gainé, jusqu'à ce que les hanches passent sous les genoux si la mobilité le permet.", photoQuery: "barbell back squat gym", freeExerciseDbId: "Barbell_Squat" },
  { id: "squat-gobelet-kettlebell", nom: "Squat gobelet (kettlebell)", groupePrincipal: "JAMBES", materiel: ["KETTLEBELL"], type: "FORCE", niveau: "DEBUTANT", consigne: "Kettlebell tenue contre la poitrine, descends en gardant le buste droit, coudes entre les genoux en bas de mouvement.", photoQuery: "goblet squat kettlebell exercise", freeExerciseDbId: "Goblet_Squat" },
  { id: "fentes-avant-halteres", nom: "Fentes avant haltères", groupePrincipal: "JAMBES", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Grand pas en avant, descends jusqu'à ce que le genou arrière frôle le sol, pousse sur le talon avant pour remonter.", photoQuery: "dumbbell lunges exercise gym", freeExerciseDbId: "Dumbbell_Lunges" },
  { id: "presse-a-cuisses", nom: "Presse à cuisses (machine)", groupePrincipal: "JAMBES", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Pieds écartés largeur d'épaules sur le plateau, descends sans décoller le bas du dos de l'assise.", photoQuery: "leg press machine gym", freeExerciseDbId: "Leg_Press" },
  { id: "leg-curl-machine", nom: "Leg curl (machine)", groupePrincipal: "JAMBES", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Fléchis les jambes vers l'arrière en contrôlant la remontée, sans à-coup.", photoQuery: "leg curl machine gym", freeExerciseDbId: "Seated_Leg_Curl" },
  { id: "squat-poids-du-corps", nom: "Squat poids du corps", groupePrincipal: "JAMBES", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Descends comme pour t'asseoir sur une chaise, poids réparti sur tout le pied, genoux dans l'axe.", photoQuery: "bodyweight squat exercise athlete", freeExerciseDbId: "Bodyweight_Squat" },
  { id: "pistol-squat-assiste-trx", nom: "Pistol squat assisté TRX", groupePrincipal: "JAMBES", materiel: ["TRX"], type: "FORCE", niveau: "AVANCE", consigne: "Tiens les sangles, tends une jambe devant toi et descends sur l'autre en utilisant juste assez d'assistance pour rester stable.", photoQuery: "trx assisted pistol squat exercise" },
  { id: "fente-arriere-trx", nom: "Fente arrière TRX", groupePrincipal: "JAMBES", materiel: ["TRX"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Tiens les sangles, recule un pied et descends le genou vers le sol en gardant le buste haut et le genou avant dans l'axe.", photoQuery: "trx reverse lunge exercise" },

  // FESSIERS
  { id: "hip-thrust-barre", nom: "Hip thrust barre", groupePrincipal: "FESSIERS", materiel: ["BARRE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Dos calé sur un banc, pousse les hanches vers le haut jusqu'à l'alignement épaules-hanches-genoux, sans cambrer excessivement.", photoQuery: "barbell hip thrust exercise", freeExerciseDbId: "Barbell_Hip_Thrust" },
  { id: "pont-fessier-poids-du-corps", nom: "Pont fessier", groupePrincipal: "FESSIERS", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Allongé, pieds à plat, pousse le bassin vers le haut en serrant les fessiers en haut du mouvement.", photoQuery: "glute bridge exercise floor", freeExerciseDbId: "Single_Leg_Glute_Bridge" },
  { id: "fentes-bulgares", nom: "Fentes bulgares", groupePrincipal: "FESSIERS", materiel: ["HALTERES"], type: "FORCE", niveau: "AVANCE", consigne: "Pied arrière surélevé sur un banc, descends la jambe avant en gardant le buste droit.", photoQuery: "bulgarian split squat exercise", freeExerciseDbId: "Split_Squat_with_Dumbbells" },
  { id: "kickback-elastique", nom: "Kickback élastique", groupePrincipal: "FESSIERS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "À quatre pattes, élastique autour du pied, tends la jambe vers l'arrière sans creuser le dos.", photoQuery: "resistance band glute kickback exercise", freeExerciseDbId: "Glute_Kickback" },
  { id: "souleve-terre-roumain-halteres", nom: "Soulevé de terre roumain haltères", groupePrincipal: "FESSIERS", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Jambes presque tendues, fais glisser les haltères le long des cuisses en poussant les hanches vers l'arrière, dos plat.", photoQuery: "romanian deadlift dumbbell exercise", freeExerciseDbId: "Stiff-Legged_Dumbbell_Deadlift" },
  // Aucune correspondance "abduction" (à l'élastique ou autre) dans la base
  // — repli Pexels conservé.
  { id: "abduction-hanche-elastique", nom: "Abduction de hanche élastique", groupePrincipal: "FESSIERS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Élastique au-dessus des genoux, écarte une jambe sur le côté en gardant le bassin stable.", photoQuery: "hip abduction resistance band exercise" },

  // ABDOMINAUX
  // Mobilité et souplesse (01/09/2026) — tournées par Anthony, segments
  // extraits de routines plus longues. Aucun groupe « mobilité » n'existe
  // dans GroupePrincipal : chaque fiche est rattachée à la zone travaillée,
  // le type MOBILITE la distingue des exercices de force.
  { id: "mobilite-hanche-fente-basse", nom: "Mobilité de hanche en fente basse", groupePrincipal: "JAMBES", materiel: ["POIDS_DU_CORPS"], type: "MOBILITE", niveau: "DEBUTANT", consigne: "Genou arrière au sol, bassin qui avance doucement, buste grandi. Respire lentement sans forcer sur l'amplitude.", photoQuery: "low lunge hip flexor mobility" },
  { id: "fente-spiderman", nom: "Fente spiderman", groupePrincipal: "JAMBES", materiel: ["POIDS_DU_CORPS"], type: "MOBILITE", niveau: "DEBUTANT", consigne: "Depuis la planche, amène le pied à côté de la main, garde le bassin bas et alterne côté après côté.", photoQuery: "spiderman lunge mobility drill" },
  { id: "etirement-assis-ecarte", nom: "Étirement assis écarté", groupePrincipal: "JAMBES", materiel: ["POIDS_DU_CORPS"], type: "MOBILITE", niveau: "DEBUTANT", consigne: "Assis jambes écartées, dos long, penche-toi vers l'avant puis sur chaque jambe sans arrondir le bas du dos.", photoQuery: "seated straddle stretch athlete" },
  { id: "glissement-mural-epaules", nom: "Glissement mural épaules", groupePrincipal: "EPAULES", materiel: ["POIDS_DU_CORPS"], type: "MOBILITE", niveau: "DEBUTANT", consigne: "Dos plaqué au mur, avant-bras en contact, monte et descends les bras en gardant les poignets au mur.", photoQuery: "wall slide shoulder mobility" },
  { id: "gainage-planche", nom: "Gainage planche", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "GAINAGE", niveau: "DEBUTANT", consigne: "Corps aligné des épaules aux talons, ventre gainé, sans laisser les hanches tomber ni monter.", photoQuery: "plank exercise core athlete", freeExerciseDbId: "Plank" },
  { id: "crunch", nom: "Crunch", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "DEBUTANT", consigne: "Décolle les omoplates du sol en contractant les abdominaux, sans tirer sur la nuque avec les mains.", photoQuery: "abdominal crunch exercise floor", freeExerciseDbId: "Crunches" },
  { id: "releve-jambes-suspendu", nom: "Relevé de jambes suspendu", groupePrincipal: "ABDOMINAUX", materiel: ["TRX", "BARRE"], type: "FORCE", niveau: "AVANCE", consigne: "Suspendu à une barre ou des sangles, remonte les jambes en contrôlant, sans te balancer.", photoQuery: "hanging leg raise exercise", freeExerciseDbId: "Hanging_Leg_Raise" },
  { id: "russian-twist", nom: "Russian twist", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Buste légèrement en arrière, pivote le buste d'un côté à l'autre en gardant le dos droit.", photoQuery: "russian twist exercise core", freeExerciseDbId: "Russian_Twist" },
  { id: "gainage-lateral", nom: "Gainage latéral", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "GAINAGE", niveau: "INTERMEDIAIRE", consigne: "Appui sur un avant-bras, corps aligné sur le côté, hanches ni en avant ni en arrière.", photoQuery: "side plank exercise core", freeExerciseDbId: "Side_Bridge" },
  { id: "roue-abdominale", nom: "Roue abdominale", groupePrincipal: "ABDOMINAUX", materiel: ["POIDS_DU_CORPS"], type: "FORCE", niveau: "AVANCE", consigne: "Fais rouler la roue devant toi en gardant le dos gainé, ne descends que jusqu'où tu peux remonter en contrôle.", photoQuery: "ab wheel rollout exercise", freeExerciseDbId: "Ab_Roller" },
  { id: "montee-genou-trx", nom: "Montées de genoux TRX", groupePrincipal: "ABDOMINAUX", materiel: ["TRX"], type: "CARDIO", niveau: "DEBUTANT", consigne: "Tiens les sangles, monte alternativement chaque genou vers la poitrine sans te balancer ni arrondir le dos.", photoQuery: "trx standing knee drive exercise" },

  // MOLLETS
  { id: "mollets-debout-machine", nom: "Mollets debout (machine)", groupePrincipal: "MOLLETS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Monte sur la pointe des pieds en contractant les mollets, redescends jusqu'à un étirement léger.", photoQuery: "standing calf raise machine gym", freeExerciseDbId: "Standing_Calf_Raises" },
  { id: "mollets-assis-machine", nom: "Mollets assis (machine)", groupePrincipal: "MOLLETS", materiel: ["MACHINE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Genoux fléchis, monte sur la pointe des pieds en contrôlant chaque répétition.", photoQuery: "seated calf raise machine gym", freeExerciseDbId: "Seated_Calf_Raise" },
  { id: "mollets-halteres-unilateral", nom: "Mollets unilatéral haltère", groupePrincipal: "MOLLETS", materiel: ["HALTERES"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "En équilibre sur une marche, monte sur la pointe du pied puis descends sous le niveau de la marche pour l'amplitude.", photoQuery: "single leg calf raise exercise" },
  // Aucune corde à sauter dans la base — repli Pexels conservé.
  { id: "sauts-a-la-corde", nom: "Sauts à la corde", groupePrincipal: "MOLLETS", materiel: ["POIDS_DU_CORPS"], type: "CARDIO", niveau: "DEBUTANT", consigne: "Petits sauts sur l'avant du pied, coudes proches du corps, rythme régulier plutôt que sauts hauts.", photoQuery: "jump rope exercise athlete" },
  { id: "mollets-elastique", nom: "Mollets debout élastique", groupePrincipal: "MOLLETS", materiel: ["ELASTIQUE"], type: "FORCE", niveau: "DEBUTANT", consigne: "Élastique sous la plante du pied, pointe le pied vers le bas en résistant à la tension.", photoQuery: "calf raise resistance band exercise", freeExerciseDbId: "Calf_Raises_-_With_Bands" },
  { id: "marche-sur-pointes", nom: "Marche sur pointes", groupePrincipal: "MOLLETS", materiel: ["POIDS_DU_CORPS"], type: "MOBILITE", niveau: "DEBUTANT", consigne: "Marche sur la pointe des pieds sur une courte distance, en gardant les mollets contractés.", photoQuery: "walking on toes calf exercise" },

  // Fonctionnel — vidéos réelles tournées et validées par Anthony (25/08/2026).
  { id: "ballon-leste-dessus-epaule", nom: "Ballon lesté par-dessus l’épaule", groupePrincipal: "JAMBES", materiel: ["MEDECINE_BALL"], type: "CARDIO", niveau: "INTERMEDIAIRE", consigne: "Soulève le ballon jambes fléchies, redresse les hanches puis fais-le passer au-dessus de l’épaule sans arrondir le dos.", photoQuery: "medicine ball over shoulder exercise" },
  { id: "devil-press-halteres", nom: "Devil press haltères", groupePrincipal: "EPAULES", materiel: ["HALTERES"], type: "CARDIO", niveau: "AVANCE", consigne: "Enchaîne un burpee mains sur haltères puis une extension complète au-dessus de la tête, avec un dos gainé.", photoQuery: "devil press dumbbells exercise" },
  { id: "windmill-haltere", nom: "Windmill haltère", groupePrincipal: "ABDOMINAUX", materiel: ["HALTERES"], type: "MOBILITE", niveau: "INTERMEDIAIRE", consigne: "Garde le bras chargé vertical, pousse la hanche sur le côté et descends la main libre en suivant la jambe.", photoQuery: "dumbbell windmill exercise" },
  { id: "cordes-ondulees-alternees", nom: "Cordes ondulatoires alternées", groupePrincipal: "BRAS", materiel: ["CORDE"], type: "CARDIO", niveau: "DEBUTANT", consigne: "Genoux souples et buste gainé, crée des vagues régulières en alternant rapidement les bras.", photoQuery: "alternating battle ropes exercise" },
  { id: "cordes-ondulees-doubles", nom: "Cordes ondulatoires doubles", groupePrincipal: "BRAS", materiel: ["CORDE"], type: "CARDIO", niveau: "INTERMEDIAIRE", consigne: "Fais monter puis claquer les deux cordes ensemble en gardant une position athlétique stable.", photoQuery: "double battle ropes exercise" },
  { id: "box-jump", nom: "Box jump", groupePrincipal: "JAMBES", materiel: ["BOX"], type: "CARDIO", niveau: "INTERMEDIAIRE", consigne: "Saute sur le caisson, réceptionne-toi avec les genoux dans l’axe puis redresse-toi avant de redescendre.", photoQuery: "box jump exercise" },
  { id: "souleve-terre-trap-bar", nom: "Soulevé de terre trap bar", groupePrincipal: "JAMBES", materiel: ["TRAP_BAR"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Pousse le sol avec les jambes, poitrine haute et dos neutre, jusqu’à te tenir droit sans tirer avec le bas du dos.", photoQuery: "trap bar deadlift exercise" },
  { id: "poussee-traineau", nom: "Poussée de traîneau", groupePrincipal: "JAMBES", materiel: ["TRAINEAU"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Bras tendus, buste incliné et tronc gainé, pousse avec des pas courts et puissants.", photoQuery: "sled push exercise" },
  { id: "tirage-traineau-corde", nom: "Tirage de traîneau à la corde", groupePrincipal: "DOS", materiel: ["TRAINEAU", "CORDE"], type: "FORCE", niveau: "INTERMEDIAIRE", consigne: "Reste stable, tire la corde main après main vers le buste et garde les épaules basses.", photoQuery: "sled rope pull exercise" },
  { id: "burpee-saut-longueur", nom: "Burpee avec saut en longueur", groupePrincipal: "JAMBES", materiel: ["POIDS_DU_CORPS"], type: "CARDIO", niveau: "AVANCE", consigne: "Après le burpee, projette-toi vers l’avant et réceptionne-toi souplement avant la répétition suivante.", photoQuery: "burpee broad jump exercise" },
  { id: "marche-fermier-kettlebells", nom: "Marche du fermier kettlebells", groupePrincipal: "BRAS", materiel: ["KETTLEBELL"], type: "FORCE", niveau: "DEBUTANT", consigne: "Marche droit, épaules basses et prises fermes, sans laisser les charges te faire pencher.", photoQuery: "kettlebell farmers walk exercise" },
];
