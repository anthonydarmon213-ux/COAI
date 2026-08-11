import { prisma } from "@/lib/db/client";
import type { Pilier } from "@prisma/client";

// Calcule la prochaine version pour un pilier donné — en code plutôt qu'une
// séquence SQL dédiée, car la portée est "par utilisateur ET par pilier"
// (pas un compteur global). Utilisé à la fois par la génération manuelle
// (régénération complète) et par le moteur d'adaptation.
export async function prochaineVersion(userId: string, pilier: Pilier): Promise<number> {
  const dernier = await prisma.programmeGenerated.findFirst({
    where: { userId, pilier },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (dernier?.version ?? 0) + 1;
}
