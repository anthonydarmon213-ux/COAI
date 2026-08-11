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
  niveau?: string | null;
  objectif?: string | null;
  equipement?: string[];
  lieu?: string | null;
  duree?: string | null;
  frequence?: string | null;
  habitudesAlimentaires?: string | null;
  qualiteSommeil?: string | null;
  sante?: string[];
};

const EXEMPLES_DEFAUT = ["pompes", "squats au poids du corps", "gainage"];
const EXEMPLES_PAR_EQUIPEMENT: Record<string, string[]> = {
  "Salle de sport complète": ["développé couché", "tirage poulie haute", "presse à cuisses"],
  "Matériel à la maison (haltères, bancs...)": ["développé haltères", "rowing haltère", "fentes"],
  "Élastiques / bandes de résistance": ["squat élastique", "tirage horizontal élastique", "extension triceps élastique"],
  Kettlebell: ["swing kettlebell", "goblet squat", "soulevé de terre roumain kettlebell"],
  "TRX / sangles de suspension": ["rowing TRX", "pompes TRX", "fentes bulgares TRX"],
  "Poids du corps uniquement": EXEMPLES_DEFAUT,
};

export function exemplesPour(equipement: string): string[] {
  return EXEMPLES_PAR_EQUIPEMENT[equipement] ?? EXEMPLES_DEFAUT;
}

export const SPLIT_PAR_FREQUENCE: Record<string, string> = {
  "2 fois par semaine": "Full Body x2 — tout le corps à chaque séance, pour maximiser la fréquence de travail malgré le nombre réduit de séances.",
  "3 fois par semaine": "Full Body x3 ou Push/Pull/Legs x3 — bon équilibre entre fréquence et récupération à ce rythme.",
  "4 fois par semaine": "Upper/Lower x4 — haut et bas du corps alternés, permet un bon volume par groupe musculaire.",
  "5 fois ou plus par semaine": "Split par groupe musculaire (type Push/Pull/Legs x2) — tenable à ce volume, à condition de bien gérer la récupération.",
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
  split: string | null;
  exercices: string[];
  nutrition: string | null;
  recuperation: string | null;
  recommandation: { plan: "GRATUIT" | "STANDARD"; label: string; raison: string };
  profil: ProfilStructure;
  profilParagraphe: string;
  pitchEvolution: string;
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

export function buildMiniDiagnostic(r: ReponsesDiagnostic): MiniDiagnostic | null {
  const { niveau, objectif, equipement = [], frequence, persona = [], sante: santeBrute = [] } = r;
  if (!niveau || !objectif || equipement.length === 0 || !frequence) return null;
  const sante = santeReelle(santeBrute);

  const premierEquipement = equipement[0] ?? "Poids du corps uniquement";
  const exemples = exemplesPour(premierEquipement);
  const series = SERIES_PAR_NIVEAU[niveau] ?? SERIES_PAR_NIVEAU.Débutant;

  const aBesoinDeSuivi = sante.length > 0 || persona.includes("Même programme depuis des années, sans résultat");
  const recommandation = aBesoinDeSuivi
    ? {
        plan: "STANDARD" as const,
        label: "Transformation",
        raison:
          sante.length > 0
            ? "Vu la contrainte que tu as signalée, un coach diplômé d'État qui valide et suit ton programme nous semble plus rassurant."
            : "Casser un plateau qui dure demande souvent un vrai suivi humain, pas juste un nouveau programme.",
      }
    : {
        plan: "GRATUIT" as const,
        label: "Impulsion",
        raison: "Ton profil n'a pas de signal particulier — de quoi démarrer efficacement, sans surpayer.",
      };

  const profil = calculerProfilStructure(r, sante);

  return {
    titre: `Profil ${niveau.toLowerCase()} — objectif ${objectif.toLowerCase()}`,
    accroche: accrochePour(persona),
    alerte: sante.length > 0 ? `Signalé : ${sante.join(", ")} — le vrai programme évite les mouvements à risque pour ces zones.` : null,
    pointsATravailler: calculerPointsATravailler(r, sante),
    split: SPLIT_PAR_FREQUENCE[frequence] ?? null,
    exercices: exemples.map((nom) => `${nom} — ${series}`),
    nutrition: r.habitudesAlimentaires ? NUTRITION_TIPS[r.habitudesAlimentaires] ?? null : null,
    recuperation: r.qualiteSommeil ? SOMMEIL_TIPS[r.qualiteSommeil] ?? null : null,
    recommandation,
    profil,
    profilParagraphe: construireProfilParagraphe(r, profil),
    pitchEvolution: PITCH_EVOLUTION,
  };
}

// Version texte brut du diagnostic, pour l'email envoyé au lead.
export function miniDiagnosticEnTexte(d: MiniDiagnostic, appUrl: string): string {
  const lignes = [
    `${d.titre}.`,
    "",
    d.accroche,
    "",
    d.profilParagraphe,
  ];
  if (d.alerte) lignes.push("", d.alerte);
  if (d.pointsATravailler.length > 0) {
    lignes.push("", "CE QUI FREINE TA PROGRESSION AUJOURD'HUI", ...d.pointsATravailler.map((p) => `- ${p}`));
  }
  lignes.push(
    "",
    "ENTRAÎNEMENT",
    ...(d.split ? [d.split] : []),
    ...d.exercices.map((e) => `- ${e}`)
  );
  if (d.nutrition) lignes.push("", "NUTRITION", d.nutrition);
  if (d.recuperation) lignes.push("", "RÉCUPÉRATION", d.recuperation);
  lignes.push("", RESULTATS_TIMELINE);
  lignes.push(
    "",
    `NOTRE RECOMMANDATION : ${d.recommandation.label}`,
    d.recommandation.raison,
    "",
    "COAI est fondé par Anthony Darmon, coach diplômé d'État, 17 ans d'expérience en coaching sportif.",
    "",
    `Pour aller plus loin : ${appUrl}/sign-up${d.recommandation.plan === "STANDARD" ? "?plan=STANDARD" : ""}`,
    "",
    "Cette expérience t'a plu ? Parles-en à quelqu'un qui a besoin de s'y mettre — une fois abonné(e), tu auras aussi ton propre lien de parrainage."
  );
  return lignes.join("\n");
}
