import { prisma } from "@/lib/db/client";
import type { StatutAdaptation } from "@prisma/client";

export type NotificationAdaptation = {
  id: string;
  resume: string;
  statut: StatutAdaptation;
  pilier: string;
};

const FENETRE_HEURES = 48;

// Adaptation à faire remonter sur le dashboard. Une "PROPOSEE" (en attente
// de confirmation utilisateur) reste visible sans limite de temps — elle
// ne disparaît jamais silencieusement tant que l'utilisateur n'a pas
// accepté ou refusé. Sinon, on retombe sur la dernière adaptation déjà
// traitée dans les dernières 48h (déjà appliquée, ou en attente du coach),
// pour informer sans harceler indéfiniment. Une "GARDER" ou "REJETEE"
// n'est jamais notifiée : rien à voir si rien n'a changé.
export async function getNotificationAdaptation(userId: string): Promise<NotificationAdaptation | null> {
  const enAttenteConfirmation = await prisma.programmeAdaptation.findFirst({
    where: { userId, statut: "PROPOSEE" },
    orderBy: { createdAt: "desc" },
  });

  const adaptation =
    enAttenteConfirmation ??
    (await prisma.programmeAdaptation.findFirst({
      where: {
        userId,
        decision: { not: "GARDER" },
        statut: { in: ["APPLIQUEE", "EN_ATTENTE", "VALIDEE", "MODIFIEE"] },
        createdAt: { gte: new Date(Date.now() - FENETRE_HEURES * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    }));

  if (!adaptation) return null;

  return {
    id: adaptation.id,
    resume: adaptation.resume,
    statut: adaptation.statut,
    pilier: adaptation.pilier,
  };
}
