import { RECETTES } from "./recettes";

// Photos de repas COAI (24/08/2026) — même principe que photos-coai.ts pour
// les exercices : une photo choisie pour CE plat précis passe avant une
// recherche Pexels par mots-clés, qui renvoyait des assiettes sans rapport.
//
// Les repas sont générés par l'IA, donc leurs noms varient ("Saumon grillé
// et quinoa", "Filet de saumon, quinoa, brocolis"...). Le rapprochement se
// fait sur les aliments principaux plutôt que sur le nom entier : c'est
// l'ingrédient qui détermine à quoi le plat ressemble.
//
// Les fichiers vivent dans /public/repas. Un fichier absent n'est pas une
// erreur : l'appelant retombe sur Pexels, comme avant.

type EntreeRepas = { motifs: string[]; fichier: string };

// L'ordre compte : un plat "saumon et lentilles" doit tomber sur le saumon,
// pas sur les lentilles. Les protéines passent donc avant les féculents,
// et les préparations composées avant les ingrédients isolés.
const TABLE: EntreeRepas[] = [
  // Nouvelles recettes Diet COAI — motifs précis avant les ingrédients
  // génériques pour ne jamais montrer une assiette voisine.
  { motifs: ["pancakes protéinés", "pancakes proteines"], fichier: "petit-dejeuner-pancakes-proteines-fruits-rouges" },
  { motifs: ["overnight oats cacao", "avoine cacao poire"], fichier: "petit-dejeuner-overnight-oats-cacao-poire" },
  { motifs: ["crevettes, mangue", "crevettes mangue", "bowl crevettes"], fichier: "plat-bowl-crevettes-mangue-riz" },
  { motifs: ["chili de dinde", "chili dinde"], fichier: "plat-chili-dinde-haricots-rouges" },
  { motifs: ["pâtes de lentilles", "pates de lentilles", "lentilles pesto courgettes"], fichier: "plat-pates-lentilles-pesto-courgettes" },
  { motifs: ["wok de bœuf", "wok de boeuf", "bœuf nouilles de riz", "boeuf nouilles de riz"], fichier: "plat-wok-boeuf-nouilles-riz" },
  { motifs: ["shakshuka"], fichier: "plat-shakshuka-pois-chiches" },
  { motifs: ["bowl méditerranéen", "bowl mediterraneen", "quinoa pois chiches feta"], fichier: "plat-bowl-mediterraneen-quinoa" },
  { motifs: ["bowl skyr, pomme", "bowl skyr pomme", "skyr pomme cannelle"], fichier: "petit-dejeuner-skyr-pomme-granola" },
  { motifs: ["tartines ricotta", "ricotta figues", "ricotta figue"], fichier: "petit-dejeuner-tartines-ricotta-figues-noix" },
  { motifs: ["burrito petit-déjeuner", "burrito petit-dejeuner", "burrito aux œufs", "burrito aux oeufs"], fichier: "petit-dejeuner-burrito-oeufs-dinde-epinards" },
  { motifs: ["pudding de chia, mangue", "pudding de chia mangue", "chia mangue coco"], fichier: "petit-dejeuner-chia-mangue-coco" },
  { motifs: ["baked oats myrtilles", "avoine myrtilles citron"], fichier: "petit-dejeuner-baked-oats-myrtilles-citron" },
  { motifs: ["porridge salé", "porridge sale", "avoine salée", "avoine salee"], fichier: "petit-dejeuner-porridge-sale-oeuf-epinards" },
  { motifs: ["quinoa petit-déjeuner", "quinoa petit-dejeuner", "quinoa pomme cannelle"], fichier: "petit-dejeuner-quinoa-pomme-cannelle" },
  { motifs: ["pain perdu protéiné", "pain perdu proteine"], fichier: "petit-dejeuner-pain-perdu-proteine-banane" },
  { motifs: ["tartines cottage cheese", "cottage cheese tomate"], fichier: "petit-dejeuner-tartines-cottage-tomate-basilic" },
  { motifs: ["smoothie bowl ananas", "ananas épinards et kiwi", "ananas epinards et kiwi"], fichier: "petit-dejeuner-smoothie-bowl-ananas-epinards-kiwi" },
  { motifs: ["croque-madame léger", "croque-madame leger", "croque madame dinde"], fichier: "petit-dejeuner-croque-madame-dinde" },
  { motifs: ["muffins aux œufs", "muffins aux oeufs", "muffins œufs épinards", "muffins oeufs epinards"], fichier: "petit-dejeuner-muffins-oeufs-epinards-feta" },
  { motifs: ["muesli, yaourt, kiwi", "muesli yaourt kiwi"], fichier: "petit-dejeuner-muesli-yaourt-kiwi-graines" },
  { motifs: ["galette de sarrasin", "galette sarrasin"], fichier: "petit-dejeuner-galette-sarrasin-dinde-oeuf" },
  { motifs: ["riz au lait protéiné", "riz au lait proteine"], fichier: "petit-dejeuner-riz-lait-proteine-framboises" },
  { motifs: ["salade césar légère", "salade cesar legere", "césar légère au poulet", "cesar legere au poulet"], fichier: "dejeuner-salade-cesar-legere-poulet" },
  { motifs: ["wrap dinde", "wrap de dinde", "dinde houmous crudités", "dinde houmous crudites"], fichier: "dejeuner-wrap-dinde-houmous-crudites" },
  { motifs: ["poke saumon", "saumon avocat edamame"], fichier: "dejeuner-poke-saumon-avocat-edamame" },
  { motifs: ["salade de pâtes au thon", "salade de pates au thon", "pâtes thon légumes", "pates thon legumes"], fichier: "dejeuner-salade-pates-thon-legumes" },
  { motifs: ["poulet, semoule complète", "poulet semoule complète", "poulet semoule complete", "poulet semoule légumes", "poulet semoule legumes"], fichier: "dejeuner-poulet-semoule-legumes-rotis" },
  { motifs: ["bowl bœuf", "bowl boeuf", "bœuf quinoa betterave", "boeuf quinoa betterave"], fichier: "dejeuner-bowl-boeuf-quinoa-betterave" },
  { motifs: ["salade de lentilles, feta", "salade de lentilles feta", "lentilles feta légumes", "lentilles feta legumes"], fichier: "dejeuner-salade-lentilles-feta-legumes-rotis" },
  { motifs: ["nouilles au tofu", "tofu sauce cacahuète", "tofu sauce cacahuete"], fichier: "dejeuner-nouilles-tofu-cacahuete" },
  { motifs: ["tacos de cabillaud", "tacos cabillaud"], fichier: "dejeuner-tacos-cabillaud-chou-yaourt" },
  { motifs: ["poivrons farcis à la dinde", "poivrons farcis a la dinde", "poivrons farcis dinde quinoa"], fichier: "dejeuner-poivrons-farcis-dinde-quinoa" },
  { motifs: ["crevettes, semoule", "crevettes semoule", "crevettes courgettes"], fichier: "dejeuner-crevettes-semoule-courgettes" },
  { motifs: ["pâtes complètes, poulet, pesto", "pates completes poulet pesto", "pâtes poulet pesto", "pates poulet pesto"], fichier: "dejeuner-pates-poulet-pesto-tomates" },
  { motifs: ["salade de saumon, pommes de terre", "salade de saumon pommes de terre", "saumon pommes de terre haricots verts"], fichier: "dejeuner-salade-saumon-pommes-terre-haricots" },
  { motifs: ["burrito bowl au bœuf", "burrito bowl au boeuf", "burrito bowl bœuf", "burrito bowl boeuf"], fichier: "dejeuner-burrito-bowl-boeuf" },
  { motifs: ["falafels au four", "falafels taboulé", "falafels taboule"], fichier: "dejeuner-falafels-taboule-sauce-yaourt" },
  { motifs: ["riz sauté à l'œuf", "riz saute a l'oeuf", "riz sauté œuf kimchi", "riz saute oeuf kimchi"], fichier: "dejeuner-riz-saute-oeuf-kimchi" },
  { motifs: ["club sandwich à la dinde", "club sandwich a la dinde", "club sandwich dinde"], fichier: "dejeuner-club-sandwich-dinde" },
  { motifs: ["tartines sardines", "sardines tomate haricots blancs"], fichier: "dejeuner-tartines-sardines-tomate-haricots" },
  { motifs: ["bowl tempeh", "tempeh patate douce chou"], fichier: "dejeuner-bowl-tempeh-patate-douce-chou" },
  { motifs: ["poulet satay", "satay riz légumes", "satay riz legumes"], fichier: "dejeuner-poulet-satay-riz-legumes" },
  { motifs: ["salade niçoise", "salade nicoise", "niçoise au thon", "nicoise au thon"], fichier: "dejeuner-salade-nicoise-thon" },
  { motifs: ["sandwich roast-beef", "sandwich roast beef", "roast-beef moutarde", "roast beef moutarde"], fichier: "dejeuner-sandwich-roast-beef-moutarde" },
  { motifs: ["poulet tikka", "tikka riz chou-fleur", "tikka riz chou fleur"], fichier: "diner-poulet-tikka-riz-chou-fleur" },
  { motifs: ["colin au four", "colin ratatouille pommes de terre"], fichier: "diner-colin-ratatouille-pommes-terre" },
  { motifs: ["boulettes de dinde", "boulettes dinde tomate pâtes", "boulettes dinde tomate pates"], fichier: "diner-boulettes-dinde-tomate-pates" },
  { motifs: ["lasagnes courgette", "courgette et bœuf", "courgette et boeuf"], fichier: "diner-lasagnes-courgette-boeuf" },
  { motifs: ["curry vert de tofu", "curry vert tofu"], fichier: "diner-curry-vert-tofu-legumes" },

  // Petits-déjeuners
  { motifs: ["flocons d'avoine", "flocons davoine", "porridge", "avoine"], fichier: "petit-dejeuner-avoine-fruits-rouges" },
  { motifs: ["œufs brouillés", "oeufs brouilles", "brouillés"], fichier: "petit-dejeuner-oeufs-avocat" },
  { motifs: ["fromage blanc"], fichier: "petit-dejeuner-fromage-blanc-miel" },
  { motifs: ["omelette"], fichier: "petit-dejeuner-omelette-epinards" },

  // Plats — protéine d'abord
  { motifs: ["saumon en papillote", "papillote"], fichier: "plat-saumon-papillote-riz-sauvage" },
  { motifs: ["saumon"], fichier: "plat-saumon-quinoa-brocolis" },
  { motifs: ["thon"], fichier: "plat-thon-patate-douce-asperges" },
  { motifs: ["cabillaud", "poisson blanc"], fichier: "plat-cabillaud-lentilles-carottes" },
  { motifs: ["dinde"], fichier: "plat-dinde-grenaille-epinards" },
  { motifs: ["poulet rôti", "poulet roti", "boulgour"], fichier: "plat-poulet-boulgour-courgettes" },
  { motifs: ["poulet"], fichier: "plat-poulet-riz-haricots" },
  { motifs: ["bœuf", "boeuf", "steak haché", "steak hache"], fichier: "plat-boeuf-patate-douce-salade" },
  { motifs: ["tofu"], fichier: "plat-tofu-sarrasin-legumes" },
  { motifs: ["pois chiches", "curry"], fichier: "plat-curry-pois-chiches-riz" },

  // Collations
  { motifs: ["fromage blanc pêche", "fromage blanc peche", "pêche chia", "peche chia"], fichier: "collation-fromage-blanc-peche-chia" },
  { motifs: ["shake banane cacao", "shake banane", "cacao avoine"], fichier: "collation-shake-banane-cacao-avoine" },
  { motifs: ["tortilla houmous œuf", "tortilla houmous oeuf", "wrap houmous œuf", "wrap houmous oeuf"], fichier: "collation-tortilla-houmous-oeuf" },
  { motifs: ["mini-wrap poulet", "mini wrap poulet", "wrap poulet crudités", "wrap poulet crudites"], fichier: "collation-mini-wrap-poulet" },
  { motifs: ["muffins salés thon", "muffins sales thon", "muffins thon courgette"], fichier: "collation-muffins-thon-courgette" },
  { motifs: ["yaourt soja mangue", "soja mangue coco"], fichier: "collation-yaourt-soja-mangue" },
  { motifs: ["galettes sarrasin fromage frais", "galettes sarrasin radis", "fromage frais radis"], fichier: "collation-galettes-sarrasin-radis" },
  { motifs: ["compote skyr noix", "compote sans sucre skyr"], fichier: "collation-compote-skyr-noix" },
  { motifs: ["pois chiches concombre feta", "salade pois chiches concombre"], fichier: "collation-pois-chiches-concombre-feta" },
  { motifs: ["boules coco protéines", "boules coco proteines", "energy balls coco"], fichier: "collation-boules-coco-proteinees" },
  { motifs: ["amandes", "noix de cajou", "oléagineux", "oleagineux"], fichier: "collation-amandes-cajou" },
  { motifs: ["yaourt grec", "skyr", "myrtilles"], fichier: "collation-yaourt-grec-myrtilles" },
  { motifs: ["œufs durs", "oeufs durs"], fichier: "collation-oeufs-durs" },
  { motifs: ["beurre d'amande", "beurre damande", "pomme"], fichier: "collation-pomme-beurre-amande" },
];

/**
 * Photo COAI pour un repas, ou null si aucune ne correspond nettement.
 * L'appelant retombe alors sur Pexels — jamais sur une photo approchante,
 * qui montrerait un autre plat que celui prévu.
 */
export function photoRepasPourNom(nom: string): string | null {
  const normalise = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const recetteExacte = RECETTES.find(
    (recette) => recette.nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "") === normalise
  );
  if (recetteExacte?.photoLocale) return recetteExacte.photoLocale;

  const entree = TABLE.find((e) =>
    e.motifs.some((m) => normalise.includes(m.normalize("NFD").replace(/[̀-ͯ]/g, "")))
  );
  return entree ? `/repas/${entree.fichier}.jpg` : null;
}
