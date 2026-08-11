import { prisma } from "@/lib/db/client";
import type { Pilier } from "@prisma/client";

const FENETRE_SEANCES_JOURS = 14;
const SEUIL_REGRESSION_POURCENT = 0.05;

export type SignauxAdaptation = {
  nombreSeancesRecentes: number;
  moyenneDifficulte: number | null;
  moyenneEnergie: number | null;
  douleurRecente: { niveau: "LEGERE" | "IMPORTANTE"; zone: string | null; date: string } | null;
  checkinHebdo: {
    semaineDebut: string;
    sommeil: string | null;
    energie: number | null;
    stress: number | null;
    motivation: number | null;
    douleurs: boolean | null;
    seancesRealisees: number | null;
  } | null;
  tendancePoidsKg: number | null;
  regressionPerf: { exercice: string; baissePourcent: number } | null;
  versionActuelle: number | null;
  joursDepuisDerniereVersion: number | null;
  // Phase 3 (11/08/2026) — adhérence au plan nutrition sur la même fenêtre
  // de 14 jours, à partir des check-ins repas existants (RepasLog). Le
  // signal le plus direct pour décider d'un ajustement nutritionnel, plus
  // fiable qu'inférer l'adhérence depuis l'entraînement.
  adherenceRepas: { commePrevu: number; petitEcart: number; grosEcart: number; total: number } | null;
};

// Couche métier déterministe (11/08/2026, section 24 de la vision produit) :
// calcule les indicateurs à partir des données réellement enregistrées,
// AVANT tout appel IA — l'IA reçoit un contexte déjà propre plutôt que de
// devoir elle-même interpréter des lignes brutes, et les garde-fous de
// sécurité (cf. engine.ts) s'appuient sur ces mêmes valeurs calculées en
// code, jamais uniquement sur ce que l'IA affirme avoir compris.
export async function collecterSignaux(userId: string, pilier: Pilier): Promise<SignauxAdaptation> {
  const maintenant = Date.now();
  const depuis = new Date(maintenant - FENETRE_SEANCES_JOURS * 24 * 60 * 60 * 1000);

  const [seancesRecentes, dernierCheckin, mesures, testsRecents, dernierProgramme, repasRecents] =
    await Promise.all([
      prisma.seanceLog.findMany({
        where: { userId, date: { gte: depuis } },
        orderBy: { date: "desc" },
      }),
      prisma.weeklyCheckin.findFirst({ where: { userId }, orderBy: { semaineDebut: "desc" } }),
      prisma.mesure.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 2 }),
      prisma.testMaxi.findMany({ where: { userId }, orderBy: { date: "desc" }, take: 20 }),
      prisma.programmeGenerated.findFirst({ where: { userId, pilier }, orderBy: { generatedAt: "desc" } }),
      prisma.repasLog.findMany({ where: { userId, date: { gte: depuis } } }),
    ]);

  const difficultes = seancesRecentes.map((s) => s.difficulte).filter((v): v is number => v != null);
  const energies = seancesRecentes.map((s) => s.energie).filter((v): v is number => v != null);
  const moyenne = (values: number[]) =>
    values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null;

  const seanceAvecDouleur = seancesRecentes.find((s) => s.douleur && s.douleur !== "AUCUNE");

  let tendancePoidsKg: number | null = null;
  const [mesureRecente, mesurePrecedente] = mesures;
  if (mesureRecente?.poidsKg != null && mesurePrecedente?.poidsKg != null) {
    tendancePoidsKg = Math.round((mesureRecente.poidsKg - mesurePrecedente.poidsKg) * 10) / 10;
  }

  // Même logique que /admin/suivi : compare les deux derniers tests d'un
  // même exercice, première baisse trouvée retenue.
  let regressionPerf: SignauxAdaptation["regressionPerf"] = null;
  for (const exercice of new Set(testsRecents.map((t) => t.exercice))) {
    const testsExercice = testsRecents.filter((t) => t.exercice === exercice);
    const dernier = testsExercice[0];
    const precedent = testsExercice[1];
    if (!dernier || !precedent) continue;
    if (dernier.valeur < precedent.valeur * (1 - SEUIL_REGRESSION_POURCENT)) {
      regressionPerf = {
        exercice,
        baissePourcent: Math.round((1 - dernier.valeur / precedent.valeur) * 100),
      };
      break;
    }
  }

  const joursDepuisDerniereVersion = dernierProgramme
    ? Math.floor((maintenant - dernierProgramme.generatedAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const adherenceRepas = repasRecents.length
    ? {
        commePrevu: repasRecents.filter((r) => r.statut === "COMME_PREVU").length,
        petitEcart: repasRecents.filter((r) => r.statut === "PETIT_ECART").length,
        grosEcart: repasRecents.filter((r) => r.statut === "GROS_ECART").length,
        total: repasRecents.length,
      }
    : null;

  return {
    nombreSeancesRecentes: seancesRecentes.length,
    moyenneDifficulte: moyenne(difficultes),
    moyenneEnergie: moyenne(energies),
    douleurRecente: seanceAvecDouleur
      ? {
          niveau: seanceAvecDouleur.douleur as "LEGERE" | "IMPORTANTE",
          zone: seanceAvecDouleur.douleurZone,
          date: seanceAvecDouleur.date.toISOString().slice(0, 10),
        }
      : null,
    checkinHebdo: dernierCheckin
      ? {
          semaineDebut: dernierCheckin.semaineDebut.toISOString().slice(0, 10),
          sommeil: dernierCheckin.sommeil,
          energie: dernierCheckin.energie,
          stress: dernierCheckin.stress,
          motivation: dernierCheckin.motivation,
          douleurs: dernierCheckin.douleurs,
          seancesRealisees: dernierCheckin.seancesRealisees,
        }
      : null,
    tendancePoidsKg,
    regressionPerf,
    versionActuelle: dernierProgramme?.version ?? null,
    joursDepuisDerniereVersion,
    adherenceRepas,
  };
}

// En dessous de ce seuil, on ne déclenche même pas l'appel IA — pas assez
// de signal réel pour justifier une analyse (cf. section 25 : "Pas encore
// assez de données pour recommander une modification").
export const MIN_SEANCES_POUR_ADAPTER = 2;

const MIN_REPAS_POUR_ADAPTER = 3;

export function donneesSuffisantes(signaux: SignauxAdaptation): boolean {
  return (
    signaux.nombreSeancesRecentes >= MIN_SEANCES_POUR_ADAPTER ||
    signaux.checkinHebdo !== null ||
    (signaux.adherenceRepas?.total ?? 0) >= MIN_REPAS_POUR_ADAPTER
  );
}
