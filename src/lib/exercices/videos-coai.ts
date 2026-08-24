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

type Entree = { motifs: string[]; video: VideoCoai };

const TABLE: Entree[] = [
  { motifs: ["overhead squat", "squat au-dessus de la tete"], video: { fichier: "overhead-squat-barre", description: "Squat barre au-dessus de la tête" } },
  { motifs: ["front squat"], video: { fichier: "front-squat-barre", description: "Front squat barre" } },
  { motifs: ["back squat", "squat barre", "squat arriere"], video: { fichier: "back-squat-barre", description: "Squat arrière à la barre" } },
  { motifs: ["goblet squat", "squat gobelet"], video: { fichier: "goblet-squat", description: "Squat gobelet" } },
  { motifs: ["squat jump", "squat saute"], video: { fichier: "squat-jump", description: "Squat sauté" } },
  { motifs: ["step up", "montee sur banc", "montee sur step"], video: { fichier: "step-up", description: "Montée sur step" } },
  { motifs: ["sauts lateraux step", "saut lateral step", "sauts lateraux au-dessus", "lateral step over"], video: { fichier: "sauts-lateraux-step", description: "Sauts latéraux au-dessus d’un step" } },

  { motifs: ["power clean", "epaule barre", "epauler barre"], video: { fichier: "power-clean-barre", description: "Épaulé à la barre" } },
  { motifs: ["deadlift conventionnel", "souleve de terre conventionnel"], video: { fichier: "souleve-terre-conventionnel", description: "Soulevé de terre conventionnel" } },
  { motifs: ["deadlift roumain halteres", "souleve de terre roumain halteres", "rdl halteres"], video: { fichier: "deadlift-roumain-halteres", description: "Soulevé de terre roumain aux haltères" } },
  { motifs: ["deadlift roumain", "souleve de terre roumain", "romanian deadlift", "rdl"], video: { fichier: "deadlift-roumain-barre", description: "Soulevé de terre roumain à la barre" } },
  { motifs: ["fente arriere barre", "fentes arriere barre"], video: { fichier: "fentes-arriere-barre", description: "Fentes arrière à la barre" } },
  { motifs: ["fente arriere halteres", "fentes arriere halteres", "reverse lunge"], video: { fichier: "fentes-arriere-halteres", description: "Fentes arrière aux haltères" } },
  { motifs: ["kettlebell swing", "swing kettlebell"], video: { fichier: "kettlebell-swing", description: "Kettlebell swing" } },

  { motifs: ["developpe couche halteres", "dumbbell bench press"], video: { fichier: "developpe-couche-halteres", description: "Développé couché aux haltères" } },
  { motifs: ["ecarte halteres", "dumbbell fly", "chest fly"], video: { fichier: "ecarte-halteres", description: "Écarté couché aux haltères" } },
  { motifs: ["pompes inclinees", "pompe inclinee", "incline push up"], video: { fichier: "pompes-inclinees", description: "Pompes inclinées" } },
  { motifs: ["pompe", "push up", "push-up"], video: { fichier: "pompes", description: "Pompes au sol" } },
  { motifs: ["dips sur banc", "dips banc", "bench dips"], video: { fichier: "dips-banc", description: "Dips sur banc" } },

  { motifs: ["rowing halteres", "rowing buste penche", "bent over row"], video: { fichier: "rowing-halteres", description: "Rowing buste penché aux haltères" } },
  { motifs: ["rowing menton", "tirage menton", "upright row"], video: { fichier: "rowing-menton-barre", description: "Rowing menton à la barre" } },
  { motifs: ["chin up", "chin-up", "traction supination"], video: { fichier: "chin-up", description: "Traction en supination" } },
  { motifs: ["traction", "pull up", "pull-up"], video: { fichier: "traction", description: "Traction à la barre fixe" } },
  { motifs: ["developpe militaire barre", "developpe epaules barre", "strict press"], video: { fichier: "developpe-militaire-barre", description: "Développé militaire à la barre" } },
  { motifs: ["developpe militaire halteres", "developpe epaules halteres", "dumbbell shoulder press"], video: { fichier: "developpe-epaules-halteres", description: "Développé épaules aux haltères" } },
  { motifs: ["elevations laterales", "elevation laterale", "lateral raise"], video: { fichier: "elevations-laterales", description: "Élévations latérales" } },
  { motifs: ["elevations frontales", "elevation frontale", "front raise"], video: { fichier: "elevations-frontales", description: "Élévations frontales" } },
  { motifs: ["curl biceps halteres", "curl halteres", "dumbbell curl"], video: { fichier: "curl-biceps", description: "Curl biceps aux haltères" } },
  { motifs: ["oiseau halteres", "reverse fly", "rear delt fly"], video: { fichier: "oiseau-halteres", description: "Oiseau aux haltères" } },
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
  { motifs: ["gainage planche", "planche avant-bras", "forearm plank"], video: { fichier: "gainage-planche", description: "Gainage sur les avant-bras" } },
  { motifs: ["crunch"], video: { fichier: "crunch", description: "Crunch au sol" } },
  { motifs: ["releve de genoux suspendu", "hanging knee raise"], video: { fichier: "releve-genoux-suspendu", description: "Relevé de genoux suspendu" } },
  { motifs: ["burpee"], video: { fichier: "burpees", description: "Burpee" } },
  { motifs: ["shadow boxing", "boxe dans le vide"], video: { fichier: "shadow-boxing", description: "Enchaînement de boxe dans le vide" } },
];

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function videoCoaiPourNom(nom: string): VideoCoai | null {
  const normalise = normaliser(nom);
  const entree = TABLE.find(({ motifs }) =>
    motifs.some((motif) => normalise.includes(normaliser(motif)))
  );
  return entree?.video ?? null;
}

export function urlVideoCoai(fichier: string): string {
  return `/videos/exercices/${fichier}.mp4`;
}
