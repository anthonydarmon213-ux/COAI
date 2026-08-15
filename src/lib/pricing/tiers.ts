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
  sessions?: { label: string; prix: string }[];
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

// VIP redevient 100% réservation humaine (14/08/2026, demande explicite
// d'Anthony) : le site affiche uniquement les prix, aucun paiement en
// ligne — la réservation se fait directement avec lui sur WhatsApp,
// message pré-rempli avec la séance précise choisie pour qu'il sache tout
// de suite ce qui est demandé.
export function vipReservationHref(sessionLabel: string, prix: string): string | null {
  return buildWhatsAppLink(
    `Bonjour Anthony, je suis sur COAI et j'aimerais réserver : ${sessionLabel} (${prix}).`
  );
}

export const TIERS: Tier[] = [
  {
    nom: "Impulsion",
    prix: "19€",
    suffixe: "paiement unique",
    oneShot: true,
    description:
      "Les algorithmes COAI construisent ton programme personnalisé à partir de ton diagnostic et de plus de 17 ans d'expérience terrain — en un seul paiement, sans abonnement.",
    features: [
      "Journal de séances",
      "Suivi des mesures et photos de progression",
      "Graphiques de progression",
      "Coach IA — 4 questions/mois",
      "Analyse de bracelet connecté (pas, fréquence cardiaque, sommeil, VO2 max...)",
      "Analyse de photo morphologique et posturale",
      "Programme personnalisé construit par les algorithmes COAI — sans relecture humaine",
    ],
  },
  {
    nom: "Transformation",
    prix: "49€",
    suffixe: "/mois",
    essai: "7 jours offerts · puis 49€/mois",
    description:
      "Ton programme COAI complet, enrichi d'adaptations continues et d'un vrai suivi humain jusqu'à l'atteinte de ton objectif.",
    features: [
      "Tout ce qui est inclus dans Impulsion",
      "Programme évolutif — ajusté selon tes séances, check-ins, progrès et changements de semaine",
      "Validation humaine — ton programme est relu et validé par un coach diplômé d'État",
      "Suivi proactif — ton coach intervient en cas de plateau, gêne ou décrochage",
      "1 séance visio de 30 min avec Anthony Darmon incluse pendant l'accompagnement",
      "Séance supplémentaire disponible via la formule VIP",
      "Coach IA illimité, disponible 24h/24 pour t'accompagner entre deux échanges humains",
      "Assistant WhatsApp 24/7",
      "Entraînement, mobilité, nutrition et récupération adaptés ensemble",
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
      { label: "Séance découverte — Visio", prix: "100€" },
      { label: "Séance découverte — Présentiel", prix: "200€" },
      { label: "Pack Visio — 4 séances", prix: "360€" },
      { label: "Pack Présentiel — 4 séances", prix: "720€" },
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
