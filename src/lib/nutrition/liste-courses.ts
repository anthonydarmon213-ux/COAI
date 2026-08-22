// Liste de courses de la semaine (22/08/2026, demande Anthony) — extraite
// du programme nutrition DÉJÀ généré, entièrement côté client : aucun appel
// LLM, donc instantané et gratuit. Le champ "quantite" de chaque repas
// contient déjà les aliments chiffrés (cf. programme-nutrition-jour.ts), il
// suffit de les regrouper.
//
// Le tri par rayon repose sur une table de mots-clés. Un aliment non
// reconnu tombe dans "Autres" plutôt que dans un rayon deviné : envoyer
// quelqu'un chercher du poisson au rayon fruits lui fait perdre son temps.

export type RayonNom =
  | "Fruits & légumes"
  | "Boucherie & poissonnerie"
  | "Crèmerie & œufs"
  | "Épicerie"
  | "Surgelés"
  | "Autres";

export type LigneCourse = { texte: string; jours: string[] };
export type Rayon = { nom: RayonNom; lignes: LigneCourse[] };

const TABLE_RAYONS: { rayon: RayonNom; motifs: string[] }[] = [
  {
    rayon: "Fruits & légumes",
    motifs: ["tomate", "salade", "épinard", "epinard", "brocoli", "courgette", "carotte", "poivron",
      "oignon", "ail", "champignon", "concombre", "avocat", "banane", "pomme", "orange", "fraise",
      "myrtille", "framboise", "citron", "patate douce", "haricot vert", "chou", "poireau", "aubergine",
      "betterave", "radis", "céleri", "celeri", "mangue", "ananas", "kiwi", "raisin", "poire"],
  },
  {
    rayon: "Boucherie & poissonnerie",
    motifs: ["poulet", "dinde", "bœuf", "boeuf", "steak", "veau", "porc", "jambon", "saumon", "thon",
      "cabillaud", "colin", "crevette", "sardine", "maquereau", "truite", "escalope", "filet", "viande",
      "poisson", "merlu", "lieu noir"],
  },
  {
    rayon: "Crèmerie & œufs",
    motifs: ["œuf", "oeuf", "lait", "yaourt", "skyr", "fromage blanc", "fromage", "beurre", "crème",
      "creme", "mozzarella", "feta", "parmesan", "cottage", "petit-suisse", "kéfir", "kefir"],
  },
  {
    rayon: "Épicerie",
    motifs: ["riz", "pâtes", "pates", "quinoa", "avoine", "flocons", "pain", "semoule", "boulgour",
      "lentille", "pois chiche", "haricot rouge", "huile", "vinaigre", "miel", "amande", "noix",
      "noisette", "cacahuète", "cacahuete", "beurre de cacahuète", "chocolat", "cacao", "farine",
      "sucre", "sel", "poivre", "épice", "epice", "thon en boîte", "conserve", "galette de riz",
      "protéine en poudre", "proteine en poudre", "whey", "graine", "chia", "lin", "sésame", "sesame"],
  },
  { rayon: "Surgelés", motifs: ["surgelé", "surgele", "congelé", "congele", "glace"] },
];

function rayonPour(ligne: string): RayonNom {
  const normalise = ligne.toLowerCase();
  const trouve = TABLE_RAYONS.find((r) => r.motifs.some((m) => normalise.includes(m)));
  return trouve?.rayon ?? "Autres";
}

// Découpe une chaîne "quantite" en lignes d'aliments. Les modèles séparent
// le plus souvent par virgule ou point-virgule ; on coupe donc là-dessus,
// jamais sur l'espace, qui casserait "blanc de poulet" en deux entrées.
function decouperAliments(quantite: string): string[] {
  return quantite
    .split(/[;,]|\s+\+\s+/)
    .map((t) => t.trim().replace(/\.$/, ""))
    .filter((t) => t.length > 2);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const ORDRE: RayonNom[] = [
  "Fruits & légumes",
  "Boucherie & poissonnerie",
  "Crèmerie & œufs",
  "Épicerie",
  "Surgelés",
  "Autres",
];

export function construireListeCourses(contenu: unknown): Rayon[] {
  if (!isPlainObject(contenu) || !Array.isArray(contenu.jours)) return [];

  // Clé normalisée → ligne. Regroupe "100g de poulet" et "Poulet 100 g"
  // sous une seule entrée, en gardant la formulation la plus complète.
  const parAliment = new Map<string, LigneCourse>();

  for (const jourData of contenu.jours) {
    if (!isPlainObject(jourData)) continue;
    const jour = typeof jourData.jour === "string" ? jourData.jour : "";
    const repas = Array.isArray(jourData.repas) ? jourData.repas : [];
    for (const r of repas) {
      if (!isPlainObject(r) || typeof r.quantite !== "string") continue;
      for (const aliment of decouperAliments(r.quantite)) {
        // Clé sans chiffres ni unités : c'est l'aliment qui compte pour le
        // regroupement, pas la quantité d'un repas précis.
        const cle = aliment
          .toLowerCase()
          .replace(/\d+([.,]\d+)?\s*(g|kg|ml|cl|l|c\.?\s?[às]\.?\s?[sc]\.?|cuill[èe]re?s?|tranches?|portions?)?/g, "")
          .replace(/\b(de|du|des|d'|la|le|les|un|une)\b/g, "")
          .replace(/[^a-zà-ÿ\s]/g, "")
          .trim();
        if (cle.length < 3) continue;

        const existant = parAliment.get(cle);
        if (existant) {
          if (jour && !existant.jours.includes(jour)) existant.jours.push(jour);
          if (aliment.length > existant.texte.length) existant.texte = aliment;
        } else {
          parAliment.set(cle, { texte: aliment, jours: jour ? [jour] : [] });
        }
      }
    }
  }

  const parRayon = new Map<RayonNom, LigneCourse[]>();
  for (const ligne of parAliment.values()) {
    const rayon = rayonPour(ligne.texte);
    const liste = parRayon.get(rayon) ?? [];
    liste.push(ligne);
    parRayon.set(rayon, liste);
  }

  return ORDRE.filter((nom) => (parRayon.get(nom)?.length ?? 0) > 0).map((nom) => ({
    nom,
    lignes: (parRayon.get(nom) ?? []).sort((a, b) => a.texte.localeCompare(b.texte, "fr")),
  }));
}
