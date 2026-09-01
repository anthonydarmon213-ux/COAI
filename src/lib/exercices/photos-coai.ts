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

export type GenreVisuel = "femme" | "homme";

type EntreeVariante = EntreePhoto & {
  femme?: string;
  homme?: string;
};

// Variantes de modèle vérifiées pour un même mouvement. Les visuels homme
// TRX sont des arrêts sur image extraits des vidéos réelles validées par
// Anthony : aucune pose générée ou techniquement approximative.
const VARIANTES: EntreeVariante[] = [
  { motifs: ["rowing trx", "rowing suspension", "rowing sangles"], femme: "suspension-rowing", homme: "trx-rowing-homme-coai", fichier: "suspension-rowing" },
  { motifs: ["pompes trx", "pompes suspension"], femme: "suspension-pompes", homme: "trx-pompes-homme-coai", fichier: "suspension-pompes" },
  { motifs: ["planche dynamique trx", "planche dynamique au trx", "gainage dynamique trx", "planche trx", "gainage trx", "gainage suspension"], femme: "suspension-gainage-planche", homme: "suspension-gainage-planche", fichier: "suspension-gainage-planche" },
  { motifs: ["fente arrière trx", "fente arriere trx", "fente trx", "fente suspension"], femme: "suspension-fente-arriere", homme: "trx-fente-arriere-homme-coai", fichier: "suspension-fente-arriere" },
  { motifs: ["pistol squat assisté trx", "pistol squat assiste trx", "pistol squat trx"], femme: "trx-pistol-squat-femme-coai", homme: "trx-pistol-squat-homme-coai", fichier: "trx-pistol-squat-homme-coai" },
  { motifs: ["montées de genoux trx", "montees de genoux trx", "montée de genou trx", "montee de genou trx"], femme: "trx-montee-genou-femme-coai", homme: "trx-montee-genou-homme-coai", fichier: "trx-montee-genou-homme-coai" },
];

const TABLE: EntreePhoto[] = [
  // Arrêts sur image issus des vidéos réelles : le visuel correspond donc
  // exactement au mouvement montré, sans photo de stock approximative.
  { motifs: ["ballon lesté par-dessus l'épaule", "ballon leste par-dessus l'epaule"], fichier: "medecine-ball-par-dessus-epaule" },
  { motifs: ["devil press"], fichier: "devil-press-halteres" },
  { motifs: ["windmill haltère", "windmill haltere"], fichier: "windmill-haltere" },
  { motifs: ["cordes ondulatoires alternées", "cordes ondulatoires alternees"], fichier: "cordes-ondulatoires-alternees" },
  { motifs: ["cordes ondulatoires doubles"], fichier: "cordes-ondulatoires-doubles" },
  { motifs: ["sauts à la corde", "sauts a la corde"], fichier: "sauts-corde-reel" },
  { motifs: ["box jump", "saut sur caisson"], fichier: "box-jump" },
  { motifs: ["soulevé de terre trap bar", "souleve de terre trap bar"], fichier: "souleve-terre-trap-bar" },
  { motifs: ["poussée de traîneau", "poussee de traineau"], fichier: "poussee-traineau" },
  { motifs: ["tirage de traîneau à la corde", "tirage de traineau a la corde"], fichier: "tirage-traineau-corde" },
  { motifs: ["burpee avec saut en longueur", "burpee broad jump"], fichier: "burpee-saut-longueur" },
  { motifs: ["marche du fermier kettlebells", "farmer walk kettlebells"], fichier: "marche-fermier-kettlebells" },

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
  { motifs: ["guerrier iii", "virabhadrasana iii", "warrior iii"], fichier: "yoga-10-guerrier-iii-homme" },
  { motifs: ["guerrier i", "virabhadrasana i", "warrior i"], fichier: "yoga-09-guerrier-i-femme" },
  { motifs: ["posture de la chaise", "chaise yoga", "utkatasana", "chair pose"], fichier: "yoga-11-chaise-femme" },
  { motifs: ["demi-lune", "demi lune yoga", "ardha chandrasana", "half moon pose"], fichier: "yoga-12-demi-lune-homme" },
  { motifs: ["posture de l'aigle", "aigle yoga", "garudasana", "eagle pose"], fichier: "yoga-13-aigle-homme" },
  { motifs: ["posture du chameau", "chameau yoga", "ustrasana", "camel pose"], fichier: "yoga-14-chameau-femme" },
  { motifs: ["posture du poisson", "poisson yoga", "matsyasana", "fish pose"], fichier: "yoga-15-poisson-homme" },
  { motifs: ["flexion avant jambes écartées", "flexion avant jambes ecartees", "prasarita padottanasana", "wide-legged forward fold"], fichier: "yoga-16-flexion-avant-jambes-ecartees-femme" },

  { motifs: ["the hundred", "hundred pilates"], fichier: "pilates-01-the-hundred" },
  { motifs: ["roll-up", "roll up pilates"], fichier: "pilates-02-roll-up" },
  { motifs: ["plank pilates", "planche pilates", "pilates plank"], fichier: "pilates-03-plank-pilates" },
  { motifs: ["teaser pilates", "pilates teaser"], fichier: "pilates-04-teaser" },
  { motifs: ["side-lying leg lift", "side lying leg lift", "élévation jambe latérale pilates", "elevation jambe laterale pilates"], fichier: "pilates-05-side-lying-leg-lift" },
  { motifs: ["swimming pilates", "pilates swimming"], fichier: "pilates-06-swimming" },
  { motifs: ["bridge pilates", "pont pilates", "pilates bridge"], fichier: "pilates-07-bridge-pont-pilates" },
  { motifs: ["spine stretch forward", "étirement colonne pilates", "etirement colonne pilates"], fichier: "pilates-08-spine-stretch-forward" },
  { motifs: ["single leg stretch", "étirement une jambe pilates", "etirement une jambe pilates"], fichier: "pilates-09-single-leg-stretch-femme" },
  { motifs: ["double leg stretch", "étirement deux jambes pilates", "etirement deux jambes pilates"], fichier: "pilates-10-double-leg-stretch-homme" },
  { motifs: ["criss-cross pilates", "criss cross pilates"], fichier: "pilates-11-criss-cross-femme" },
  { motifs: ["scissors pilates", "ciseaux pilates"], fichier: "pilates-12-scissors-homme" },
  { motifs: ["corkscrew pilates", "tire-bouchon pilates", "tire bouchon pilates"], fichier: "pilates-13-corkscrew-homme" },
  { motifs: ["kneeling side kick", "side kick à genoux", "side kick a genoux"], fichier: "pilates-14-side-kick-kneeling-femme" },
  { motifs: ["saw pilates", "la scie pilates"], fichier: "pilates-15-saw-femme" },
  { motifs: ["seal pilates", "le phoque pilates"], fichier: "pilates-16-seal-homme" },

  // Compléments parité & catalogue (25/08/2026) — nouveaux visuels COAI
  // générés dans la même DA premium. Les noms exacts du catalogue passent
  // avant les motifs plus larges (« rowing », « tirage », « curl », etc.).
  { motifs: ["tirage horizontal (machine)", "tirage horizontal machine", "seated cable row"], fichier: "tirage-horizontal-machine-premium-v2" },
  { motifs: ["tirage vertical (poulie)", "tirage vertical poulie", "lat pulldown"], fichier: "tirage-vertical-poulie-premium-v2" },
  { motifs: ["traction guidée (machine)", "traction guidee machine", "traction assistée machine", "traction assistee machine", "assisted pull up machine", "assisted pull-up machine"], fichier: "traction-guidee-machine-premium-v2" },
  { motifs: ["curl marteau", "hammer curl"], fichier: "curl-marteau-homme-blond" },
  { motifs: ["presse à cuisses (machine)", "presse a cuisses machine", "presse à cuisses", "presse a cuisses", "leg press"], fichier: "presse-a-cuisses-machine-premium-v2" },
  { motifs: ["rowing poulie basse", "tirage poulie basse", "low cable row"], fichier: "tirage-horizontal-machine-premium-v2" },
  { motifs: ["hip thrust barre", "barbell hip thrust"], fichier: "hip-thrust-barre" },
  { motifs: ["rowing haltère unilatéral", "rowing haltere unilateral", "one arm dumbbell row", "single arm dumbbell row"], fichier: "rowing-haltere-unilateral-homme-arabe" },
  { motifs: ["traction à la barre fixe", "traction a la barre fixe", "traction barre fixe", "tractions barre fixe", "pull-up", "pull up"], fichier: "traction-barre-fixe-femme-blonde" },
  { motifs: ["rowing à l'élastique", "rowing a l'elastique", "rowing élastique", "rowing elastique", "resistance band row"], fichier: "rowing-elastique-homme-blond" },
  { motifs: ["pompes", "pompe au sol", "push-up", "push up"], fichier: "pompes-femme-eurasienne" },

  // Complément catalogue (25/08/2026) — modèles métis, tenue noire COAI.
  // Ces neuf correspondances terminent la couverture visuelle exacte des
  // exercices actuellement publiés dans la bibliothèque.
  { motifs: ["curl biceps haltères", "curl biceps halteres", "dumbbell bicep curl"], fichier: "curl-biceps-halteres-femme-metisse-v2" },
  { motifs: ["curl barre ez", "ez-bar curl", "ez bar curl"], fichier: "curl-barre-ez-homme-metis-v2" },
  { motifs: ["air squat", "squat poids du corps", "bodyweight squat"], fichier: "squat-poids-du-corps-femme-metisse-v2" },
  { motifs: ["pont fessier", "glute bridge"], fichier: "pont-fessier-homme-metis-v2" },
  { motifs: ["mollets debout (machine)", "mollets debout machine", "standing calf raise machine"], fichier: "mollets-debout-machine-femme-metisse-v2" },
  { motifs: ["mollets assis (machine)", "mollets assis machine", "seated calf raise machine"], fichier: "mollets-assis-machine-homme-metis-v2" },
  { motifs: ["mollets unilatéral haltère", "mollets unilateral haltere", "single leg calf raise"], fichier: "mollets-unilateral-haltere-femme-metisse-v2" },
  { motifs: ["mollets debout élastique", "mollets debout elastique", "calf raise resistance band"], fichier: "mollets-debout-elastique-homme-metis-v2" },
  { motifs: ["marche sur pointes", "walking on toes"], fichier: "marche-sur-pointes-femme-metisse-v2" },

  { motifs: ["fentes avant", "fente avant", "fentes haltères", "lunge"], fichier: "fentes-avant-halteres" },
  { motifs: ["leg curl", "ischio"], fichier: "leg-curl-machine-premium-v2" },
  { motifs: ["fentes bulgares", "fente bulgare", "bulgarian split", "split squat"], fichier: "fentes-bulgares" },
  { motifs: ["kickback"], fichier: "kickback-fessier-elastique" },
  { motifs: ["abduction"], fichier: "abduction-hanche-elastique" },
  // "gainage latéral" avant "gainage planche" : sans cet ordre, le motif
  // "gainage" du second capterait aussi le latéral, qui est un autre
  // exercice (appui sur un seul avant-bras, obliques).
  { motifs: ["gainage latéral", "gainage lateral", "side plank"], fichier: "gainage-lateral" },
  { motifs: ["gainage planche", "planche", "plank"], fichier: "gainage-planche" },
  { motifs: ["crunch"], fichier: "crunch-au-sol" },
  { motifs: ["relevé de genoux", "releve de genoux", "hanging knee raise", "relevé de jambes", "releve de jambes", "hanging leg raise"], fichier: "releve-jambes-suspendu" },
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
  { motifs: ["développé incliné (machine)", "developpe incline machine", "incline chest press machine"], fichier: "developpe-incline-machine" },
  { motifs: ["développé arnold", "developpe arnold", "arnold press"], fichier: "developpe-arnold" },
  { motifs: ["développé militaire", "developpe militaire", "shoulder press", "overhead press"], fichier: "developpe-militaire-halteres" },
  { motifs: ["élévations latérales", "elevations laterales", "lateral raise"], fichier: "elevations-laterales" },
  { motifs: ["élévations frontales", "elevations frontales", "front raise"], fichier: "elevations-frontales" },
  { motifs: ["rowing menton", "upright row"], fichier: "rowing-menton" },
  { motifs: ["face pull"], fichier: "face-pull-elastique" },
  // Extension triceps : la variante au-dessus de la tête d'abord, sinon le
  // motif "extension triceps" de la poulie capterait les deux.
  { motifs: ["extension triceps haltère", "extension triceps haltere", "au-dessus de la tête", "overhead triceps"], fichier: "extension-triceps-dessus-tete" },
  { motifs: ["extension triceps", "triceps poulie", "pushdown"], fichier: "extension-triceps-poulie-premium-v2" },
  { motifs: ["sauts à la corde", "sauts a la corde", "corde à sauter", "corde a sauter", "jump rope"], fichier: "sauts-corde" },

  // Troisième lot (24/08/2026) — mobilité, Hyrox, suspension, kettlebell.
  // Ces familles n'existaient pas encore dans le catalogue : les photos
  // arrivent avant les exercices, pour que la génération des programmes
  // socles puisse déjà s'appuyer dessus.

  // MOBILITÉ
  { motifs: ["chat-vache", "chat vache", "cat cow"], fichier: "mobilite-chat-vache-flexion" },
  { motifs: ["rotation thoracique"], fichier: "mobilite-rotation-thoracique-allongee" },
  { motifs: ["fente basse", "ouverture de hanche", "ouverture hanche"], fichier: "mobilite-fente-basse-ouverture-hanche" },
  // Visuel ischio debout rejeté : aucun remplacement par un autre geste.
  { motifs: ["posture de l'enfant", "posture enfant", "child pose"], fichier: "mobilite-posture-enfant" },
  { motifs: ["étirement pectoraux", "etirement pectoraux"], fichier: "mobilite-etirement-pectoraux-cadre-porte" },
  { motifs: ["étirement fessier", "etirement fessier"], fichier: "mobilite-etirement-fessier-assis" },
  { motifs: ["squat profond assisté", "squat profond assiste", "mobilité hanches chevilles", "mobilite hanches chevilles"], fichier: "mobilite-squat-profond-assiste-homme-metis" },
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
  { motifs: ["planche dynamique trx", "planche dynamique au trx", "gainage dynamique trx", "planche trx", "gainage trx", "gainage suspension"], fichier: "suspension-gainage-planche" },
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
  // Visuel Zercher rejeté : aucun back/front squat utilisé à sa place.
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
function normaliser(nom: string) {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘ʼ`]/g, "'")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function correspond(entree: EntreePhoto, normalise: string) {
  return entree.motifs.some((m) => normalise.includes(normaliser(m)));
}

export function photoCoaiPourNom(nom: string, genre?: GenreVisuel): string | null {
  const normalise = normaliser(nom);
  const variante = VARIANTES.find((e) => correspond(e, normalise));
  if (variante && genre && variante[genre]) return `/exercices/${variante[genre]}.jpg`;
  if (variante && !genre) return `/exercices/${variante.fichier}.jpg`;
  const entree = TABLE.find((e) => correspond(e, normalise));
  return entree ? `/exercices/${entree.fichier}.jpg` : null;
}
