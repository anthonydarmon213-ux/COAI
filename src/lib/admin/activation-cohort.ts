import { prisma } from "@/lib/db/client";

// Cohorte d'inscrits : `some` compte chaque membre une seule fois,
// indépendamment des clics, rechargements ou du nombre de séances.
// Aucun détail d'exercice, de douleur ou d'identité n'est retourné.
export async function getActivationCohort(now = new Date()) {
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const cohort = { createdAt: { gte: since, lte: now } };
  const saved = { createdAt: { lte: now } };
  const [accounts, programmes, workouts, repcount, checkins] = await Promise.all([
    prisma.user.count({ where: cohort }),
    prisma.user.count({ where: { ...cohort, programmes: { some: { generatedAt: { lte: now }, statut: { in: ["VALIDE", "GENERE_IA"] } } } } }),
    prisma.user.count({ where: { ...cohort, seances: { some: { ...saved, source: "PROGRAMME" } } } }),
    prisma.user.count({ where: { ...cohort, seances: { some: { ...saved, source: "REPCOUNT" } } } }),
    prisma.user.count({ where: { ...cohort, seances: { some: { ...saved, source: "PROGRAMME", OR: [{ difficulte: { not: null } }, { energie: { not: null } }, { douleur: { not: null } }] } } } }),
  ]);
  return { accounts, programmes, workouts, repcount, checkins };
}
