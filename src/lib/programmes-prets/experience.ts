import type { CategorieProgrammePret, ProgrammePret } from "./catalogue";

export const PROGRAMME_DECOUVERTE_GRATUIT_SLUG = "mobilite-totale";

type VisuelConseil = { nom: string; image: string };

export type ExperienceProgramme = {
  materiel: string;
  planB: string;
  bilan: string[];
  checkIn: string[];
  nutritionVisuels: VisuelConseil[];
  recuperationVisuels: VisuelConseil[];
};

const NUTRITION: Partial<Record<CategorieProgrammePret, VisuelConseil[]>> = {
  PERTE_DE_POIDS: [
    { nom: "Skyr, pomme & granola", image: "/repas/petit-dejeuner-skyr-pomme-granola.jpg" },
    { nom: "Cabillaud, lentilles & carottes", image: "/repas/plat-cabillaud-lentilles-carottes.jpg" },
    { nom: "Bowl tempeh & patate douce", image: "/repas/dejeuner-bowl-tempeh-patate-douce-chou.jpg" },
    { nom: "Bowl skyr, kiwi & granola", image: "/repas/bowl-skyr-kiwi-granola.png" },
    { nom: "Salade lentilles, feta & légumes rôtis", image: "/repas/salade-lentilles-feta-legumes-rotis.png" },
  ],
  PRISE_DE_MASSE: [
    { nom: "Œufs & avocat", image: "/repas/petit-dejeuner-oeufs-avocat.jpg" },
    { nom: "Poulet, riz & haricots", image: "/repas/plat-poulet-riz-haricots.jpg" },
    { nom: "Bœuf & patate douce", image: "/repas/plat-boeuf-patate-douce-salade.jpg" },
    { nom: "Dinde, patate douce & haricots verts", image: "/repas/dinde-patate-douce-haricots-verts.png" },
  ],
  CARDIO_SEMI_MARATHON: [
    { nom: "Avoine & fruits rouges", image: "/repas/petit-dejeuner-avoine-fruits-rouges.jpg" },
    { nom: "Poulet, riz & haricots", image: "/repas/plat-poulet-riz-haricots.jpg" },
    { nom: "Saumon, quinoa & brocolis", image: "/repas/plat-saumon-quinoa-brocolis.jpg" },
  ],
  CARDIO_HYROX: [
    { nom: "Pancakes protéinés", image: "/repas/petit-dejeuner-pancakes-proteines-fruits-rouges.jpg" },
    { nom: "Pâtes, poulet & pesto", image: "/repas/dejeuner-pates-poulet-pesto-tomates.jpg" },
    { nom: "Saumon teriyaki & soba", image: "/repas/diner-saumon-teriyaki-nouilles-soba.jpg" },
  ],
  FITNESS_HYBRIDE: [
    { nom: "Burrito œufs & dinde", image: "/repas/petit-dejeuner-burrito-oeufs-dinde-epinards.jpg" },
    { nom: "Poulet satay & riz", image: "/repas/dejeuner-poulet-satay-riz-legumes.jpg" },
    { nom: "Wok de bœuf & nouilles", image: "/repas/plat-wok-boeuf-nouilles-riz.jpg" },
  ],
  FESSIERS: [
    { nom: "Omelette aux épinards", image: "/repas/petit-dejeuner-omelette-epinards.jpg" },
    { nom: "Poulet, boulgour & courgettes", image: "/repas/plat-poulet-boulgour-courgettes.jpg" },
    { nom: "Saumon, quinoa & brocolis", image: "/repas/plat-saumon-quinoa-brocolis.jpg" },
  ],
  RECUPERATION: [
    { nom: "Chia, mangue & coco", image: "/repas/petit-dejeuner-chia-mangue-coco.jpg" },
    { nom: "Bowl méditerranéen", image: "/repas/plat-bowl-mediterraneen-quinoa.jpg" },
    { nom: "Saumon & riz sauvage", image: "/repas/plat-saumon-papillote-riz-sauvage.jpg" },
    { nom: "Bouchées dattes, cacahuète & cacao", image: "/repas/bouchees-dattes-cacahuete-proteinees.png" },
  ],
};

const NUTRITION_DEFAUT: VisuelConseil[] = [
  { nom: "Omelette aux épinards", image: "/repas/petit-dejeuner-omelette-epinards.jpg" },
  { nom: "Poulet, boulgour & courgettes", image: "/repas/plat-poulet-boulgour-courgettes.jpg" },
  { nom: "Tofu, sarrasin & légumes", image: "/repas/plat-tofu-sarrasin-legumes.jpg" },
  { nom: "Salade lentilles, feta & légumes rôtis", image: "/repas/salade-lentilles-feta-legumes-rotis.png" },
];

const RECUPERATION: Partial<Record<CategorieProgrammePret, VisuelConseil[]>> = {
  CARDIO_SEMI_MARATHON: [
    { nom: "Mobilité de cheville", image: "/recuperation/recup-v4-femme-blonde-04-mobilite-cheville.png" },
    { nom: "Auto-massage des ischios", image: "/recuperation/recup3-14-foam-ischio-homme.jpg" },
    { nom: "Jambes au mur", image: "/recuperation/recup-v4-homme-metis-08-jambes-au-mur.png" },
    { nom: "Jambes sur chaise", image: "/recuperation/recup-v5-femme-blonde-jambes-chaise.png" },
  ],
  CARDIO_HYROX: [
    { nom: "Foam roller haut du dos", image: "/recuperation/recup-v4-homme-metis-03-foam-haut-dos.png" },
    { nom: "Étirement du mollet", image: "/recuperation/recup-v4-femme-blonde-03-etirement-mollet.png" },
    { nom: "Respiration diaphragmatique", image: "/recuperation/recup-v4-homme-metis-04-respiration-diaphragmatique.png" },
    { nom: "Dorsiflexion contre mur", image: "/recuperation/recup-v5-homme-metis-mobilite-cheville.png" },
  ],
  FITNESS_HYBRIDE: [
    { nom: "Percussion du mollet", image: "/recuperation/recup-v4-homme-metis-02-percussion-mollet.png" },
    { nom: "Mobilité 90/90", image: "/recuperation/recup-v4-homme-metis-06-mobilite-90-90.png" },
    { nom: "Hydratation", image: "/recuperation/recup-v4-femme-blonde-06-hydratation.png" },
    { nom: "Étirement des adducteurs", image: "/recuperation/recup-v5-homme-metis-etirement-adducteurs.png" },
  ],
  PRISE_DE_MASSE: [
    { nom: "Foam roller des ischios", image: "/recuperation/recup-v4-femme-blonde-01-foam-ischios.png" },
    { nom: "Percussion de l'épaule", image: "/recuperation/recup-v4-femme-blonde-02-percussion-epaule.png" },
    { nom: "Sommeil réparateur", image: "/recuperation/recup3-08-sommeil-homme.jpg" },
    { nom: "Couch stretch quadriceps", image: "/recuperation/recup-v5-femme-blonde-couch-stretch.png" },
  ],
  BUREAU: [
    { nom: "Détente de la nuque", image: "/recuperation/recup-v4-homme-metis-09-detente-nuque.png" },
    { nom: "Rotation thoracique", image: "/recuperation/recup-v4-homme-metis-07-open-book.png" },
    { nom: "Méditation courte", image: "/recuperation/recup3-05-meditation-femme.jpg" },
    { nom: "Jambes sur chaise", image: "/recuperation/recup-v5-femme-blonde-jambes-chaise.png" },
  ],
  RECUPERATION: [
    { nom: "Respiration diaphragmatique", image: "/recuperation/recup3-06-respiration-femme.jpg" },
    { nom: "Auto-massage du haut du dos", image: "/recuperation/recup3-15-foam-dos-homme.jpg" },
    { nom: "Sommeil réparateur", image: "/recuperation/recup3-08-sommeil-femme.jpg" },
    { nom: "Étirement des adducteurs", image: "/recuperation/recup-v5-homme-metis-etirement-adducteurs.png" },
  ],
};

const RECUPERATION_DEFAUT: VisuelConseil[] = [
  { nom: "Mobilité 90/90", image: "/recuperation/recup-v4-homme-metis-06-mobilite-90-90.png" },
  { nom: "Posture de l'enfant", image: "/recuperation/recup-v4-homme-metis-10-posture-enfant.png" },
  { nom: "Respiration diaphragmatique", image: "/recuperation/recup3-06-respiration-femme.jpg" },
  { nom: "Dorsiflexion contre mur", image: "/recuperation/recup-v5-homme-metis-mobilite-cheville.png" },
  { nom: "Jambes sur chaise", image: "/recuperation/recup-v5-femme-blonde-jambes-chaise.png" },
  { nom: "Étirement des adducteurs", image: "/recuperation/recup-v5-homme-metis-etirement-adducteurs.png" },
  { nom: "Couch stretch quadriceps", image: "/recuperation/recup-v5-femme-blonde-couch-stretch.png" },
];

function planB(categorie: CategorieProgrammePret) {
  if (categorie === "CARDIO_SEMI_MARATHON") return "15 min : 3 min de marche, 8 min de course facile, 4 min de retour au calme.";
  if (categorie === "CARDIO_HYROX" || categorie === "FITNESS_HYBRIDE") return "15 min : 3 tours de 3 mouvements, 40 s de travail / 20 s de transition, puis 3 min de retour au calme.";
  if (categorie === "RECUPERATION") return "10 min : choisis un seul protocole local, puis termine par 3 minutes de respiration lente.";
  if (categorie === "BUREAU") return "8 min au bureau : nuque, rotation thoracique, chaîne postérieure et 5 respirations lentes.";
  if (categorie === "MOBILITE" || categorie === "STRETCH") return "12 min : un mouvement hanches, un mouvement thoracique, un mouvement épaules, 2 tours sans douleur.";
  return "15 min : 3 tours du premier mouvement jambes, du premier mouvement haut du corps et du gainage de la séance, sans aller à l'échec.";
}

function materiel(programme: ProgrammePret) {
  if (programme.categorie === "TRX") return "Sangles de suspension et point d'ancrage sécurisé.";
  if (programme.categorie === "POIDS_DU_CORPS" || programme.categorie === "ABDOS") return "Un tapis et une surface stable ; élastique optionnel.";
  if (["MOBILITE", "STRETCH", "RECUPERATION", "BUREAU"].includes(programme.categorie)) return "Tapis, serviette ou sangle ; chaise et rouleau selon les séances.";
  if (programme.categorie === "CARDIO_SEMI_MARATHON") return "Chaussures adaptées, chronomètre et eau ; cardiofréquencemètre optionnel.";
  return "Haltères ou charges adaptées, tapis et chronomètre. Les alternatives sont indiquées dans les séances.";
}

export function getExperienceProgramme(programme: ProgrammePret): ExperienceProgramme {
  return {
    materiel: materiel(programme),
    planB: planB(programme.categorie),
    bilan: [
      "Note ton énergie, ton sommeil et les éventuelles douleurs sur 10 avant de commencer.",
      "Enregistre une mesure simple liée à l'objectif : répétitions propres, durée, charge ou amplitude confortable.",
      "Refais exactement le même repère à mi-parcours et pendant la dernière semaine.",
    ],
    checkIn: [
      "Ai-je réalisé les séances prévues sans dégrader ma technique ?",
      "Mon énergie, mon sommeil ou mes douleurs se sont-ils améliorés ou dégradés ?",
      "La semaine prochaine : je maintiens, je progresse légèrement ou j'allège de 20 %.",
    ],
    nutritionVisuels: NUTRITION[programme.categorie] ?? NUTRITION_DEFAUT,
    recuperationVisuels: RECUPERATION[programme.categorie] ?? RECUPERATION_DEFAUT,
  };
}
