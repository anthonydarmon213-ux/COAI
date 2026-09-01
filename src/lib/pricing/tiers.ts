import { buildWhatsAppLink } from "@/lib/whatsapp";

export type PlanCode = "GRATUIT" | "STANDARD" | "PREMIUM";

export type Tier = {
  nom: string;
  eyebrow: string;
  prix: string;
  suffixe: string;
  description: string;
  features: string[];
  plan: PlanCode;
  mostPopular?: boolean;
  limitedSpots?: boolean;
  trial?: boolean;
  // Offre "membre fondateur" (19/08/2026) : prix conservé tant que
  // l'abonnement reste actif pour les 100 premiers abonnés — cf.
  // src/lib/pricing/membre-fondateur.ts pour le
  // comptage réel (jamais un chiffre inventé).
  founderOffer?: boolean;
  sessions?: { count: 1 | 2 | 3 | 4; label: string; prix: string }[];
  // Facturation annuelle (21/08/2026, Pass IA seulement — cf.
  // checkout/route.ts) : "prix"/"suffixe" affichent l'équivalent mensuel en
  // gros (repère familier), "noteFacturation" précise en petit le vrai
  // rythme de prélèvement — jamais l'inverse, pour ne jamais donner
  // l'impression d'un prix mensuel qui ne sera pas le vrai prélèvement.
  factureAnnuellement?: boolean;
  noteFacturation?: string;
};

export const ENTREPRISE = {
  nom: "Entreprise",
  description: "Coaching pour vos équipes et collaborateurs — accompagnement sur mesure, sur devis.",
  features: [
    "Programme adapté aux contraintes de vos équipes",
    "Interventions ponctuelles ou accompagnement régulier",
    "Devis personnalisé selon vos effectifs et objectifs",
  ],
  whatsappHref: buildWhatsAppLink(
    "Bonjour Anthony, je souhaite échanger au sujet d'un accompagnement COAI pour mon entreprise."
  ),
  mailHref: `mailto:anthonydarmon213@hotmail.com?subject=${encodeURIComponent("Offre coaching entreprise")}`,
};

export const VIP_MESSAGE =
  "Bonjour Anthony, je souhaite échanger sur l'accompagnement VIP COAI et mes objectifs.";

export function vipReservationHref(sessionLabel = "accompagnement VIP", prix = "sur mesure"): string | null {
  return buildWhatsAppLink(
    `Bonjour Anthony, je souhaite échanger sur ${sessionLabel} (${prix}) et sur mes objectifs à plus long terme.`
  );
}

export const TIERS: Tier[] = [
  {
    nom: "Pass IA",
    eyebrow: "L'OFFRE ESSENTIELLE · TON PT 24H/24",
    prix: "19,99€",
    suffixe: "/mois",
    factureAnnuellement: false,
    noteFacturation: "Mensuel sans engagement · ou 9,92€/mois en annuel (119€ facturés une fois par an)",
    description:
      "L'expérience Personal Training réimaginée pour avancer en autonomie, avec un programme qui s'adapte à ta vraie vie.",
    features: [
      "Programme ultra-personnalisé selon ton diagnostic",
      "Entraînement, alimentation et récupération sur mesure",
      "Check-in quotidien : sommeil, forme, douleurs et temps disponible",
      "Séance adaptée chaque jour à tes réponses",
      "Coach IA disponible 24h/24 et 7j/7",
      "Suivi des séances, mesures et progrès",
    ],
    plan: "GRATUIT",
    mostPopular: true,
    trial: true,
    founderOffer: true,
  },
  {
    nom: "Coaching Hybride",
    eyebrow: "IA + REGARD HUMAIN",
    prix: "99€",
    suffixe: "/mois",
    description:
      "La rapidité de l'IA et la subtilité d'un coach humain : le bon niveau d'attention pour progresser sans rester seul.",
    features: [
      "Tout l'accompagnement Pass IA",
      "Programme relu et supervisé par un coach diplômé d'État",
      "Retour humain sur tes progrès et tes difficultés",
      "Ajustements en cas de plateau, gêne ou changement d'objectif",
      "Coach IA 24h/24 entre les échanges humains",
      "Priorité aux décisions sûres, réalistes et durables",
    ],
    plan: "STANDARD",
    trial: true,
  },
  {
    nom: "VIP",
    eyebrow: "ATTENTION MAXIMALE · PLACES ULTRA LIMITÉES",
    prix: "199€",
    suffixe: "/mois",
    description:
      "Pour les objectifs précis, les contraintes particulières et ceux qui veulent être suivis comme un sportif de haut niveau.",
    features: [
      "Tout l'accompagnement Coaching Hybride",
      "1 séance privée de Personal Training par mois incluse",
      "Visio partout ou présentiel à Paris centre",
      "Analyse approfondie des objectifs, douleurs et contraintes",
      "Ajustements prioritaires et attention maximale",
      "Créneaux et accompagnements volontairement ultra limités",
    ],
    plan: "PREMIUM",
    limitedSpots: true,
    sessions: [
      { count: 1, label: "1 séance privée / mois", prix: "199€/mois" },
      { count: 2, label: "2 séances privées / mois", prix: "398€/mois" },
      { count: 3, label: "3 séances privées / mois", prix: "597€/mois" },
      { count: 4, label: "4 séances privées / mois", prix: "796€/mois" },
    ],
  },
];

export type ServiceKey = "IMPULSION" | "TRANSFORMATION" | "VIP";

export const TIER_BY_SERVICE: Record<ServiceKey, Tier> = {
  IMPULSION: TIERS[0]!,
  TRANSFORMATION: TIERS[1]!,
  VIP: TIERS[2]!,
};
