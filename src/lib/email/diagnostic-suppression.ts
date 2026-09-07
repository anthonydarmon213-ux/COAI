import { prisma } from "@/lib/db/client";

// Le désabonnement porte sur l'adresse, pas seulement sur un bilan.
// Relire juste avant l'envoi couvre aussi les candidats sélectionnés avant
// un désabonnement et les adresses possédant plusieurs bilans.
export async function hasDiagnosticOptOut(email: string): Promise<boolean> {
  const lead = await prisma.diagnosticLead.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      optedOutAt: { not: null },
    },
    select: { id: true },
  });
  return Boolean(lead);
}
