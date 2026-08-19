// Bibliothèque de recettes COAI (19/08/2026, demande Anthony — "des recettes
// avec de belles images", façon MyFitnessCoach). Contenu éditorial rédigé
// ici, distinct du plan nutrition généré par l'IA (NutritionView) : ces
// recettes sont une bibliothèque commune consultable par tous les abonnés,
// pas une personnalisation par profil. Macros données à titre indicatif
// (estimation pour une portion), jamais présentées comme un calcul exact —
// même principe de prudence que le reste du contenu nutrition de COAI.
export type ObjectifRecette = "PERTE_DE_POIDS" | "PRISE_DE_MASSE" | "EQUILIBRE";
export type TypeRepas = "PETIT_DEJEUNER" | "DEJEUNER" | "DINER" | "COLLATION";
export type RegimeRecette = "VEGETARIEN" | "SANS_GLUTEN" | "ANTI_INFLAMMATOIRE";

export type Recette = {
  slug: string;
  nom: string;
  description: string;
  photoQuery: string;
  typeRepas: TypeRepas;
  objectifs: ObjectifRecette[];
  regimes: RegimeRecette[];
  tempsMinutes: number;
  macros: { calories: number; proteines: number; glucides: number; lipides: number };
  ingredients: string[];
  etapes: string[];
};

export const RECETTES: Recette[] = [
  {
    slug: "bowl-poulet-quinoa",
    nom: "Bowl poulet grillé, quinoa et légumes rôtis",
    description: "Un classique protéiné et coloré, facile à préparer en avance pour toute la semaine.",
    photoQuery: "grilled chicken quinoa bowl healthy",
    typeRepas: "DEJEUNER",
    objectifs: ["PRISE_DE_MASSE", "EQUILIBRE"],
    regimes: ["SANS_GLUTEN"],
    tempsMinutes: 30,
    macros: { calories: 520, proteines: 42, glucides: 48, lipides: 16 },
    ingredients: [
      "150 g de blanc de poulet",
      "80 g de quinoa (poids sec)",
      "1 courgette",
      "1 poivron rouge",
      "1 c. à soupe d'huile d'olive",
      "Cumin, paprika, sel, poivre",
    ],
    etapes: [
      "Cuire le quinoa dans 2 fois son volume d'eau, environ 15 minutes.",
      "Couper la courgette et le poivron en dés, les rôtir au four 20 min à 200°C avec l'huile d'olive et les épices.",
      "Griller le poulet à la poêle 5-6 minutes de chaque côté, épicer avec cumin et paprika.",
      "Assembler le bowl : quinoa, légumes rôtis, poulet tranché.",
    ],
  },
  {
    slug: "porridge-fruits-rouges",
    nom: "Porridge avoine, fruits rouges et amandes",
    description: "Un petit-déjeuner qui tient au corps, riche en fibres et à index glycémique modéré.",
    photoQuery: "oatmeal porridge berries almonds breakfast",
    typeRepas: "PETIT_DEJEUNER",
    objectifs: ["EQUILIBRE", "PERTE_DE_POIDS"],
    regimes: ["VEGETARIEN"],
    tempsMinutes: 10,
    macros: { calories: 340, proteines: 12, glucides: 48, lipides: 10 },
    ingredients: [
      "50 g de flocons d'avoine",
      "200 ml de lait (ou boisson végétale)",
      "80 g de fruits rouges (frais ou surgelés)",
      "1 c. à soupe d'amandes effilées",
      "1 c. à café de miel (optionnel)",
    ],
    etapes: [
      "Faire chauffer le lait, ajouter les flocons d'avoine, cuire 5 minutes à feu doux en remuant.",
      "Verser dans un bol, ajouter les fruits rouges et les amandes.",
      "Sucrer légèrement au miel si besoin.",
    ],
  },
  {
    slug: "saumon-legumes-vapeur",
    nom: "Pavé de saumon, brocolis et patate douce vapeur",
    description: "Riche en omégas-3, parfait pour un dîner léger sans sacrifier les protéines.",
    photoQuery: "salmon fillet broccoli sweet potato dinner plate",
    typeRepas: "DINER",
    objectifs: ["PERTE_DE_POIDS", "EQUILIBRE"],
    regimes: ["SANS_GLUTEN", "ANTI_INFLAMMATOIRE"],
    tempsMinutes: 25,
    macros: { calories: 430, proteines: 36, glucides: 32, lipides: 18 },
    ingredients: [
      "150 g de pavé de saumon",
      "150 g de brocolis",
      "150 g de patate douce",
      "1 c. à soupe d'huile d'olive",
      "Jus de citron, aneth",
    ],
    etapes: [
      "Cuire la patate douce en dés et les brocolis à la vapeur, 15-18 minutes.",
      "Cuire le saumon à la poêle ou au four, 12-15 minutes selon l'épaisseur.",
      "Arroser d'huile d'olive, de jus de citron et d'aneth avant de servir.",
    ],
  },
  {
    slug: "buddha-bowl-vegetarien",
    nom: "Buddha bowl pois chiches et houmous maison",
    description: "100% végétal, riche en protéines végétales et en fibres, sans gluten.",
    photoQuery: "vegan buddha bowl chickpeas hummus vegetables",
    typeRepas: "DEJEUNER",
    objectifs: ["EQUILIBRE", "PERTE_DE_POIDS"],
    regimes: ["VEGETARIEN", "SANS_GLUTEN"],
    tempsMinutes: 25,
    macros: { calories: 470, proteines: 18, glucides: 55, lipides: 20 },
    ingredients: [
      "150 g de pois chiches cuits",
      "3 c. à soupe de houmous",
      "1 poignée d'épinards frais",
      "1/2 avocat",
      "1/2 carotte râpée",
      "Graines de sésame",
    ],
    etapes: [
      "Rôtir les pois chiches 15 minutes au four avec un filet d'huile d'olive et du paprika.",
      "Disposer les épinards, la carotte râpée et l'avocat tranché dans un bol.",
      "Ajouter les pois chiches tièdes et une belle cuillère de houmous.",
      "Parsemer de graines de sésame.",
    ],
  },
  {
    slug: "omelette-legumes",
    nom: "Omelette aux légumes de saison",
    description: "Rapide, économique et riche en protéines — un grand classique qui ne déçoit jamais.",
    photoQuery: "vegetable omelette healthy breakfast plate",
    typeRepas: "PETIT_DEJEUNER",
    objectifs: ["PRISE_DE_MASSE", "EQUILIBRE"],
    regimes: ["VEGETARIEN", "SANS_GLUTEN"],
    tempsMinutes: 12,
    macros: { calories: 320, proteines: 22, glucides: 8, lipides: 22 },
    ingredients: [
      "3 œufs",
      "1/2 poivron",
      "Quelques champignons",
      "1 poignée d'épinards",
      "1 c. à café d'huile d'olive",
    ],
    etapes: [
      "Faire revenir les légumes coupés en petits morceaux dans l'huile d'olive.",
      "Battre les œufs, verser sur les légumes dans la poêle chaude.",
      "Cuire 3-4 minutes à feu moyen, replier et servir.",
    ],
  },
  {
    slug: "curry-lentilles-corail",
    nom: "Curry de lentilles corail au lait de coco",
    description: "Réconfortant, riche en fibres et en fer, parfait pour un dîner d'hiver.",
    photoQuery: "red lentil curry coconut milk bowl",
    typeRepas: "DINER",
    objectifs: ["EQUILIBRE", "PERTE_DE_POIDS"],
    regimes: ["VEGETARIEN", "SANS_GLUTEN", "ANTI_INFLAMMATOIRE"],
    tempsMinutes: 30,
    macros: { calories: 410, proteines: 16, glucides: 50, lipides: 15 },
    ingredients: [
      "150 g de lentilles corail",
      "200 ml de lait de coco",
      "1 oignon",
      "1 c. à soupe de pâte de curry",
      "1 poignée d'épinards frais",
    ],
    etapes: [
      "Faire revenir l'oignon émincé, ajouter la pâte de curry 1 minute.",
      "Ajouter les lentilles rincées et le lait de coco, couvrir d'eau à hauteur.",
      "Laisser mijoter 20 minutes, ajouter les épinards en fin de cuisson.",
    ],
  },
  {
    slug: "yaourt-grec-granola",
    nom: "Yaourt grec, granola maison et miel",
    description: "Une collation riche en protéines pour tenir entre deux repas ou après une séance.",
    photoQuery: "greek yogurt granola honey bowl snack",
    typeRepas: "COLLATION",
    objectifs: ["PRISE_DE_MASSE", "EQUILIBRE"],
    regimes: ["VEGETARIEN"],
    tempsMinutes: 5,
    macros: { calories: 280, proteines: 20, glucides: 30, lipides: 9 },
    ingredients: [
      "200 g de yaourt grec nature",
      "30 g de granola",
      "1 c. à café de miel",
      "Quelques fruits frais",
    ],
    etapes: ["Verser le yaourt dans un bol.", "Ajouter le granola, le miel et les fruits frais."],
  },
  {
    slug: "wrap-thon-avocat",
    nom: "Wrap thon, avocat et crudités",
    description: "Pratique à emporter, équilibré entre protéines maigres et bonnes graisses.",
    photoQuery: "tuna avocado wrap sandwich healthy lunch",
    typeRepas: "DEJEUNER",
    objectifs: ["PERTE_DE_POIDS", "EQUILIBRE"],
    regimes: [],
    tempsMinutes: 10,
    macros: { calories: 390, proteines: 28, glucides: 34, lipides: 16 },
    ingredients: [
      "1 galette de blé complet",
      "1 boîte de thon au naturel",
      "1/2 avocat",
      "Salade, tomate, concombre",
      "Jus de citron",
    ],
    etapes: [
      "Écraser l'avocat avec un filet de citron.",
      "Étaler sur la galette, ajouter le thon égoutté et les crudités.",
      "Rouler fermement et couper en deux.",
    ],
  },
  {
    slug: "smoothie-proteine-banane",
    nom: "Smoothie banane, beurre de cacahuète et protéine",
    description: "Idéal après une séance, rapide à préparer, riche en énergie et en protéines.",
    photoQuery: "banana peanut butter protein smoothie glass",
    typeRepas: "COLLATION",
    objectifs: ["PRISE_DE_MASSE"],
    regimes: ["VEGETARIEN"],
    tempsMinutes: 5,
    macros: { calories: 360, proteines: 28, glucides: 40, lipides: 10 },
    ingredients: [
      "1 banane",
      "250 ml de lait (ou boisson végétale)",
      "1 dose de protéine en poudre",
      "1 c. à café de beurre de cacahuète",
    ],
    etapes: ["Mixer tous les ingrédients jusqu'à obtenir une texture lisse.", "Servir immédiatement, bien frais."],
  },
  {
    slug: "poke-bowl-tofu",
    nom: "Poke bowl tofu mariné et riz vinaigré",
    description: "Frais, coloré et 100% végétal, avec une bonne dose de protéines végétales.",
    photoQuery: "tofu poke bowl rice vegetables colorful",
    typeRepas: "DEJEUNER",
    objectifs: ["EQUILIBRE", "PERTE_DE_POIDS"],
    regimes: ["VEGETARIEN", "SANS_GLUTEN"],
    tempsMinutes: 25,
    macros: { calories: 460, proteines: 20, glucides: 58, lipides: 14 },
    ingredients: [
      "150 g de tofu ferme",
      "80 g de riz (poids sec)",
      "1/2 concombre",
      "1 carotte",
      "Sauce soja (sans gluten si besoin), vinaigre de riz",
    ],
    etapes: [
      "Cuire le riz, l'assaisonner avec un filet de vinaigre de riz.",
      "Faire mariner le tofu coupé en dés dans la sauce soja 10 minutes, puis le poêler 5 minutes.",
      "Assembler le bowl avec le riz, le concombre, la carotte et le tofu.",
    ],
  },
];

export function filtrerRecettes(recettes: Recette[], filtres: { typeRepas?: TypeRepas; objectif?: ObjectifRecette; regime?: RegimeRecette }) {
  return recettes.filter((r) => {
    if (filtres.typeRepas && r.typeRepas !== filtres.typeRepas) return false;
    if (filtres.objectif && !r.objectifs.includes(filtres.objectif)) return false;
    if (filtres.regime && !r.regimes.includes(filtres.regime)) return false;
    return true;
  });
}

export const TYPE_REPAS_LABEL: Record<TypeRepas, string> = {
  PETIT_DEJEUNER: "Petit-déjeuner",
  DEJEUNER: "Déjeuner",
  DINER: "Dîner",
  COLLATION: "Collation",
};

export const OBJECTIF_RECETTE_LABEL: Record<ObjectifRecette, string> = {
  PERTE_DE_POIDS: "Perte de poids",
  PRISE_DE_MASSE: "Prise de masse",
  EQUILIBRE: "Équilibre",
};

export const REGIME_LABEL: Record<RegimeRecette, string> = {
  VEGETARIEN: "Végétarien",
  SANS_GLUTEN: "Sans gluten",
  ANTI_INFLAMMATOIRE: "Anti-inflammatoire",
};
