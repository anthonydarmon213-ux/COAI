import { prisma } from "@/lib/db/client";
import { LABEL_PAR_EXERCICE } from "@/lib/tests-maxi/labels";
import type { Pilier } from "@prisma/client";

export type EvenementTimeline = {
  date: Date;
  titre: string;
  detail?: string;
};

const PILIER_LABEL: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Alimentation",
  RECUPERATION: "Récupération",
};

// Timeline "Mon évolution" (Phase 2, 11/08/2026) — uniquement des
// événements réellement survenus, jamais fabriqués. Structure pensée pour
// être étendue (nutrition/récupération suivent déjà le même modèle que
// l'entraînement ; un futur événement côté coach humain n'aurait qu'à
// pousser un item de plus dans le même tableau).
export async function buildTimeline(userId: string): Promise<EvenementTimeline[]> {
  const [user, premiereSeance, programmesInitiaux, adaptations, checkins, tests] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.seanceLog.findFirst({ where: { userId }, orderBy: { date: "asc" } }),
    prisma.programmeGenerated.findMany({
      where: { userId, version: 1 },
      select: { pilier: true, generatedAt: true },
    }),
    prisma.programmeAdaptation.findMany({
      where: { userId, decision: { not: "GARDER" } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.weeklyCheckin.findMany({ where: { userId }, orderBy: { semaineDebut: "asc" } }),
    prisma.testMaxi.findMany({ where: { userId }, orderBy: { date: "asc" } }),
  ]);

  const evenements: EvenementTimeline[] = [];

  if (user) {
    evenements.push({ date: user.createdAt, titre: "Compte COAI créé" });
  }

  if (premiereSeance) {
    evenements.push({ date: premiereSeance.date, titre: "Première séance terminée" });
  }

  for (const p of programmesInitiaux) {
    evenements.push({ date: p.generatedAt, titre: `Premier programme créé — ${PILIER_LABEL[p.pilier]}` });
  }

  for (const a of adaptations) {
    const estVoyage = (a.contexte as { type?: string } | null)?.type === "VOYAGE";
    const estFinVoyage = (a.contexte as { type?: string } | null)?.type === "FIN_VOYAGE";
    evenements.push({
      date: a.createdAt,
      titre: estVoyage
        ? `Mode voyage activé — ${PILIER_LABEL[a.pilier]}`
        : estFinVoyage
          ? `Retour au programme habituel — ${PILIER_LABEL[a.pilier]}`
          : `Programme adapté — ${PILIER_LABEL[a.pilier]}`,
      detail: a.resume,
    });
  }

  for (const c of checkins) {
    evenements.push({ date: c.createdAt, titre: "Check-in hebdomadaire complété" });
  }

  // Un test est un "nouveau record" s'il dépasse tous les tests précédents
  // du même exercice — comparé dans l'ordre chronologique déjà trié.
  const meilleurParExercice = new Map<string, number>();
  for (const t of tests) {
    const meilleur = meilleurParExercice.get(t.exercice);
    if (meilleur == null || t.valeur > meilleur) {
      meilleurParExercice.set(t.exercice, t.valeur);
      if (meilleur != null) {
        evenements.push({
          date: t.date,
          titre: `Nouveau record — ${LABEL_PAR_EXERCICE[t.exercice as keyof typeof LABEL_PAR_EXERCICE] ?? t.exercice}`,
          detail: `${t.valeur}${t.unite}`,
        });
      }
    }
  }

  return evenements.sort((a, b) => b.date.getTime() - a.date.getTime());
}
