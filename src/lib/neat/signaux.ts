import { prisma } from "@/lib/db/client";
import type { TypeTravail } from "@prisma/client";

const FENETRE_RECENTE_JOURS = 7;
const FENETRE_REFERENCE_JOURS = 28;

// En dessous de ce seuil, aucune moyenne/tendance n'est calculée — "COAI
// apprend encore ton niveau d'activité quotidien" plutôt qu'une conclusion
// tirée d'un échantillon trop faible (section 2 du bloc NEAT).
export const MIN_JOURS_NEAT = 7;

export type SignauxNeat = {
  joursRenseignes: number;
  moyenne7j: number | null;
  moyenne28j: number | null;
  // (moyenne7j - moyenne28j) / moyenne28j — comparaison à SA propre
  // référence, jamais à un objectif universel (10 000 pas).
  tendance: number | null;
  moyennePasJoursEntrainement: number | null;
  moyennePasJoursSansEntrainement: number | null;
  dernierTypeTravail: TypeTravail | null;
  enVoyageDeclare: boolean;
};

export function donneesSuffisantesNeat(signaux: SignauxNeat): boolean {
  return signaux.joursRenseignes >= MIN_JOURS_NEAT;
}

// Couche déterministe (même principe que src/lib/adaptation/signals.ts) —
// calcule les indicateurs à partir des entrées réellement saisies, avant
// toute recommandation. Ne compare jamais à un seuil absolu de pas : la
// seule référence est le niveau habituel de l'utilisateur (moyenne 28j).
export async function collecterSignauxNeat(userId: string): Promise<SignauxNeat> {
  const maintenant = Date.now();
  const depuisReference = new Date(maintenant - FENETRE_REFERENCE_JOURS * 24 * 60 * 60 * 1000);
  const depuisRecent = new Date(maintenant - FENETRE_RECENTE_JOURS * 24 * 60 * 60 * 1000);

  const [entrees, seances] = await Promise.all([
    prisma.activiteJournaliere.findMany({
      where: { userId, date: { gte: depuisReference } },
      orderBy: { date: "desc" },
    }),
    prisma.seanceLog.findMany({
      where: { userId, date: { gte: depuisReference } },
      select: { date: true },
    }),
  ]);

  const joursEntrainement = new Set(seances.map((s) => s.date.toISOString().slice(0, 10)));

  const entreesAvecPas = entrees.filter((e) => e.pas != null) as (typeof entrees[number] & { pas: number })[];
  const moyenne = (valeurs: number[]) =>
    valeurs.length ? Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length) : null;

  const pas28j = entreesAvecPas.map((e) => e.pas);
  const pas7j = entreesAvecPas
    .filter((e) => e.date.getTime() >= depuisRecent.getTime())
    .map((e) => e.pas);

  const moyenne28j = moyenne(pas28j);
  const moyenne7j = moyenne(pas7j);
  const tendance =
    moyenne7j != null && moyenne28j != null && moyenne28j > 0
      ? Math.round(((moyenne7j - moyenne28j) / moyenne28j) * 100) / 100
      : null;

  const pasJoursEntrainement: number[] = [];
  const pasJoursSansEntrainement: number[] = [];
  entreesAvecPas.forEach((e) => {
    const cle = e.date.toISOString().slice(0, 10);
    if (joursEntrainement.has(cle)) pasJoursEntrainement.push(e.pas);
    else pasJoursSansEntrainement.push(e.pas);
  });

  const dernierTypeTravail = entrees.find((e) => e.typeTravail != null)?.typeTravail ?? null;
  const enVoyageDeclare = entrees[0]?.typeJournee === "VOYAGE";

  return {
    joursRenseignes: entrees.length,
    moyenne7j,
    moyenne28j,
    tendance,
    moyennePasJoursEntrainement: moyenne(pasJoursEntrainement),
    moyennePasJoursSansEntrainement: moyenne(pasJoursSansEntrainement),
    dernierTypeTravail,
    enVoyageDeclare,
  };
}
