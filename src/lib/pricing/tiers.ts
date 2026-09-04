import { buildWhatsAppLink } from "@/lib/whatsapp";
import { NB_EXERCICES_FILMES, NB_PROGRAMMES_PRETS, NB_RECETTES } from "@/lib/catalogue-chiffres";

export type PlanCode = "PASS_IA" | "STANDARD" | "PREMIUM";

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
  // Offre "membre fondateur" (19/08/2026) : prix bloqué à vie pour les 100
  // premiers abonnés — cf. src/lib/pricing/membre-fondateur.ts pour le
  // comptage réel (jamais un chiffre inventé).
  founderOffer?: boolean;
  // 6 ajouté le 04/09/2026 (packs Full Remote / Full Présentiel VIP en
  // engagement 3 ou 6 mois) — `count` n'est affiché nulle part (seuls
  // `label`/`prix` le sont, cf. compte/abonnement/page.tsx), c'est un repère
  // interne pour distinguer les entrées.
  sessions?: { count: 1 | 2 | 3 | 4 | 6; label: string; prix: string }[];
  // Facturation annuelle (21/08/2026, Pass IA seulement — cf.
  // checkout/route.ts) : "prix"/"suffixe" affichent l'équivalent mensuel en
  // gros (repère familier), "noteFacturation" précise en petit le vrai
  // rythme de prélèvement — jamais l'inverse, pour ne jamais donner
  // l'impression d'un prix mensuel qui ne sera pas le vrai prélèvement.
  factureAnnuellement?: boolean;
  noteFacturation?: string;
  // Bloc "sur devis" (04/09/2026, repositionnement 3 offres) : tout tier
  // avec `sessions` défini sort du checkout en ligne et affiche ce bloc à la
  // place (sur /pricing et dans la modale service-detail-modal.tsx). Ces
  // trois champs remplacent l'ancien texte codé en dur ("Coaching VIP"
  // partout) pour que le même bloc serve n'importe quel tier sur devis.
  devisTagline?: string;
  devisWhatsappLabel?: string;
  devisFootnote?: string;
  // Ligne de prix affichée dans le bloc "sur devis" (04/09/2026, Full
  // Remote) : par défaut composée de `prix`+`suffixe` ("200 € la séance,
  // puis sur devis"), mais ce libellé ne convient pas à un forfait déjà
  // fixe (pas de "puis sur devis" pour un prix qui ne varie pas) — ce champ
  // permet de le remplacer entièrement quand c'est le cas.
  devisPriceLabel?: string;
  // Second CTA du bloc "sur devis" (04/09/2026, Full Remote uniquement,
  // demande Anthony : proposer un appel visio avant de signer, en plus de
  // la possibilité de souscrire tout de suite). Absent = un seul CTA
  // ("Demander mon devis sur WhatsApp"), comme pour Full Présentiel VIP.
  devisSecondaryCta?: { label: string; whatsappMessage: string };
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

// Repositionnement 3 offres (04/09/2026, demande Anthony — "Clarté nouveau
// positionnement 3 choses : full ia ton prog en autonomie mon whatsapp si
// besoin, full remote en 1:1 avec moi 400€/mois limité à 15 places, full
// presentiel vip 200 la séance sur Paris en club limité à 10/mois"). Cible :
// entrepreneurs 35-65 ans, forme/santé/longévité/perte de gras. V1 = copie
// uniquement, aucun compteur de places réel (les "15 places"/"10
// séances/mois" sont des promesses affichées, pas encore appliquées côté
// serveur — cf. CLAUDE.md pour le suivi de la V2).
//
// STANDARD (ex-"Coaching Hybride", 99€/mois) est repris tel quel pour devenir
// Full Remote plutôt que d'ajouter un 4ème PlanCode : Anthony a confirmé
// qu'il n'y a aucun abonné actif sur ce plan, donc aucun risque d'afficher un
// mauvais prix à un abonné existant sur /compte. Comme PREMIUM (Coaching
// VIP) le 02/09, Full Remote sort du checkout en ligne (cf.
// api/stripe/checkout/route.ts) et se vend sur devis via WhatsApp — décision
// confirmée par Anthony (pas de facturation Stripe en V1).
//
// Prix Full Remote précisé le 04/09/2026 (même échange) : pas un abonnement
// mensuel résiliable, mais un forfait de 3 mois à 1 200 € (soit 400 €/mois en
// équivalent affiché pour comparer aux autres offres). Anthony a aussi
// demandé un second CTA "appel visio avant de signer", en plus de la
// souscription directe — cf. `devisSecondaryCta` ci-dessous.
//
// Étape "coach" du bilan public rétablie le même jour (diagnostic-quiz.tsx,
// QUESTION_STEPS) pour capturer `coachPreference` et orienter réellement
// vers Full IA / Full Remote / Full Présentiel VIP dès le bilan — elle avait
// été retirée le 01/09 pour raccourcir le parcours ; Anthony a tranché en
// faveur d'une étape de plus plutôt que de ne compter que sur la
// recommandation calculée après coup (déjà existante, TIER_BY_SERVICE /
// FormuleRecommandeeCard, mais jamais alimentée par un vrai choix explicite
// jusqu'ici).
//
// Repositionnement "high ticket" (04/09/2026, même journée, nouveau retour
// d'Anthony) : Full Remote et Full Présentiel VIP repassent d'un
// prix/forfait fixe à un tarif par séance, en pack engagé de 3 ou 6 mois
// (le forfait 1 200 €/3 mois ci-dessus n'aura donc vécu que quelques
// heures — remplacé avant tout déploiement chez un abonné réel, aucun
// risque). Décisions confirmées par Anthony :
// - Full Remote : 80 €/séance (au lieu du forfait 1 200 €/3 mois).
// - Full Présentiel VIP : 100 €/séance pour un particulier ; 200 €/séance
//   pour une entreprise — "même accompagnement, tarif selon le payeur", pas
//   deux offres différentes. Le tarif entreprise (200 €) reste volontairement
//   hors du site public (uniquement communiqué sur devis via WhatsApp,
//   comme c'était déjà le cas) : seul le tarif particulier (100 €) est
//   affiché. Remplace l'ancien "10 séances/mois max" (pas d'abonnement,
//   séances à l'unité) par un engagement pack 3 ou 6 mois.
// - Cadence retenue pour le calcul des totaux affichés : 1 séance/semaine,
//   soit ~4/mois (confirmé par Anthony) — donc environ 12 séances sur 3
//   mois, ~24 sur 6 mois.
// - Durées d'engagement : seulement 3 et 6 mois (le "12 mois" évoqué au
//   tout premier message n'a pas été repris dans les chiffres détaillés
//   d'Anthony ni confirmé — à ajouter facilement plus tard si besoin, cf.
//   `sessions` sur chaque tier).
// - Paiement du pack en une fois à la signature (pas de mensualisation),
//   comme l'ancien forfait Full Remote.
// - `PlanCode` (`STANDARD`/`PREMIUM`) et le fonctionnement "sur devis via
//   WhatsApp, jamais de Stripe" restent inchangés — seul le mode de calcul
//   du prix affiché change (par séance × pack, plutôt qu'un forfait unique).
export const TIERS: Tier[] = [
  {
    nom: "Full IA",
    eyebrow: "L'OFFRE ESSENTIELLE · TON PT 24H/24 + WHATSAPP",
    prix: "19,99€",
    suffixe: "/mois",
    factureAnnuellement: false,
    noteFacturation: "Sans engagement · 39€ les 3 mois jusqu'au 30 septembre, ou 9,99€/mois en annuel (119€ facturés une fois par an)",
    description:
      "L'expérience Personal Training réimaginée pour avancer en autonomie, avec un programme qui s'adapte à ta vraie vie — et mon WhatsApp en renfort si tu as besoin d'un coup de pouce.",
    // La page tarifs n'affiche que les quatre premieres : le concret passe
    // donc devant l'abstrait. Un visiteur ignorait qu'il obtient des
    // centaines de contenus deja produits, et ne lisait que des promesses
    // d'adaptation impossibles a evaluer avant d'avoir paye.
    features: [
      `${NB_RECETTES} recettes avec leurs macros — végétarien, vegan, sans gluten, hyper-protéiné`,
      `${NB_PROGRAMMES_PRETS} programmes prêts à suivre et ${NB_EXERCICES_FILMES} exercices filmés par Anthony`,
      "Une séance recalculée chaque jour selon ton sommeil, ta forme et ton temps",
      "Coach IA disponible 24h/24, et mon WhatsApp perso si jamais tu bloques",
      "Programme ultra-personnalisé selon ton diagnostic",
      "Suivi des séances, mesures et progrès",
    ],
    plan: "PASS_IA",
    mostPopular: true,
    trial: true,
    founderOffer: true,
  },
  {
    nom: "Full Remote",
    eyebrow: "COACHING 1:1 AVEC ANTHONY · 15 PLACES MAX",
    prix: "80 €",
    suffixe: "/ séance",
    description:
      "Un coaching individuel à distance, piloté personnellement par moi — 80 € la séance, environ 1 séance par semaine, en pack engagé de 3 ou 6 mois payé en une fois. Ton programme, tes ajustements et ton suivi, sans jamais rester seul entre deux séances.",
    features: [
      "Suivi individuel 100% avec Anthony, à distance",
      "Programme construit et ajusté personnellement selon tes retours",
      "Échanges réguliers sur WhatsApp pour corriger, motiver et adapter",
      "Coach IA disponible 24h/24 en complément entre nos échanges",
      "Priorité sur tes créneaux et tes questions",
      "Places volontairement limitées à 15 pour garder un vrai suivi",
    ],
    plan: "STANDARD",
    limitedSpots: true,
    sessions: [
      { count: 3, label: "Pack 3 mois (~12 séances, 1/semaine)", prix: "80 € / séance · 960 € au total" },
      { count: 6, label: "Pack 6 mois (~24 séances, 1/semaine)", prix: "80 € / séance · 1 920 € au total" },
    ],
    devisTagline: "Suivi individuel à distance, 100 % avec moi — 80 €/séance, environ 1 séance par semaine, pack 3 ou 6 mois au choix. 15 places maximum.",
    devisWhatsappLabel: "le Full Remote",
    devisFootnote: "Pack payé en une fois à la signature. Places limitées à 15 pour garder un vrai suivi individuel.",
    devisPriceLabel: "80 € / séance (pack 3 ou 6 mois, payé en une fois)",
    // Demande Anthony (04/09/2026) : proposer un appel visio avant de
    // signer pour qui en a besoin, sans bloquer qui veut souscrire tout de
    // suite — les deux CTA restent visibles, au choix.
    devisSecondaryCta: {
      label: "Réserver un appel visio avant de signer",
      whatsappMessage: "Bonjour Anthony, avant de m'engager sur Full Remote (80 €/séance), je voudrais d'abord un appel visio avec toi.",
    },
  },
  {
    nom: "Full Présentiel VIP",
    eyebrow: "SÉANCES PRIVÉES AVEC ANTHONY · PACK 3 OU 6 MOIS",
    prix: "100 €",
    suffixe: "/ séance",
    description:
      "Pour les objectifs précis, les contraintes particulières et ceux qui veulent être suivis comme un sportif de haut niveau — 100 € la séance, environ 1 séance par semaine, en pack engagé de 3 ou 6 mois payé en une fois.",
    features: [
      "Séances privées de Personal Training avec Anthony",
      "À domicile, en entreprise, en club ou à distance",
      "Analyse approfondie des objectifs, douleurs et contraintes",
      "Tarif entreprise disponible sur devis (facture déductible)",
      "Facture professionnelle déductible en frais d'entreprise",
      "Pack payé en une fois à la signature",
    ],
    plan: "PREMIUM",
    limitedSpots: true,
    sessions: [
      { count: 3, label: "Pack 3 mois (~12 séances, 1/semaine)", prix: "100 € / séance · 1 200 € au total" },
      { count: 6, label: "Pack 6 mois (~24 séances, 1/semaine)", prix: "100 € / séance · 2 400 € au total" },
    ],
    // Tarif entreprise (200 €/séance) volontairement absent de tout texte
    // public (décision Anthony, 04/09/2026) : communiqué uniquement sur
    // devis via WhatsApp, jamais affiché en chiffres sur le site.
    devisTagline: "À domicile, en entreprise, en club ou à distance — 100 €/séance, environ 1 séance par semaine, pack 3 ou 6 mois. Tarif entreprise sur devis.",
    devisWhatsappLabel: "le Full Présentiel VIP",
    devisFootnote: "Pack payé en une fois à la signature. Tarif entreprise (facture déductible) sur devis.",
    devisPriceLabel: "100 € / séance (pack 3 ou 6 mois, payé en une fois)",
  },
];

export type ServiceKey = "IMPULSION" | "TRANSFORMATION" | "VIP";

export const TIER_BY_SERVICE: Record<ServiceKey, Tier> = {
  IMPULSION: TIERS[0]!,
  TRANSFORMATION: TIERS[1]!,
  VIP: TIERS[2]!,
};
