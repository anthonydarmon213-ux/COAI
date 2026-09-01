// Vidéos réelles tournées par Anthony pour COAI (24/08/2026).
//
// Règle absolue : une vidéo n'est associée qu'au mouvement qu'elle montre
// réellement. Aucun rapprochement par famille musculaire et aucun ancien clip
// généré par IA. Si le nom n'est pas reconnu avec certitude, la fiche conserve
// simplement sa photo et ses consignes.

export type VideoCoai = {
  fichier: string;
  description: string;
};

type Entree = { motifs: string[]; video: VideoCoai | null };

const TABLE: Entree[] = [
  // Contrôle visuel Anthony du 28/08/2026 : le fichier historique
  // goblet-squat.mp4 montre en réalité un air squat, sans kettlebell.
  // On l'utilise donc uniquement pour le poids du corps.
  { motifs: ["air squat", "squat poids du corps", "bodyweight squat"], video: { fichier: "goblet-squat", description: "Air squat au poids du corps" } },

  // Lot fonctionnel réel du 25/08/2026. Les variantes précises restent
  // avant les motifs génériques (notamment « burpee »).
  { motifs: ["ballon leste par-dessus l'epaule", "medecine ball par-dessus l'epaule"], video: { fichier: "medecine-ball-par-dessus-epaule", description: "Ballon lesté par-dessus l’épaule" } },
  { motifs: ["devil press"], video: { fichier: "devil-press-halteres", description: "Devil press aux haltères" } },
  { motifs: ["windmill haltere", "moulin haltere"], video: { fichier: "windmill-haltere", description: "Windmill avec haltère" } },
  { motifs: ["cordes ondulatoires alternees", "battle rope alternees"], video: { fichier: "cordes-ondulatoires-alternees", description: "Cordes ondulatoires alternées" } },
  { motifs: ["cordes ondulatoires doubles", "battle rope doubles"], video: { fichier: "cordes-ondulatoires-doubles", description: "Cordes ondulatoires doubles" } },
  { motifs: ["sauts a la corde", "corde a sauter"], video: { fichier: "sauts-corde-reel", description: "Sauts à la corde" } },
  { motifs: ["box jump", "saut sur caisson"], video: { fichier: "box-jump", description: "Saut sur caisson" } },
  { motifs: ["souleve de terre trap bar", "souleve de terre hex bar", "deadlift trap bar", "deadlift hex bar"], video: { fichier: "souleve-terre-trap-bar", description: "Soulevé de terre à la trap bar" } },
  { motifs: ["poussee de traineau", "sled push"], video: { fichier: "poussee-traineau", description: "Poussée de traîneau" } },
  { motifs: ["tirage de traineau a la corde", "sled rope pull"], video: { fichier: "tirage-traineau-corde", description: "Tirage de traîneau à la corde" } },
  { motifs: ["burpee avec saut en longueur", "burpee broad jump"], video: { fichier: "burpee-saut-longueur", description: "Burpee avec saut en longueur" } },
  { motifs: ["marche du fermier kettlebells", "farmer walk kettlebells"], video: { fichier: "marche-fermier-kettlebells", description: "Marche du fermier avec kettlebells" } },

  // TRX — vidéos réelles tournées par Anthony le 25/08/2026. Ces motifs
  // restent avant « pompes », « rowing » et « fente » afin que la version
  // avec sangles ne soit jamais remplacée par un autre mouvement.
  { motifs: ["rowing trx", "rowing suspension", "rowing sangles"], video: { fichier: "rowing-trx", description: "Rowing avec sangles TRX" } },
  { motifs: ["pompes trx", "pompe trx", "pompes suspension"], video: { fichier: "pompes-trx", description: "Pompes avec sangles TRX" } },
  { motifs: ["planche dynamique trx", "planche dynamique au trx", "gainage dynamique trx", "planche trx", "gainage trx", "gainage suspension"], video: { fichier: "extension-triceps-trx", description: "Planche dynamique avec sangles TRX" } },
  { motifs: ["pistol squat assiste trx", "pistol squat trx", "squat une jambe trx"], video: { fichier: "pistol-squat-assiste-trx", description: "Pistol squat assisté avec sangles TRX" } },
  { motifs: ["fente arriere trx", "fentes arriere trx", "fente trx"], video: { fichier: "fente-arriere-trx", description: "Fente arrière avec sangles TRX" } },
  { motifs: ["montee de genou trx", "montees de genoux trx", "genou trx"], video: { fichier: "montee-genou-trx", description: "Montées de genoux avec sangles TRX" } },

  { motifs: ["overhead squat", "squat au-dessus de la tete"], video: { fichier: "overhead-squat-barre", description: "Squat barre au-dessus de la tête" } },
  { motifs: ["front squat"], video: { fichier: "front-squat-barre", description: "Front squat barre" } },
  { motifs: ["back squat", "squat barre", "squat arriere"], video: { fichier: "back-squat-barre", description: "Squat arrière à la barre" } },
  { motifs: ["goblet squat", "squat gobelet"], video: null },
  { motifs: ["squat jump", "squat saute"], video: { fichier: "squat-jump", description: "Squat sauté" } },
  { motifs: ["step up", "montee sur banc", "montee sur step"], video: { fichier: "step-up", description: "Montée sur step" } },
  { motifs: ["sauts lateraux step", "saut lateral step", "sauts lateraux au-dessus", "lateral step over"], video: { fichier: "sauts-lateraux-step", description: "Sauts latéraux au-dessus d’un step" } },

  { motifs: ["power clean", "epaule barre", "epauler barre"], video: { fichier: "power-clean-barre", description: "Épaulé à la barre" } },
  { motifs: ["deadlift conventionnel", "souleve de terre conventionnel"], video: { fichier: "souleve-terre-conventionnel", description: "Soulevé de terre conventionnel" } },
  // Contrôle visuel Anthony + audit du 28/08/2026 : les deux fichiers
  // historiques « deadlift-roumain-* » montrent en réalité des rowings.
  // Tant que de vraies vidéos de RDL ne sont pas validées, aucune variante
  // roumaine ne reçoit de démonstration vidéo.
  { motifs: ["deadlift roumain halteres", "souleve de terre roumain halteres", "rdl halteres"], video: null },
  { motifs: ["deadlift roumain", "souleve de terre roumain", "romanian deadlift", "rdl"], video: null },
  { motifs: ["fente arriere barre", "fentes arriere barre"], video: { fichier: "fentes-arriere-barre", description: "Fentes arrière à la barre" } },
  { motifs: ["fente arriere halteres", "fentes arriere halteres", "reverse lunge"], video: { fichier: "fentes-arriere-halteres", description: "Fentes arrière aux haltères" } },
  { motifs: ["kettlebell swing", "swing kettlebell"], video: { fichier: "kettlebell-swing", description: "Kettlebell swing" } },

  { motifs: ["developpe couche halteres", "dumbbell bench press"], video: { fichier: "developpe-couche-halteres", description: "Développé couché aux haltères" } },
  { motifs: ["ecarte halteres", "dumbbell fly", "chest fly"], video: { fichier: "ecarte-halteres", description: "Écarté couché aux haltères" } },
  { motifs: ["pompes inclinees", "pompe inclinee", "incline push up"], video: { fichier: "pompes-inclinees", description: "Pompes inclinées" } },
  { motifs: ["pompe", "push up", "push-up"], video: { fichier: "pompes", description: "Pompes au sol" } },
  { motifs: ["dips sur banc", "dips banc", "bench dips"], video: { fichier: "dips-banc", description: "Dips sur banc" } },

  // Noms de fichiers historiques inversés : vérification sur planches-contact,
  // ne pas les réassocier d'après leur nom sans regarder le mouvement réel.
  { motifs: ["rowing haltere unilateral", "rowing unilateral haltere", "rowing un bras haltere"], video: { fichier: "oiseau-halteres", description: "Rowing haltère unilatéral avec appui" } },
  { motifs: ["rowing barre buste penche", "rowing buste penche barre", "rowing barre", "barbell row"], video: { fichier: "deadlift-roumain-barre", description: "Rowing barre buste penché" } },
  { motifs: ["rowing halteres", "rowing buste penche aux halteres", "dumbbell bent over row"], video: { fichier: "deadlift-roumain-halteres", description: "Rowing buste penché aux haltères" } },
  { motifs: ["rowing menton", "tirage menton", "upright row"], video: { fichier: "rowing-menton-barre", description: "Rowing menton à la barre" } },
  // Une traction guidée n'est pas une traction libre : le clip traction.mp4
  // ne doit jamais être réutilisé pour la machine assistée.
  { motifs: ["traction guidee", "traction assistée machine", "traction assistee machine", "assisted pull up machine", "assisted pull-up machine"], video: null },
  { motifs: ["chin up", "chin-up", "traction supination"], video: { fichier: "chin-up", description: "Traction en supination" } },
  { motifs: ["traction", "pull up", "pull-up"], video: { fichier: "traction", description: "Traction à la barre fixe" } },
  { motifs: ["developpe militaire barre", "developpe epaules barre", "strict press"], video: { fichier: "developpe-militaire-barre", description: "Développé militaire à la barre" } },
  { motifs: ["developpe militaire halteres", "developpe epaules halteres", "dumbbell shoulder press"], video: { fichier: "developpe-epaules-halteres", description: "Développé épaules aux haltères" } },
  { motifs: ["elevations laterales", "elevation laterale", "lateral raise"], video: { fichier: "elevations-laterales", description: "Élévations latérales" } },
  { motifs: ["elevations frontales", "elevation frontale", "front raise"], video: { fichier: "elevations-frontales", description: "Élévations frontales" } },
  { motifs: ["curl biceps halteres", "curl halteres", "dumbbell curl"], video: { fichier: "curl-biceps", description: "Curl biceps aux haltères" } },
  { motifs: ["oiseau halteres", "reverse fly", "rear delt fly"], video: { fichier: "rowing-halteres", description: "Oiseau aux haltères" } },
  { motifs: ["extension triceps couche", "skull crusher", "barre au front"], video: { fichier: "extension-triceps-couche", description: "Extension des triceps couché" } },
  { motifs: ["pullover halteres", "pull over halteres", "dumbbell pullover"], video: { fichier: "pullover-halteres", description: "Pull-over aux haltères" } },
  { motifs: ["thruster halteres", "dumbbell thruster"], video: { fichier: "thruster-halteres", description: "Thruster aux haltères" } },

  { motifs: ["superman"], video: { fichier: "superman", description: "Superman au sol" } },
  { motifs: ["sit up", "sit-up", "redressement assis"], video: { fichier: "sit-up", description: "Redressement assis" } },
  { motifs: ["reverse crunch", "crunch inverse"], video: { fichier: "reverse-crunch", description: "Crunch inversé" } },
  { motifs: ["releve de jambes au sol", "leg raise au sol", "floor leg raise"], video: { fichier: "releve-jambes-sol", description: "Relevé de jambes au sol" } },
  { motifs: ["russian twist"], video: { fichier: "russian-twist", description: "Rotation russe assise" } },
  { motifs: ["mountain climber", "grimpeur"], video: { fichier: "mountain-climber", description: "Mountain climber" } },
  { motifs: ["gainage lateral", "side plank"], video: { fichier: "gainage-lateral", description: "Gainage latéral" } },
  { motifs: ["gainage planche", "planche ventrale", "planche avant-bras", "forearm plank"], video: { fichier: "gainage-planche", description: "Gainage sur les avant-bras" } },
  { motifs: ["crunch"], video: { fichier: "crunch", description: "Crunch au sol" } },
  { motifs: ["releve de genoux suspendu", "hanging knee raise"], video: { fichier: "releve-genoux-suspendu", description: "Relevé de genoux suspendu" } },
  { motifs: ["burpee"], video: { fichier: "burpees", description: "Burpee" } },
  { motifs: ["shadow boxing", "boxe dans le vide"], video: { fichier: "shadow-boxing", description: "Enchaînement de boxe dans le vide" } },
];

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘ʼ`]/g, "'");
}

export function videoCoaiPourNom(nom: string): VideoCoai | null {
  const normalise = normaliser(nom);
  const entree = TABLE.find(({ motifs }) =>
    motifs.some((motif) => normalise.includes(normaliser(motif)))
  );
  return entree?.video ?? null;
}

export function urlVideoCoai(video: VideoCoai): string {
  return `/videos/exercices/${video.fichier}.mp4`;
}
