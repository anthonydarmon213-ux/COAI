import { prisma } from "@/lib/db/client";

export type EtatVoyage = { actif: boolean; finPrevue: string | null };

// Réutilise le même signal que "reprendre mon programme habituel"
// (ProgrammeGenerated.temporaire côté pilier Entraînement, cf.
// reprendre-programme-button.tsx / pilier-page.tsx) — pas de nouvel état à
// maintenir pour le NEAT : le mode voyage est déjà porté par le programme
// d'entraînement affiché. Une fois "Reprendre mon programme habituel"
// cliqué (ou finPrevue dépassée), ce signal redevient false tout seul et le
// NEAT revient à sa référence habituelle sans action supplémentaire.
export async function getEtatVoyage(userId: string): Promise<EtatVoyage> {
  const affiche = await prisma.programmeGenerated.findFirst({
    where: { userId, pilier: "ENTRAINEMENT", statut: { in: ["VALIDE", "GENERE_IA"] } },
    orderBy: { generatedAt: "desc" },
  });

  if (!affiche?.temporaire) return { actif: false, finPrevue: null };

  return {
    actif: true,
    finPrevue: affiche.finPrevue ? affiche.finPrevue.toISOString() : null,
  };
}
