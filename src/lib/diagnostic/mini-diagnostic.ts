// Logique du mini-diagnostic (résultat du quiz public /diagnostic), extraite
// pour être partagée entre l'affichage à l'écran (diagnostic-quiz.tsx) et
// l'email envoyé au lead (/api/diagnostic-lead) — garantit que les deux
// disent exactement la même chose, calculé une seule fois. Règles simples,
// pas d'appel IA (gratuit, non-abusable).

export type ReponsesDiagnostic = {
  persona?: string[];
  niveau?: string | null;
  objectif?: string | null;
  equipement?: string[];
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

export type MiniDiagnostic = {
  titre: string;
  accroche: string;
  alerte: string | null;
  split: string | null;
  exercices: string[];
  nutrition: string | null;
  recuperation: string | null;
  recommandation: { plan: "GRATUIT" | "STANDARD"; label: string; raison: string };
};

export function buildMiniDiagnostic(r: ReponsesDiagnostic): MiniDiagnostic | null {
  const { niveau, objectif, equipement = [], frequence, persona = [], sante = [] } = r;
  if (!niveau || !objectif || equipement.length === 0 || !frequence) return null;

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

  return {
    titre: `Profil ${niveau.toLowerCase()} — objectif ${objectif.toLowerCase()}`,
    accroche: accrochePour(persona),
    alerte: sante.length > 0 ? `Signalé : ${sante.join(", ")} — le vrai programme évite les mouvements à risque pour ces zones.` : null,
    split: SPLIT_PAR_FREQUENCE[frequence] ?? null,
    exercices: exemples.map((nom) => `${nom} — ${series}`),
    nutrition: r.habitudesAlimentaires ? NUTRITION_TIPS[r.habitudesAlimentaires] ?? null : null,
    recuperation: r.qualiteSommeil ? SOMMEIL_TIPS[r.qualiteSommeil] ?? null : null,
    recommandation,
  };
}

// Version texte brut du diagnostic, pour l'email envoyé au lead.
export function miniDiagnosticEnTexte(d: MiniDiagnostic, appUrl: string): string {
  const lignes = [
    `${d.titre}.`,
    "",
    d.accroche,
  ];
  if (d.alerte) lignes.push("", d.alerte);
  lignes.push(
    "",
    "ENTRAÎNEMENT",
    ...(d.split ? [d.split] : []),
    ...d.exercices.map((e) => `- ${e}`)
  );
  if (d.nutrition) lignes.push("", "NUTRITION", d.nutrition);
  if (d.recuperation) lignes.push("", "RÉCUPÉRATION", d.recuperation);
  lignes.push(
    "",
    `NOTRE RECOMMANDATION : ${d.recommandation.label}`,
    d.recommandation.raison,
    "",
    `Pour aller plus loin : ${appUrl}/sign-up${d.recommandation.plan === "STANDARD" ? "?plan=STANDARD" : ""}`
  );
  return lignes.join("\n");
}
