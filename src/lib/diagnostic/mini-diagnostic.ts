// Logique du mini-diagnostic (résultat du quiz public /diagnostic), extraite
// pour être partagée entre l'affichage à l'écran (diagnostic-quiz.tsx) et
// l'email envoyé au lead (/api/diagnostic-lead) — garantit que les deux
// disent exactement la même chose, calculé une seule fois. Règles simples,
// pas d'appel IA (gratuit, non-abusable).

// Option "pas de douleur" sur l'étape contraintes santé du quiz — exportée
// ici (source unique) pour que le composant et cette logique s'accordent
// sur le même libellé exact, sans jamais compter cette réponse comme un
// vrai signal de douleur/contrainte (cf. demande d'Anthony du 11/08/2026).
export const AUCUNE_DOULEUR_LABEL = "Aucune, je suis en pleine forme";

function santeReelle(sante: string[]): string[] {
  return sante.filter((s) => s !== AUCUNE_DOULEUR_LABEL);
}

export type ReponsesDiagnostic = {
  persona?: string[];
  activiteQuotidienne?: string | null;
  niveau?: string | null;
  objectif?: string | null;
  equipement?: string[];
  lieu?: string | null;
  duree?: string | null;
  frequence?: string | null;
  habitudesAlimentaires?: string | null;
  qualiteSommeil?: string | null;
  sante?: string[];
  // Choix de coach fait à l'étape "coach" du quiz (16/08/2026, modèle Future)
  // — utilisé uniquement pour la recommandation de formule ci-dessous,
  // jamais pour affecter un coach humain réel.
  coachPreference?: "FULL_IA" | "HYBRIDE" | "VIP_PRESENTIEL" | null;
  // Localisation et budget (04/09/2026, demande Anthony : "il faut orienter
  // la personne sur l'accompagnement le mieux adapté — si elle n'habite
  // pas Paris pas de présentiel VIP, orienté vers le remote ; si elle n'a
  // pas le budget, l'offre IA... le diag filtre oriente en plus de faire
  // le bilan forme"). Posées après l'étape "coach" : la personne dit
  // d'abord ce qu'elle voudrait dans l'idéal, puis ces deux réponses
  // servent à recadrer vers ce qui est réellement faisable — cf.
  // recommanderFormule() ci-dessous.
  localisation?: "PARIS" | "AILLEURS" | null;
  budget?: "ACCOMPAGNEMENT_HUMAIN" | "COMMENCER_IA" | null;
};

const EXEMPLES_DEFAUT = ["pompes", "squats au poids du corps", "gainage"];
const EXEMPLES_PAR_EQUIPEMENT: Record<string, string[]> = {
  "Salle de sport complète": ["développé couché", "tirage poulie haute", "presse à cuisses"],
  "Matériel à la maison (haltères, bancs...)": ["développé haltères", "rowing haltère", "fentes"],
  "Élastiques / bandes de résistance": ["squat élastique", "tirage horizontal élastique", "extension triceps élastique"],
  Kettlebell: ["swing kettlebell", "goblet squat", "soulevé de terre roumain kettlebell"],
  "TRX / sangles de suspension": ["rowing TRX", "pompes TRX", "fentes bulgares TRX"],
  "Aucun matériel": EXEMPLES_DEFAUT,
};

export function exemplesPour(equipement: string): string[] {
  return EXEMPLES_PAR_EQUIPEMENT[equipement] ?? EXEMPLES_DEFAUT;
}

export const SPLIT_PAR_FREQUENCE: Record<string, string> = {
  "1 fois par semaine": "Full Body x1 — une séance complète, tout le corps travaillé pour rentabiliser au maximum cette unique séance.",
  "2 fois par semaine": "Full Body x2 — tout le corps à chaque séance, pour maximiser la fréquence de travail malgré le nombre réduit de séances.",
  "3 fois par semaine": "Full Body x3 ou Push/Pull/Legs x3 — bon équilibre entre fréquence et récupération à ce rythme.",
  "4 fois par semaine": "Upper/Lower x4 — haut et bas du corps alternés, permet un bon volume par groupe musculaire.",
  "5 fois par semaine": "Split par groupe musculaire (type Push/Pull/Legs x2 + 1) — tenable à ce volume, à condition de bien gérer la récupération.",
  "6 fois ou plus par semaine": "Split par groupe musculaire (type Push/Pull/Legs x2) — volume élevé, récupération à surveiller de près à ce rythme.",
};

export const SERIES_PAR_NIVEAU: Record<string, string> = {
  Débutant: "3 séries de 10 à 12 répétitions",
  Intermédiaire: "4 séries de 8 à 12 répétitions",
  Avancé: "4 à 5 séries de 6 à 10 répétitions",
};

const ACCROCHE_PAR_PERSONA: Record<string, string> = {
  "Je ne sais pas quoi faire à la salle":
    "Le plus gros progrès pour toi ne sera pas de t'entraîner plus, mais d'avoir enfin un plan clair à suivre séance après séance.",
  "Je suis plutôt sédentaire":
    "Le plus dur est déjà fait : tu es sur cette page. La suite, c'est démarrer doucement mais régulièrement — la régularité bat l'intensité au départ.",
  "Je m'entraîne à la maison, sans structure":
    "Tu as déjà la discipline de t'entraîner seul — il ne manque qu'une vraie structure pour transformer cet effort en résultats visibles.",
  "Même programme depuis des années, sans résultat":
    "Un plateau qui dure ne veut pas dire qu'il faut travailler plus dur — plus souvent, qu'il faut changer d'approche.",
  "Je veux progresser sans me blesser":
    "Bon réflexe : sur la durée, la progressivité et la technique comptent plus que la charge.",
};
const ACCROCHE_DEFAUT = "Voici ce qu'on peut déjà dire à partir de tes réponses.";

export function accrochePour(personas: string[]): string {
  return personas.map((p) => ACCROCHE_PAR_PERSONA[p]).find(Boolean) ?? ACCROCHE_DEFAUT;
}

export const NUTRITION_TIPS: Record<string, string> = {
  "Repas structurés et équilibrés":
    "Bonne base déjà en place — l'ajustement se fera surtout sur les quantités, pas sur la structure.",
  "Grignotage fréquent / repas irréguliers":
    "Le grignotage dilue souvent les apports sans qu'on s'en rende compte : structurer 3-4 repas fixes est souvent le premier levier, avant même de compter les calories.",
  "Jeûne intermittent":
    "Ça peut fonctionner, à condition que ta fenêtre alimentaire couvre assez de protéines pour soutenir l'entraînement.",
  "Beaucoup de plats préparés ou fast-food":
    "Les plats préparés sont souvent plus caloriques et moins riches en protéines qu'ils n'en ont l'air — remplacer ne serait-ce qu'un repas par jour par du fait-maison change déjà beaucoup.",
  "Déjà suivi par un nutritionniste":
    "Un vrai programme s'appuierait sur ce suivi plutôt que de le dupliquer.",
};

// Repère générique d'hydratation par fréquence d'entraînement (pas une
// mesure personnalisée — même principe que SERIES_PAR_NIVEAU : une règle
// standard de nutrition sportive, jamais un chiffre inventé pour cette
// personne précise).
export const HYDRATATION_TIPS: Record<string, string> = {
  "1 fois par semaine": "1,5 à 2L d'eau par jour suffisent en général — un peu plus autour de ta séance.",
  "2 fois par semaine": "Vise 2L d'eau par jour, et un peu plus les jours d'entraînement.",
  "3 fois par semaine": "À ce rythme, 2 à 2,5L par jour t'aident à mieux récupérer entre les séances.",
  "4 fois par semaine": "2 à 2,5L par jour, avec une attention particulière avant et après chaque séance.",
  "5 fois par semaine": "2,5L par jour minimum à ce volume d'entraînement, réparti sur la journée plutôt qu'en une fois.",
  "6 fois ou plus par semaine": "2,5 à 3L par jour à ce rythme — même une légère déshydratation dégrade vite la performance et la récupération.",
};

export const SOMMEIL_TIPS: Record<string, string> = {
  "Mauvaise (moins de 5h, sommeil agité)":
    "En dessous de 5h, la récupération musculaire — et la capacité à bien manger — en pâtissent : c'est souvent plus limitant que l'entraînement lui-même.",
  "Moyenne (5-6h, réveils fréquents)":
    "Gagner ne serait-ce que 30 à 45 minutes de sommeil se traduit souvent directement par de meilleures séances.",
  "Bonne (7-8h, plutôt réparateur)": "Bonne base pour bien récupérer entre les séances.",
  "Excellente (8h ou plus, réparateur)":
    "Excellent terrain pour progresser — peu de monde a cette régularité, c'est un vrai avantage.",
};

// Bloc "Voici ce que COAI a compris de toi" (Phase 5, 11/08/2026) — chaque
// champ vient directement d'une réponse au quiz, jamais inventé.
export type ProfilStructure = {
  objectif: string;
  rythme: string;
  format: string;
  environnement: string;
  frein: string | null;
};

export type MiniDiagnostic = {
  titre: string;
  accroche: string;
  alerte: string | null;
  pointsATravailler: string[];
  pointsResolus: string[];
  split: string | null;
  exercices: string[];
  nutrition: string | null;
  recuperation: string | null;
  hydratation: string | null;
  recommandation: { service: "IMPULSION" | "TRANSFORMATION" | "VIP"; label: string; raison: string };
  profil: ProfilStructure;
  profilParagraphe: string;
  pitchEvolution: string;
  indiceCoai: {
    score: number;
    niveau: "À révéler" | "Prometteur" | "Élevé" | "Très élevé";
    actions: Array<{ titre: string; impact: string }>;
  };
};

// Reprend l'axe de marque retenu par Anthony (11/08/2026, en mémoire dans
// CLAUDE.md) : COAI n'est pas un générateur one-shot, la promesse tient sur
// la durée grâce au moteur d'adaptation réel (Phases 1-3), pas juste un
// argument marketing.
export const PITCH_EVOLUTION =
  "COAI n'est pas un générateur de programmes. COAI est un coaching qui apprend. Plus COAI te connaît, meilleur devient ton coaching. Ce diagnostic n'est qu'un point de départ : ton vrai programme, une fois créé, s'ajuste à chaque séance, chaque check-in, chaque changement dans ta vie.";

const FREIN_PAR_PERSONA: Record<string, string> = {
  "Je ne sais pas quoi faire à la salle": "Pas de structure claire à suivre",
  "Je suis plutôt sédentaire": "Manque de régularité pour démarrer",
  "Je m'entraîne à la maison, sans structure": "Pas de plan structuré",
  "Même programme depuis des années, sans résultat": "Plateau de progression",
  "Je veux progresser sans me blesser": "Prudence à avoir sur les blessures",
};

function calculerFrein(persona: string[], sante: string[]): string | null {
  const freins: string[] = [];
  const freinPersona = persona.map((p) => FREIN_PAR_PERSONA[p]).find(Boolean);
  if (freinPersona) freins.push(freinPersona);
  if (sante.length > 0) freins.push(`Contrainte physique à ménager (${sante.join(", ")})`);
  return freins.length > 0 ? freins.join(" + ") : null;
}

function calculerProfilStructure(r: ReponsesDiagnostic, sante: string[]): ProfilStructure {
  const frequenceLabel = r.frequence ?? "Rythme à définir";
  const rythme = r.duree ? `${frequenceLabel}, ${r.duree.toLowerCase()} par séance` : frequenceLabel;
  const formatLabel = (SPLIT_PAR_FREQUENCE[r.frequence ?? ""] ?? "").split(" — ")[0];
  const environnement = r.lieu ?? r.equipement?.[0] ?? "Non renseigné";
  return {
    objectif: r.objectif ?? "Non renseigné",
    rythme,
    format: formatLabel || "À déterminer selon ton profil complet",
    environnement,
    frein: calculerFrein(r.persona ?? [], sante),
  };
}

function construireProfilParagraphe(r: ReponsesDiagnostic, profil: ProfilStructure): string {
  const niveauTxt = r.niveau ? r.niveau.toLowerCase() : "ton niveau";
  const rythmeTxt = profil.rythme.toLowerCase();
  const environnementTxt = profil.environnement.toLowerCase();
  const freinTxt = profil.frein ? ` Ton frein principal aujourd'hui : ${profil.frein.toLowerCase()}.` : "";
  return `Tu es ${niveauTxt}, avec l'objectif de ${profil.objectif.toLowerCase()}. Tu comptes t'entraîner ${rythmeTxt}, principalement dans cet environnement : ${environnementTxt}.${freinTxt} C'est exactement ce que COAI utilise pour construire — puis faire évoluer — ton programme.`;
}

// Message sur le délai de résultats — volontairement identique pour tout le
// monde plutôt que fragmenté par niveau (demande d'Anthony du 11/08 d'être
// "le plus simple et efficace" ; le niveau influence déjà le programme via
// SERIES_PAR_NIVEAU, pas la peine de dupliquer la nuance ici).
export const RESULTATS_TIMELINE =
  "Avec un programme adapté et un vrai suivi, les premiers effets se font généralement sentir dès 6 semaines, et l'atteinte de ton objectif sous 3 mois.";

const STRUCTURE_PERSONAS = [
  "Je ne sais pas quoi faire à la salle",
  "Je m'entraîne à la maison, sans structure",
  "Même programme depuis des années, sans résultat",
];
const NUTRITION_A_AMELIORER = ["Grignotage fréquent / repas irréguliers", "Beaucoup de plats préparés ou fast-food"];
const SOMMEIL_A_AMELIORER = ["Mauvaise (moins de 5h, sommeil agité)", "Moyenne (5-6h, réveils fréquents)"];

// Les "points à travailler" recadrent le diagnostic en problème → solution
// (demande d'Anthony du 11/08) : avant de vendre COAI, on nomme clairement
// ce qui freine la personne aujourd'hui à partir de ses propres réponses.
function calculerPointsATravailler(r: ReponsesDiagnostic, sante: string[]): string[] {
  const points: string[] = [];
  if (sante.length > 0) {
    points.push("Une contrainte physique non accompagnée, qui expose à la blessure ou freine la progression.");
  }
  if ((r.persona ?? []).some((p) => STRUCTURE_PERSONAS.includes(p))) {
    points.push("Pas de structure d'entraînement claire aujourd'hui, ce qui limite tes résultats.");
  }
  if (r.habitudesAlimentaires && NUTRITION_A_AMELIORER.includes(r.habitudesAlimentaires)) {
    points.push("Des habitudes alimentaires qui ne soutiennent pas encore ton objectif.");
  }
  if (r.qualiteSommeil && SOMMEIL_A_AMELIORER.includes(r.qualiteSommeil)) {
    points.push("Un sommeil qui freine ta récupération et donc tes progrès.");
  }
  if (r.objectif) {
    points.push(`L'objectif "${r.objectif.toLowerCase()}" pas encore atteint avec ta routine actuelle.`);
  }
  return points.slice(0, 4);
}

// Miroir exact de calculerPointsATravailler (mêmes conditions, même ordre)
// pour que les deux listes restent alignées point par point dans le bloc
// "Aujourd'hui → Avec COAI" (demande d'Anthony du 14/08/2026 : montrer
// clairement où la personne en est et où COAI peut l'emmener). Chaque
// résolution reste ancrée dans ce que COAI fait réellement (programme
// validé par un coach, moteur d'adaptation) — jamais un chiffre ou un délai
// inventé, cf. RESULTATS_TIMELINE pour la seule promesse de délai, déjà
// volontairement générique.
function calculerPointsResolus(r: ReponsesDiagnostic, sante: string[]): string[] {
  const points: string[] = [];
  if (sante.length > 0) {
    points.push("Un programme qui respecte cette contrainte, contrôlé par un vrai coach avant d'être appliqué.");
  }
  if ((r.persona ?? []).some((p) => STRUCTURE_PERSONAS.includes(p))) {
    points.push("Un plan structuré, séance par séance, adapté à ton niveau et à ton matériel.");
  }
  if (r.habitudesAlimentaires && NUTRITION_A_AMELIORER.includes(r.habitudesAlimentaires)) {
    points.push("Des repères nutrition clairs, alignés avec ton objectif.");
  }
  if (r.qualiteSommeil && SOMMEIL_A_AMELIORER.includes(r.qualiteSommeil)) {
    points.push("Un accompagnement qui tient compte de ta récupération, pas seulement de l'entraînement.");
  }
  if (r.objectif) {
    points.push(`Un programme construit précisément pour "${r.objectif.toLowerCase()}", qui s'ajuste à chaque étape.`);
  }
  return points.slice(0, 4);
}

// Indice propriétaire de coaching, volontairement explicable et stable :
// il mesure la qualité du terrain disponible pour évoluer (régularité,
// récupération, habitudes et structure), jamais une aptitude génétique ou
// un état médical. Le score reste borné pour éviter toute fausse précision.
function calculerIndiceCoai(r: ReponsesDiagnostic, sante: string[]): MiniDiagnostic["indiceCoai"] {
  const frequence: Record<string, number> = {
    "1 fois par semaine": 8,
    "2 fois par semaine": 12,
    "3 fois par semaine": 16,
    "4 fois par semaine": 18,
    "5 fois par semaine": 17,
    "6 fois ou plus par semaine": 15,
  };
  const sommeil: Record<string, number> = {
    "Mauvaise (moins de 5h, sommeil agité)": 5,
    "Moyenne (5-6h, réveils fréquents)": 10,
    "Bonne (7-8h, plutôt réparateur)": 16,
    "Excellente (8h ou plus, réparateur)": 18,
  };
  const nutrition: Record<string, number> = {
    "Grignotage fréquent / repas irréguliers": 7,
    "Beaucoup de plats préparés ou fast-food": 6,
    "Jeûne intermittent": 13,
    "Repas structurés et équilibrés": 17,
    "Déjà suivi par un nutritionniste": 18,
  };
  const structureFragile = (r.persona ?? []).some((p) => STRUCTURE_PERSONAS.includes(p));
  const activiteQuotidienne = r.activiteQuotidienne?.startsWith("Assis") ? -4 : r.activiteQuotidienne?.includes("physique") ? 2 : 0;
  // Recalibrage commercial du score initial (17/08/2026) : l'ancienne
  // échelle amenait trop facilement un profil solide à 90-92/100, ce qui
  // laissait artificiellement très peu de marge de progression. Un bon
  // terrain de départ se situe désormais autour de 70-78 ; seuls les profils
  // exceptionnellement complets dépassent 80.
  const base = 16;
  const score = Math.max(38, Math.min(84,
    base +
    (frequence[r.frequence ?? ""] ?? 10) +
    (sommeil[r.qualiteSommeil ?? ""] ?? 9) +
    (nutrition[r.habitudesAlimentaires ?? ""] ?? 10) +
    (structureFragile ? 6 : 11) -
    (sante.length > 0 ? 4 : 0) +
    activiteQuotidienne
  ));

  const actions: Array<{ titre: string; impact: string }> = [];
  if (r.qualiteSommeil && SOMMEIL_A_AMELIORER.includes(r.qualiteSommeil)) {
    actions.push({ titre: "Gagner 30 à 45 minutes de sommeil", impact: "+4 à 6 points" });
  }
  if (r.habitudesAlimentaires && NUTRITION_A_AMELIORER.includes(r.habitudesAlimentaires)) {
    actions.push({ titre: "Structurer trois repas réguliers", impact: "+3 à 5 points" });
  }
  if (structureFragile) {
    actions.push({ titre: "Suivre un plan clair séance après séance", impact: "+4 à 7 points" });
  }
  if ((r.persona ?? []).includes("Je suis plutôt sédentaire")) {
    actions.push({ titre: "Ajouter 2 000 pas par jour", impact: "+2 à 4 points" });
  }
  if (sante.length > 0) {
    actions.push({ titre: "Adapter les mouvements à ta contrainte", impact: "progression sécurisée" });
  }
  // Bug corrigé (20/08/2026, signalé par Anthony : "tes 3 premiers pas"
  // n'en affichait que 2) — ces trois secours étaient chacun un `if`
  // séparé au lieu d'une boucle : avec 0 action conditionnelle poussée
  // au-dessus (profil sans point faible détecté), les deux premiers `if`
  // suffisaient à peine à 2 éléments, jamais 3. Boucle jusqu'à 3, sur une
  // liste de secours volontairement plus longue que nécessaire.
  const secours = [
    { titre: `Tenir ton rythme de ${r.frequence?.toLowerCase() ?? "séances"}`, impact: "+3 à 5 points" },
    { titre: "Compléter ton check-in chaque semaine", impact: "adaptation plus précise" },
    { titre: "Suivre ton programme personnalisé", impact: "progression mesurée" },
  ];
  for (const item of secours) {
    if (actions.length >= 3) break;
    actions.push(item);
  }

  const niveau = score >= 78 ? "Très élevé" : score >= 68 ? "Élevé" : score >= 55 ? "Prometteur" : "À révéler";
  return { score, niveau, actions: actions.slice(0, 3) };
}

// Recommandation de formule (19/08/2026, demande Anthony : "proposer une
// solution au prospect... en passant par les plusieurs formules si
// besoin") — miroir du moteur post-inscription (detecterBesoins,
// src/lib/dashboard/besoins-identifies.ts) mais appliqué aux réponses
// brutes du quiz public, avant tout compte créé. Une seule formule choisie
// (pas une liste), par ordre de priorité :
// 1. Choix explicite "VIP présentiel/visio" à l'étape coach — priorité
//    absolue, c'est le signal le plus direct qu'on puisse avoir.
// 2. Contrainte de santé signalée — garde-fou sécurité qui prime sur
//    n'importe quel choix initial, jamais un accompagnement 100% IA seul
//    face à une contrainte physique réelle.
// 3. Choix explicite "hybride" à l'étape coach.
// 4. Niveau avancé + objectif de force/performance — optimisation fine,
//    VIP même si "full IA" avait été coché par défaut.
// 5. Plateau de progression qui dure (persona) — un suivi humain casse
//    souvent un plateau mieux qu'un simple nouveau programme.
// 6. Par défaut : Pass IA, le point de départ recommandé.
function recommanderFormule(r: ReponsesDiagnostic, sante: string[]): MiniDiagnostic["recommandation"] {
  // Filtre budget (04/09/2026) : priorité absolue sur tout le reste,
  // coachPreference inclus. Recommander un accompagnement humain à
  // quelqu'un qui vient de dire ne pas en avoir les moyens serait
  // contre-productif — retour direct, sans même évaluer le reste du
  // profil.
  if (r.budget === "COMMENCER_IA") {
    return {
      service: "IMPULSION",
      label: "Standard IA",
      raison: "Tu préfères commencer sans engagement financier : Standard IA te donne un programme complet et un Personal Trainer IA disponible 24h/24, avec mon WhatsApp en renfort si besoin.",
    };
  }

  const persona = r.persona ?? [];
  const avanceExigeant = r.niveau === "Avancé" && /force|performance/i.test(r.objectif ?? "");
  const plateau = persona.includes("Même programme depuis des années, sans résultat");

  const brute: MiniDiagnostic["recommandation"] = (() => {
    if (r.coachPreference === "VIP_PRESENTIEL") {
      return {
        service: "VIP",
        label: "VIP Présentiel",
        raison: "Tu as choisi l'attention maximale : un accompagnement 1-to-1 avec Anthony, à domicile, en entreprise, en club ou à distance.",
      };
    }
    if (sante.length > 0) {
      return {
        service: "TRANSFORMATION",
        label: "Premium Remote",
        raison: "Vu la contrainte que tu as signalée, un coach diplômé d'État qui valide et suit ton programme nous semble plus rassurant.",
      };
    }
    if (r.coachPreference === "HYBRIDE") {
      return {
        service: "TRANSFORMATION",
        label: "Premium Remote",
        raison: "Tu as choisi de combiner la disponibilité de l'IA et le regard d'un coach humain.",
      };
    }
    if (avanceExigeant) {
      return {
        service: "VIP",
        label: "VIP Présentiel",
        raison: "Ton niveau et ton objectif de performance justifient un accompagnement 1-to-1, pas juste un programme à suivre seul.",
      };
    }
    if (plateau) {
      return {
        service: "TRANSFORMATION",
        label: "Premium Remote",
        raison: "Casser un plateau qui dure demande souvent un vrai suivi humain, pas juste un nouveau programme.",
      };
    }
    return {
      service: "IMPULSION",
      label: "Standard IA",
      raison: "Ton profil te permet de démarrer avec un Personal Trainer IA disponible 24h/24, tout en conservant un programme évolutif.",
    };
  })();

  // Filtre localisation (04/09/2026) : le VIP Présentiel suppose de vraies
  // séances avec Anthony (domicile, club, entreprise) donc n'a de sens qu'à
  // Paris/proche, quelle que soit la raison qui a mené à cette
  // recommandation (préférence explicite ou niveau avancé) — ailleurs,
  // Premium Remote donne le même accompagnement individuel, à distance.
  if (brute.label === "VIP Présentiel" && r.localisation === "AILLEURS") {
    return {
      service: "TRANSFORMATION",
      label: "Premium Remote",
      raison: "Le VIP Présentiel se fait uniquement à Paris et ses environs. Depuis chez toi, Premium Remote te donne le même accompagnement individuel avec moi, à distance.",
    };
  }

  return brute;
}

export function buildMiniDiagnostic(r: ReponsesDiagnostic): MiniDiagnostic | null {
  const { niveau, objectif, equipement = [], frequence, persona = [], sante: santeBrute = [] } = r;
  if (!niveau || !objectif || equipement.length === 0 || !frequence) return null;
  const sante = santeReelle(santeBrute);

  const premierEquipement = equipement[0] ?? "Aucun matériel";
  const exemples = exemplesPour(premierEquipement);
  const series = SERIES_PAR_NIVEAU[niveau] ?? SERIES_PAR_NIVEAU.Débutant;

  const profil = calculerProfilStructure(r, sante);

  return {
    titre: `Profil ${niveau.toLowerCase()} — objectif ${objectif.toLowerCase()}`,
    accroche: accrochePour(persona),
    alerte: sante.length > 0 ? `Signalé : ${sante.join(", ")} — le vrai programme évite les mouvements à risque pour ces zones.` : null,
    pointsATravailler: calculerPointsATravailler(r, sante),
    pointsResolus: calculerPointsResolus(r, sante),
    split: SPLIT_PAR_FREQUENCE[frequence] ?? null,
    exercices: exemples.map((nom) => `${nom} — ${series}`),
    nutrition: r.habitudesAlimentaires ? NUTRITION_TIPS[r.habitudesAlimentaires] ?? null : null,
    recuperation: r.qualiteSommeil ? SOMMEIL_TIPS[r.qualiteSommeil] ?? null : null,
    hydratation: HYDRATATION_TIPS[frequence] ?? null,
    recommandation: recommanderFormule(r, sante),
    profil,
    profilParagraphe: construireProfilParagraphe(r, profil),
    pitchEvolution: PITCH_EVOLUTION,
    indiceCoai: calculerIndiceCoai(r, sante),
  };
}

// Version texte brut du diagnostic, pour l'email envoyé au lead.
// `cta` (Phase 5.1, 11/08/2026) : surchage le lien final selon le statut réel
// du destinataire (prospect non abonné / abonné au profil incomplet / abonné
// avec un programme) — cf. /api/diagnostic-lead, qui détermine ce statut par
// email avant d'appeler cette fonction. Reste sur le lien sign-up générique
// par défaut si aucun statut particulier n'a pu être déterminé.
export function miniDiagnosticEnTexte(
  d: MiniDiagnostic,
  appUrl: string,
  cta?: { label: string; href: string }
): string {
  const lignes = [
    `${d.titre}.`,
    "",
    d.accroche,
    "",
    d.profilParagraphe,
  ];
  if (d.alerte) lignes.push("", d.alerte);
  if (d.pointsATravailler.length > 0) {
    lignes.push("", "AUJOURD'HUI", ...d.pointsATravailler.map((p) => `- ${p}`));
  }
  if (d.pointsResolus.length > 0) {
    lignes.push("", "AVEC COAI", ...d.pointsResolus.map((p) => `- ${p}`));
  }
  lignes.push(
    "",
    "ENTRAÎNEMENT",
    ...(d.split ? [d.split] : []),
    ...d.exercices.map((e) => `- ${e}`)
  );
  if (d.nutrition) lignes.push("", "NUTRITION", d.nutrition);
  if (d.recuperation) lignes.push("", "RÉCUPÉRATION", d.recuperation);
  if (d.hydratation) lignes.push("", "HYDRATATION", d.hydratation);
  lignes.push("", RESULTATS_TIMELINE);
  lignes.push(
    "",
    `NOTRE RECOMMANDATION : ${d.recommandation.label}`,
    d.recommandation.raison,
    "",
    "COAI est fondé par Anthony Darmon, coach diplômé d'État, 17 ans d'expérience en coaching sportif.",
    "",
    cta
      ? `${cta.label} : ${appUrl}${cta.href}`
      : `Pour aller plus loin : ${appUrl}/sign-up${PLAN_PARAM_PAR_SERVICE[d.recommandation.service]}`,
    "",
    "Cette expérience t'a plu ? Parles-en à quelqu'un qui a besoin de s'y mettre — une fois abonné(e), tu auras aussi ton propre lien de parrainage."
  );
  return lignes.join("\n");
}

const PLAN_PARAM_PAR_SERVICE: Record<MiniDiagnostic["recommandation"]["service"], string> = {
  IMPULSION: "",
  TRANSFORMATION: "?plan=STANDARD",
  VIP: "?plan=PREMIUM",
};
