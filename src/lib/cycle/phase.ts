// Moteur déterministe (14/08/2026, demande Anthony) — jamais d'appel IA :
// calcule la phase de cycle / l'état de grossesse ou post-partum courant à
// partir de dates réellement renseignées par l'utilisatrice, jamais
// redemandé au diagnostic (deviendrait obsolète en quelques jours). Même
// principe que src/lib/neat/recommandation.ts : une valeur affichée ou
// injectée dans un prompt IA doit toujours pouvoir se justifier par une
// vraie donnée, jamais par une estimation qu'on ne peut pas expliquer.

export type PhaseCycle = "MENSTRUELLE" | "FOLLICULAIRE" | "OVULATOIRE" | "LUTEALE";

const DUREE_CYCLE_DEFAUT = 28;
const DUREE_REGLES_TYPIQUE = 5;
// La phase lutéale (après ovulation) dure environ 14 jours et varie peu
// d'une femme à l'autre, contrairement à la phase folliculaire — c'est
// donc elle qui sert de point d'ancrage pour situer l'ovulation dans un
// cycle de longueur quelconque.
const DUREE_PHASE_LUTEALE = 14;

function joursEntre(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Jour du cycle (1 = premier jour des dernières règles), en gérant le cas
// où dateDernieresRegles remonte à plusieurs cycles (valeur pas mise à jour
// récemment) via un modulo plutôt que de renvoyer un nombre absurde.
export function calculerJourDuCycle(
  dateDernieresRegles: Date,
  dureeCycleJours: number | null,
  aujourdHui: Date = new Date()
): number {
  const dureeCycle = dureeCycleJours && dureeCycleJours > 0 ? dureeCycleJours : DUREE_CYCLE_DEFAUT;
  const ecoules = joursEntre(dateDernieresRegles, aujourdHui);
  const jour = (((ecoules % dureeCycle) + dureeCycle) % dureeCycle) + 1;
  return jour;
}

export function calculerPhaseCycle(
  dateDernieresRegles: Date | null,
  dureeCycleJours: number | null,
  aujourdHui: Date = new Date()
): PhaseCycle | null {
  if (!dateDernieresRegles) return null;

  const dureeCycle = dureeCycleJours && dureeCycleJours > 0 ? dureeCycleJours : DUREE_CYCLE_DEFAUT;
  const jour = calculerJourDuCycle(dateDernieresRegles, dureeCycle, aujourdHui);
  const jourOvulation = Math.max(dureeCycle - DUREE_PHASE_LUTEALE, DUREE_REGLES_TYPIQUE + 2);

  if (jour <= DUREE_REGLES_TYPIQUE) return "MENSTRUELLE";
  if (jour >= jourOvulation - 1 && jour <= jourOvulation + 1) return "OVULATOIRE";
  if (jour < jourOvulation - 1) return "FOLLICULAIRE";
  return "LUTEALE";
}

export const PHASE_CYCLE_LABEL: Record<PhaseCycle, string> = {
  MENSTRUELLE: "Phase menstruelle (règles)",
  FOLLICULAIRE: "Phase folliculaire",
  OVULATOIRE: "Phase ovulatoire",
  LUTEALE: "Phase lutéale",
};

export type EtatMaternite =
  | { statut: "ENCEINTE"; trimestre: 1 | 2 | 3; semainesGrossesse: number }
  | { statut: "POST_PARTUM"; semainesPostPartum: number };

const DUREE_GROSSESSE_SEMAINES = 40;

// dateReference = terme prévu si ENCEINTE, date d'accouchement réelle si
// POST_PARTUM (cf. Profile.dateReferenceMaternite) — deux usages différents
// du même champ, jamais ambigus car toujours lus avec le statut associé.
export function calculerEtatMaternite(
  statutMaternite: "ENCEINTE" | "POST_PARTUM" | null,
  dateReferenceMaternite: Date | null,
  aujourdHui: Date = new Date()
): EtatMaternite | null {
  if (!statutMaternite || !dateReferenceMaternite) return null;

  if (statutMaternite === "ENCEINTE") {
    const joursRestants = joursEntre(aujourdHui, dateReferenceMaternite);
    const semainesGrossesse = Math.max(
      0,
      Math.min(DUREE_GROSSESSE_SEMAINES, DUREE_GROSSESSE_SEMAINES - Math.ceil(joursRestants / 7))
    );
    const trimestre = semainesGrossesse <= 13 ? 1 : semainesGrossesse <= 27 ? 2 : 3;
    return { statut: "ENCEINTE", trimestre, semainesGrossesse };
  }

  const joursEcoules = joursEntre(dateReferenceMaternite, aujourdHui);
  const semainesPostPartum = Math.max(0, Math.floor(joursEcoules / 7));
  return { statut: "POST_PARTUM", semainesPostPartum };
}

const CONSEIL_PAR_PHASE: Record<PhaseCycle, string> = {
  MENSTRUELLE:
    "intensité modérée si besoin, priorité au confort ; en nutrition, privilégier les aliments riches en fer.",
  FOLLICULAIRE: "période généralement propice à une intensité plus élevée et à la progression de charge.",
  OVULATOIRE:
    "bonne énergie généralement, mais vigilance accrue sur la stabilité articulaire (laxité ligamentaire légèrement augmentée).",
  LUTEALE:
    "fatigue et besoins caloriques légèrement plus élevés possibles ; privilégier une intensité modérée si la personne le ressent.",
};

// Résumé textuel prêt à injecter dans les prompts IA (entraînement +
// nutrition) — construit une seule fois par appel de génération plutôt que
// dupliqué dans chaque fichier de prompt. Grossesse/post-partum prime
// toujours sur le cycle menstruel (les deux ne sont jamais pertinents en
// même temps). Retourne null si rien d'opt-in n'a été renseigné.
export function buildContexteFeminin(
  profil: {
    cycleMenstruelSuivi?: boolean | null;
    dateDernieresRegles?: Date | null;
    dureeCycleJours?: number | null;
    reglesDouloureuses?: boolean | null;
    statutMaternite?: "ENCEINTE" | "POST_PARTUM" | null;
    dateReferenceMaternite?: Date | null;
  },
  aujourdHui: Date = new Date()
): string | null {
  const etatMaternite = calculerEtatMaternite(
    profil.statutMaternite ?? null,
    profil.dateReferenceMaternite ?? null,
    aujourdHui
  );

  if (etatMaternite) {
    if (etatMaternite.statut === "ENCEINTE") {
      return `Grossesse en cours — trimestre ${etatMaternite.trimestre} (${etatMaternite.semainesGrossesse} semaines). Adapte l'intensité et les mouvements avec prudence (jamais de décubitus dorsal prolongé au 3e trimestre, jamais d'apnée/manœuvre de Valsalva, éviter les mouvements à fort impact ou à risque de chute, ajuster la nutrition en conséquence). Rappelle explicitement que ce programme ne remplace jamais l'avis d'une sage-femme ou d'un médecin, et qu'un feu vert médical est nécessaire avant de commencer ou poursuivre une activité physique.`;
    }
    return `Post-partum — ${etatMaternite.semainesPostPartum} semaine(s) après l'accouchement. Reprise progressive uniquement (jamais d'intensité ou de charge élevée avant 6-8 semaines), attention particulière au plancher pelvien et à la sangle abdominale (pas de gainage intense ni de crunchs classiques tant qu'un éventuel diastasis n'a pas été vérifié). Rappelle explicitement que la reprise du sport doit être validée par un professionnel de santé (visite post-natale).`;
  }

  if (!profil.cycleMenstruelSuivi) return null;

  const parts: string[] = [];
  const phase = calculerPhaseCycle(profil.dateDernieresRegles ?? null, profil.dureeCycleJours ?? null, aujourdHui);
  if (phase) {
    parts.push(`Cycle menstruel suivi — ${PHASE_CYCLE_LABEL[phase]} : ${CONSEIL_PAR_PHASE[phase]}`);
  }
  if (profil.reglesDouloureuses) {
    parts.push(
      "Règles douloureuses signalées — prévoir une option d'intensité réduite les jours de menstruation, jamais forcer à travers une douleur significative."
    );
  }
  return parts.length ? parts.join(" ") : null;
}
