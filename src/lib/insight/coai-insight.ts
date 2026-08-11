import { prisma } from "@/lib/db/client";
import { collecterSignaux, donneesSuffisantes, type SignauxAdaptation } from "@/lib/adaptation/signals";

export type CoaiInsight = { texte: string; ton: "neutral" | "success" | "warning" };

// Composition déterministe (pas d'appel IA à chaque chargement du
// dashboard — coûteux et lent pour une simple carte informative) à partir
// des mêmes signaux que le moteur d'adaptation. Chaque phrase ne cite que
// des valeurs réellement présentes dans `signaux` — jamais de texte
// générique qui sous-entendrait une donnée non renseignée.
function composerDepuisSignaux(signaux: SignauxAdaptation): CoaiInsight {
  if (!donneesSuffisantes(signaux)) {
    return {
      texte:
        "COAI apprend encore à te connaître. Continue à loguer tes séances et à répondre à ton check-in hebdomadaire pour des recommandations personnalisées.",
      ton: "neutral",
    };
  }

  const phrases: string[] = [];
  let ton: CoaiInsight["ton"] = "neutral";

  const douleurImportante = signaux.douleurRecente?.niveau === "IMPORTANTE";
  const douleurLegere = signaux.douleurRecente?.niveau === "LEGERE";

  if (douleurImportante) {
    phrases.push(
      `Tu as signalé une douleur importante${signaux.douleurRecente?.zone ? ` (${signaux.douleurRecente.zone})` : ""} récemment — on reste prudent sur l'intensité en attendant que ça passe.`
    );
    ton = "warning";
  } else if (signaux.regressionPerf) {
    phrases.push(
      `${signaux.regressionPerf.exercice} est en léger retrait (${signaux.regressionPerf.baissePourcent}%) — souvent un signe de fatigue accumulée, à surveiller si ça continue.`
    );
    ton = "warning";
  } else if (signaux.moyenneDifficulte != null && signaux.moyenneDifficulte <= 2) {
    phrases.push("Tes dernières séances te semblent faciles — un bon signal pour envisager une progression.");
    ton = "success";
  } else if (signaux.moyenneDifficulte != null && signaux.moyenneDifficulte >= 4) {
    phrases.push("Tes dernières séances te demandent beaucoup d'efforts — on garde un œil sur ta récupération avant d'augmenter la charge.");
    ton = "warning";
  }

  if (!douleurImportante && signaux.checkinHebdo?.stress != null && signaux.checkinHebdo.stress >= 4) {
    phrases.push("Ton stress est élevé cette semaine — la récupération compte autant que l'entraînement en ce moment.");
  } else if (douleurLegere && phrases.length === 0) {
    phrases.push(
      `Une gêne légère${signaux.douleurRecente?.zone ? ` au niveau ${signaux.douleurRecente.zone.toLowerCase()}` : ""} a été signalée — à surveiller.`
    );
  }

  if (phrases.length === 0) {
    phrases.push(
      `${signaux.nombreSeancesRecentes} séance${signaux.nombreSeancesRecentes > 1 ? "s" : ""} loguée${signaux.nombreSeancesRecentes > 1 ? "s" : ""} ces 2 dernières semaines — continue comme ça.`
    );
    ton = "success";
  }

  return { texte: phrases.slice(0, 2).join(" "), ton };
}

// Priorité à la dernière adaptation réelle (déjà rédigée par le moteur
// d'adaptation, cf. src/lib/adaptation/engine.ts) si elle est récente —
// plus riche et déjà vérifiée que la composition générique, et gratuite
// (aucun appel IA supplémentaire). À défaut, compose à partir des signaux.
export async function getCoaiInsight(userId: string): Promise<CoaiInsight> {
  const recente = await prisma.programmeAdaptation.findFirst({
    where: { userId, createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } },
    orderBy: { createdAt: "desc" },
  });

  if (recente) {
    const ton: CoaiInsight["ton"] =
      recente.decision === "REDUIRE" ? "warning" : recente.decision === "GARDER" ? "neutral" : "success";
    return { texte: recente.resume, ton };
  }

  const signaux = await collecterSignaux(userId, "ENTRAINEMENT");
  return composerDepuisSignaux(signaux);
}
