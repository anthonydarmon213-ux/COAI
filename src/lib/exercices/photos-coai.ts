// Photos d'exercices produites pour COAI (23/08/2026, fournies par Anthony).
//
// Prioritaires sur Free Exercise DB et sur Pexels : ce sont les seules
// photos tournées dans la charte de la marque (fond noir, tenue unie,
// éclairage latéral), et la seule source dont l'exercice est garanti par
// le nom du fichier plutôt que déduit par rapprochement de mots.
//
// Chaque photo a été ouverte et vérifiée une par une avant intégration —
// notamment le crunch, où une flexion de hanche complète aurait fait
// travailler les psoas au lieu des abdominaux.
//
// Servies depuis /public/exercices : redimensionnées à 900px de large et
// converties en JPEG (18 Mo de PNG → 356 Ko au total), sans quoi la page
// aurait chargé plusieurs mégaoctets pour des vignettes.

type EntreePhoto = { motifs: string[]; fichier: string };

const TABLE: EntreePhoto[] = [
  // Yoga & Pilates (24/08/2026) — modèle féminin blond, même studio COAI.
  // Ces motifs spécifiques restent avant « planche » et les autres motifs
  // génériques afin de ne jamais afficher une photo de musculation à la place.
  { motifs: ["salutation au soleil", "surya namaskar"], fichier: "yoga-01-salutation-au-soleil" },
  { motifs: ["chien tête en bas", "chien tete en bas", "adho mukha", "downward dog"], fichier: "yoga-02-chien-tete-en-bas" },
  { motifs: ["guerrier ii", "virabhadrasana ii", "warrior ii"], fichier: "yoga-03-guerrier-ii" },
  { motifs: ["posture de l'arbre", "arbre yoga", "vrksasana", "tree pose"], fichier: "yoga-04-arbre" },
  { motifs: ["cobra", "bhujangasana"], fichier: "yoga-05-cobra" },
  { motifs: ["triangle yoga", "trikonasana", "triangle pose"], fichier: "yoga-06-triangle" },
  { motifs: ["pigeon yoga", "eka pada rajakapotasana", "pigeon pose"], fichier: "yoga-07-pigeon" },
  { motifs: ["savasana", "relaxation finale yoga", "corpse pose"], fichier: "yoga-08-savasana" },

  { motifs: ["the hundred", "hundred pilates"], fichier: "pilates-01-the-hundred" },
  { motifs: ["roll-up", "roll up pilates"], fichier: "pilates-02-roll-up" },
  { motifs: ["plank pilates", "planche pilates", "pilates plank"], fichier: "pilates-03-plank-pilates" },
  { motifs: ["teaser pilates", "pilates teaser"], fichier: "pilates-04-teaser" },
  { motifs: ["side-lying leg lift", "side lying leg lift", "élévation jambe latérale pilates", "elevation jambe laterale pilates"], fichier: "pilates-05-side-lying-leg-lift" },
  { motifs: ["swimming pilates", "pilates swimming"], fichier: "pilates-06-swimming" },
  { motifs: ["bridge pilates", "pont pilates", "pilates bridge"], fichier: "pilates-07-bridge-pont-pilates" },
  { motifs: ["spine stretch forward", "étirement colonne pilates", "etirement colonne pilates"], fichier: "pilates-08-spine-stretch-forward" },

  // Compléments parité & catalogue (25/08/2026) — nouveaux visuels COAI
  // générés dans la même DA premium. Les noms exacts du catalogue passent
  // avant les motifs plus larges (« rowing », « tirage », « curl », etc.).
  { motifs: ["tirage horizontal (machine)", "tirage horizontal machine", "seated cable row"], fichier: "tirage-horizontal-machine" },
  { motifs: ["tirage vertical (poulie)", "tirage vertical poulie", "lat pulldown"], fichier: "tirage-vertical-poulie" },
  { motifs: ["curl marteau", "hammer curl"], fichier: "curl-marteau-homme-blond" },
  { motifs: ["presse à cuisses (machine)", "presse a cuisses machine", "leg press"], fichier: "presse-a-cuisses-machine" },
  { motifs: ["hip thrust barre", "barbell hip thrust"], fichier: "hip-thrust-barre" },
  { motifs: ["rowing haltère unilatéral", "rowing haltere unilateral", "one arm dumbbell row", "single arm dumbbell row"], fichier: "rowing-haltere-unilateral-homme-arabe" },
  { motifs: ["traction à la barre fixe", "traction a la barre fixe", "tractions barre fixe", "pull-up", "pull up"], fichier: "traction-barre-fixe-femme-blonde" },
  { motifs: ["rowing à l'élastique", "rowing a l'elastique", "rowing élastique", "rowing elastique", "resistance band row"], fichier: "rowing-elastique-homme-blond" },
  { motifs: ["pompes", "pompe au sol", "push-up", "push up"], fichier: "pompes-femme-eurasienne" },

  { motifs: ["fentes avant", "fente avant", "fentes haltères", "lunge"], fichier: "fentes-avant-halteres" },
  { motifs: ["leg curl", "ischio"], fichier: "leg-curl-allonge" },
  { motifs: ["fentes bulgares", "fente bulgare", "bulgarian split", "split squat"], fichier: "fentes-bulgares" },
  { motifs: ["kickback"], fichier: "kickback-fessier-elastique" },
  { motifs: ["abduction"], fichier: "abduction-hanche-elastique" },
  // "gainage latéral" avant "gainage planche" : sans cet ordre, le motif
  // "gainage" du second capterait aussi le latéral, qui est un autre
  // exercice (appui sur un seul avant-bras, obliques).
  { motifs: ["gainage latéral", "gainage lateral", "side plank"], fichier: "gainage-lateral" },
  { motifs: ["gainage planche", "planche", "plank"], fichier: "gainage-planche" },
  { motifs: ["crunch"], fichier: "crunch-au-sol" },
  { motifs: ["relevé de jambes", "releve de jambes", "hanging leg raise"], fichier: "releve-jambes-suspendu" },
  { motifs: ["russian twist"], fichier: "russian-twist" },
  { motifs: ["roue abdominale", "ab wheel", "ab roller"], fichier: "roue-abdominale" },

  // Second lot (23/08/2026) — 14 photos COAI supplémentaires. L'ordre
  // compte autant que dans le premier lot : les motifs les plus
  // spécifiques passent avant les génériques qui les captureraient.
  { motifs: ["superman"], fichier: "superman-au-sol" },
  { motifs: ["écarté", "ecarte", "chest fly", "pec deck", "butterfly"], fichier: "ecarte-halteres-banc-plat" },
  // "dips sur banc" avant "dips" : le premier travaille les triceps, le
  // second les pectoraux — deux exercices et deux photos distinctes.
  { motifs: ["dips sur banc", "dips banc", "bench dips"], fichier: "dips-banc-triceps" },
  { motifs: ["dips"], fichier: "dips-pectoraux" },
  { motifs: ["développé incliné", "developpe incline", "incline press"], fichier: "developpe-incline-machine" },
  { motifs: ["développé arnold", "developpe arnold", "arnold press"], fichier: "developpe-arnold" },
  { motifs: ["développé militaire", "developpe militaire", "shoulder press", "overhead press"], fichier: "developpe-militaire-halteres" },
  { motifs: ["élévations latérales", "elevations laterales", "lateral raise"], fichier: "elevations-laterales" },
  { motifs: ["élévations frontales", "elevations frontales", "front raise"], fichier: "elevations-frontales" },
  { motifs: ["rowing menton", "upright row"], fichier: "rowing-menton" },
  { motifs: ["face pull"], fichier: "face-pull-elastique" },
  // Extension triceps : la variante au-dessus de la tête d'abord, sinon le
  // motif "extension triceps" de la poulie capterait les deux.
  { motifs: ["extension triceps haltère", "extension triceps haltere", "au-dessus de la tête", "overhead triceps"], fichier: "extension-triceps-dessus-tete" },
  { motifs: ["extension triceps", "triceps poulie", "pushdown"], fichier: "extension-triceps-poulie" },
  { motifs: ["sauts à la corde", "sauts a la corde", "corde à sauter", "corde a sauter", "jump rope"], fichier: "sauts-corde" },

  // Troisième lot (24/08/2026) — mobilité, Hyrox, suspension, kettlebell.
  // Ces familles n'existaient pas encore dans le catalogue : les photos
  // arrivent avant les exercices, pour que la génération des programmes
  // socles puisse déjà s'appuyer dessus.

  // MOBILITÉ
  { motifs: ["chat-vache", "chat vache", "cat cow"], fichier: "mobilite-chat-vache-flexion" },
  { motifs: ["rotation thoracique"], fichier: "mobilite-rotation-thoracique-allongee" },
  { motifs: ["fente basse", "ouverture de hanche", "ouverture hanche"], fichier: "mobilite-fente-basse-ouverture-hanche" },
  { motifs: ["étirement ischio", "etirement ischio"], fichier: "mobilite-etirement-ischio-debout-banc" },
  { motifs: ["posture de l'enfant", "posture enfant", "child pose"], fichier: "mobilite-posture-enfant" },
  { motifs: ["étirement pectoraux", "etirement pectoraux"], fichier: "mobilite-etirement-pectoraux-cadre-porte" },
  { motifs: ["étirement fessier", "etirement fessier"], fichier: "mobilite-etirement-fessier-assis" },
  { motifs: ["mobilité cheville", "mobilite cheville"], fichier: "mobilite-cheville-fente" },
  { motifs: ["ouverture d'épaules", "ouverture epaules", "épaules bâton"], fichier: "mobilite-ouverture-epaules-baton" },
  { motifs: ["psoas"], fichier: "mobilite-etirement-psoas-fente" },

  // HYROX / FONCTIONNEL
  { motifs: ["burpee"], fichier: "hyrox-burpee-position-basse" },
  { motifs: ["mountain climber", "grimpeur"], fichier: "hyrox-mountain-climber" },
  { motifs: ["wall ball"], fichier: "hyrox-wall-ball" },

  // SUSPENSION / TRX — avant les motifs génériques du même mouvement, sinon
  // "rowing" ou "squat" captureraient la version chargée.
  { motifs: ["rowing trx", "rowing suspension", "rowing sangles"], fichier: "suspension-rowing" },
  { motifs: ["pompes trx", "pompes suspension"], fichier: "suspension-pompes" },
  { motifs: ["squat trx", "squat suspension"], fichier: "suspension-squat" },
  { motifs: ["fente trx", "fente suspension", "fente arrière trx"], fichier: "suspension-fente-arriere" },
  { motifs: ["curl trx", "curl suspension"], fichier: "suspension-curl-biceps" },
  { motifs: ["extension triceps trx", "triceps suspension"], fichier: "suspension-extension-triceps" },
  { motifs: ["gainage trx", "planche trx", "gainage suspension"], fichier: "suspension-gainage-planche" },
  { motifs: ["curl ischio trx", "ischio suspension", "curl ischio glissé"], fichier: "suspension-curl-ischio" },

  // FORCE BARRE & HALTÈRES (24/08/2026) — développés, deadlifts, squats.
  // Les variantes spécifiques passent avant les motifs génériques.

  // Développés — "décliné" et "incliné barre" avant "incliné" générique,
  // "couché haltères" avant "couché" seul.
  { motifs: ["développé décliné", "developpe decline", "decline press"], fichier: "developpe-decline-barre" },
  { motifs: ["développé incliné barre", "developpe incline barre", "incline barbell"], fichier: "developpe-incline-barre" },
  { motifs: ["développé incliné haltères", "developpe incline halteres", "incline dumbbell"], fichier: "developpe-incline-halteres" },
  { motifs: ["développé couché haltères", "developpe couche halteres", "dumbbell bench"], fichier: "developpe-couche-halteres" },
  { motifs: ["développé couché", "developpe couche", "bench press"], fichier: "developpe-couche-barre" },

  // Deadlifts — "roumain unilatéral" avant "roumain", "sumo" avant générique.
  { motifs: ["deadlift roumain unilatéral", "deadlift roumain unilateral", "single leg rdl", "rdl unilatéral"], fichier: "deadlift-roumain-unilateral" },
  { motifs: ["deadlift roumain haltères", "deadlift roumain halteres", "soulevé de terre roumain haltères", "souleve de terre roumain halteres", "rdl haltères", "rdl halteres"], fichier: "deadlift-roumain-halteres" },
  { motifs: ["deadlift roumain", "rdl", "soulevé de terre roumain", "romanian deadlift"], fichier: "deadlift-roumain" },
  { motifs: ["deadlift sumo", "soulevé de terre sumo", "sumo deadlift"], fichier: "deadlift-sumo" },
  { motifs: ["trap bar", "hex bar", "barre hexagonale"], fichier: "deadlift-trap-bar" },
  { motifs: ["deadlift", "soulevé de terre"], fichier: "deadlift-conventionnel" },

  // Squats barre — "front squat" avant "squat" générique, variantes rares en fin.
  { motifs: ["box squat"], fichier: "box-squat-barre" },
  { motifs: ["overhead squat", "squat au-dessus de la tête"], fichier: "overhead-squat-barre" },
  { motifs: ["zercher squat", "zercher"], fichier: "zercher-squat-barre" },
  { motifs: ["hack squat"], fichier: "hack-squat-machine" },
  { motifs: ["front squat"], fichier: "front-squat-barre" },
  { motifs: ["back squat", "squat barre", "squat arrière"], fichier: "back-squat-barre" },

  // KETTLEBELL — "goblet squat" avant "squat", "swing" avant tout.
  { motifs: ["kettlebell swing", "swing kettlebell", "swing"], fichier: "kettlebell-swing" },
  { motifs: ["goblet squat", "squat gobelet"], fichier: "kettlebell-goblet-squat" },
  { motifs: ["turkish get-up", "turkish getup", "get-up turc"], fichier: "kettlebell-turkish-get-up" },
  { motifs: ["clean kettlebell", "kettlebell clean", "position rack"], fichier: "kettlebell-clean-rack" },
  { motifs: ["snatch"], fichier: "kettlebell-snatch" },
  { motifs: ["fente rack", "fente kettlebell"], fichier: "kettlebell-fente-rack" },
  { motifs: ["rowing kettlebell", "kettlebell rowing"], fichier: "kettlebell-rowing-penche" },
  { motifs: ["halo"], fichier: "kettlebell-halo" },
  { motifs: ["soulevé de terre kettlebell", "kettlebell deadlift"], fichier: "kettlebell-souleve-de-terre" },
  { motifs: ["press kettlebell", "kettlebell press"], fichier: "kettlebell-press-debout" },
];

/**
 * Photo COAI pour un exercice, ou null si aucune ne lui correspond
 * exactement. Aucun visuel générique ne doit être utilisé en remplacement.
 */
export function photoCoaiPourNom(nom: string): string | null {
  const normalise = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const entree = TABLE.find((e) =>
    e.motifs.some((m) => normalise.includes(m.normalize("NFD").replace(/[̀-ͯ]/g, "")))
  );
  return entree ? `/exercices/${entree.fichier}.jpg` : null;
}
