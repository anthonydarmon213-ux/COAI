import { prisma } from "@/lib/db/client";
import type { Pilier, Prisma, StatutProgramme } from "@prisma/client";

// Aucun appel externe dans cette transaction. Le verrou utilisateur protège
// la décision de reprise et la numérotation pour les écritures de cette route.
export async function saveGeneratedProgramme(input: {
  userId: string;
  pilier: Pilier;
  contenu: Prisma.InputJsonValue;
  statut: StatutProgramme;
  onboarding: boolean;
}) {
  return prisma.$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM users WHERE id=${input.userId} FOR UPDATE`;
    const select = { id: true, pilier: true, statut: true, generatedAt: true } as const;
    if (input.onboarding) {
      const existing = await tx.programmeGenerated.findFirst({
        where: { userId: input.userId, pilier: input.pilier },
        orderBy: [{ generatedAt: "desc" }, { id: "desc" }], select,
      });
      if (existing) return { programme: existing, created: false };
    }
    const last = await tx.programmeGenerated.findFirst({
      where: { userId: input.userId, pilier: input.pilier },
      orderBy: { version: "desc" }, select: { version: true },
    });
    const programme = await tx.programmeGenerated.create({
      data: { userId: input.userId, pilier: input.pilier, contenu: input.contenu,
        statut: input.statut, version: (last?.version ?? 0) + 1 }, select,
    });
    return { programme, created: true };
  });
}
