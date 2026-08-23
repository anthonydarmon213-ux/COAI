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
  const entree = TABLE.find((e) =>
    e.motifs.some((m) => normalise.includes(m.normalize("NFD").replace(/[̀-ͯ]/g, "")))
  );
  return entree ? `/repas/${entree.fichier}.jpg` : null;
}
