import { buildWhatsAppLink } from "@/lib/whatsapp";

// Source unique des offres (14/08/2026) — extrait de /pricing pour être
// réutilisé tel quel par le nouveau modal "détail d'un service"
// (ServiceDetailModal), sans jamais dupliquer/faire diverger le contenu
// réel des offres entre les deux endroits où il s'affiche.
export type Tier = {
  nom: string;
  prix: string;
  suffixe: string;
  essai?: string;
  description: string;
  features: string[];
  plan?: "STANDARD" | "PREMIUM";
  mostPopular?: boolean;
  oneShot?: boolean;
  sessions?: {
    label: string;
    prix: string;
    pack?: "DECOUVERTE_VISIO" | "DECOUVERTE_PRESENTIEL" | "VISIO" | "PRESENTIEL";
  }[];
  limitedSpots?: boolean;
};

export const ENTREPRISE = {
  nom: "Entreprise",
  description: "Coaching pour vos équipes et collaborateurs — accompagnement sur-mesure, sur devis.",
  features: [
    "Programme adapté à vos équipes (mobilité au poste, gestion de l'énergie, prévention)",
    "Formules flexibles — ponctuel, régulier, ou intégré à une démarche QVT",
    "Devis personnalisé selon vos effectifs et vos objectifs",
  ],
  whatsappHref: buildWhatsAppLink(
    "Bonjour Anthony, je vous contacte au sujet d'une offre coaching pour mon entreprise."
  ),
  mailHref: `mailto:anthonydarmon213@hotmail.com?subject=${encodeURIComponent("Offre coaching entreprise")}`,
  siteHref:
    "http://coaching-hybride-anthony.anthonydarmon213.chatgpt.site/?utm_source=pricing&utm_medium=web&utm_content=carte_entreprise",
};

export const VIP_MESSAGE =
  "Bonjour Anthony, je suis sur COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

export const TIERS: Tier[] = [
  {
    nom: "Impulsion",
    prix: "19€",
    suffixe: "paiement unique",
    oneShot: true,
    description:
      "Crée ton compte gratuitement, explore l'interface, puis génère ton programme personnalisé en un seul paiement de 19€ — sans abonnement.",
    features: [
      "Journal de séances",
      "Suivi des mesures et photos de progression",
      "Graphiques de progression",
      "Coach IA — 4 questions/mois",
      "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
      "Analyse de photo morphologique et posturale",
      "Programme personnalisé généré par IA — sans relecture humaine",
    ],
  },
  {
    nom: "Transformation",
    prix: "49€",
    suffixe: "/mois",
    essai: "7 jours offerts · puis 49€/mois",
    description:
      "Coaching hybride : IA + coach diplômé d'État, avec un suivi humain tout au long de l'accompagnement, jusqu'à l'atteinte de ton objectif.",
    features: [
      "Suivi de progression avec un coach diplômé d'État, jusqu'à l'atteinte de tes objectifs — pas juste à la génération : ton coach revient vers toi si besoin (plateau, gêne, décrochage) pendant toute la durée de l'accompagnement",
      "Programme personnalisé généré par IA — mobilité, nutrition, récupération, adapté à ton emploi du temps, ta morphologie, tes objectifs (à partir d'un questionnaire initial)",
      "Validation humaine — chaque programme généré est relu et validé par un vrai coach avant de t'arriver (le principe \"AI generates, coaches validate\")",
      "1 séance visio de 30 min/mois avec Anthony Darmon incluse, à réserver via WhatsApp",
      "Suivi de progression — dashboard avec ton évolution",
      "Coach IA — accès illimité, disponible 24h/24 pour ajuster ta routine à tout moment",
      "Ajustements continus — le programme évolue selon tes retours",
      "Assistant WhatsApp 24/7",
      "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
      "Analyse de photo morphologique et posturale",
    ],
    plan: "STANDARD" as const,
    mostPopular: true,
  },
  {
    nom: "VIP",
    prix: "Sur réservation",
    suffixe: "",
    description: "Coaching 100% humain avec Anthony Darmon — présentiel ou visio, sans abonnement.",
    features: [
      "Coaching 1-to-1 avec Anthony Darmon",
      "Séance découverte à l'unité, ou pack de 4 séances",
      "Accessible à tous, quel que soit ton palier",
    ],
    sessions: [
      { label: "Séance découverte — Visio", prix: "100€", pack: "DECOUVERTE_VISIO" },
      { label: "Séance découverte — Présentiel", prix: "200€", pack: "DECOUVERTE_PRESENTIEL" },
      { label: "Pack Visio — 4 séances", prix: "360€", pack: "VISIO" },
      { label: "Pack Présentiel — 4 séances", prix: "720€", pack: "PRESENTIEL" },
    ],
    limitedSpots: true,
  },
];

export type ServiceKey = "IMPULSION" | "TRANSFORMATION" | "VIP";

function tierParNom(nom: string): Tier {
  const tier = TIERS.find((t) => t.nom === nom);
  if (!tier) throw new Error(`Tier introuvable : ${nom}`);
  return tier;
}

export const TIER_BY_SERVICE: Record<ServiceKey, Tier> = {
  IMPULSION: tierParNom("Impulsion"),
  TRANSFORMATION: tierParNom("Transformation"),
  VIP: tierParNom("VIP"),
};
