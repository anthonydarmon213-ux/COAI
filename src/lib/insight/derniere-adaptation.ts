import { prisma } from "@/lib/db/client";

export type NotificationAdaptation = {
  id: string;
  resume: string;
  statut: "APPLIQUEE" | "EN_ATTENTE" | "VALIDEE" | "MODIFIEE";
  pilier: string;
};

const FENETRE_HEURES = 48;

// Adaptation la plus récente (tous piliers confondus) dans les dernières
// 48h — sert de base à la carte "COAI a une adaptation à te proposer" sur
// le dashboard. Une "GARDER" n'est jamais notifiée : rien à voir pour
// l'utilisateur si rien n'a réellement changé.
export async function getNotificationAdaptation(userId: string): Promise<NotificationAdaptation | null> {
  const adaptation = await prisma.programmeAdaptation.findFirst({
    where: {
      userId,
      decision: { not: "GARDER" },
      createdAt: { gte: new Date(Date.now() - FENETRE_HEURES * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!adaptation) return null;

  return {
    id: adaptation.id,
    resume: adaptation.resume,
    statut: adaptation.statut,
    pilier: adaptation.pilier,
  };
}
