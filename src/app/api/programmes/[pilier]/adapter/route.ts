import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { proposerAdaptation } from "@/lib/adaptation/engine";
import { canGenerateProgramme } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

// Même contrainte de durée que /api/programmes/generate : une adaptation
// actionnable régénère le contenu du pilier via le même pipeline IA.
export const maxDuration = 60;

const SLUG_TO_PILIER: Record<string, Pilier> = {
  entrainement: "ENTRAINEMENT",
  alimentation: "NUTRITION",
  recuperation: "RECUPERATION",
};

const bodySchema = z.object({
  // Contrainte ponctuelle signalée par l'utilisateur (ex: "Ma semaine
  // change" → voyage, matériel indisponible...) — facultatif, sert à
  // déclencher une décision "ADAPTER" même sans assez de séances loguées.
  contrainte: z.string().max(500).optional(),
  // Métadonnées structurées de la contrainte (cf. "Ma semaine change"),
  // stockées telles quelles pour l'historique — jamais interprétées ici.
  contexte: z.record(z.unknown()).optional(),
  // Douleur signalée explicitement (hors séance loguée) — renforce le
  // garde-fou anti-progression du moteur d'adaptation.
  douleurSignaleeManuelle: z.enum(["LEGERE", "IMPORTANTE"]).optional(),
  // Présent uniquement pour le mode voyage : durée en jours du programme
  // temporaire, sert à calculer la date de fin prévue.
  joursTemporaire: z.number().int().min(1).max(60).optional(),
});

// Déclenchement manuel de l'analyse d'adaptation (bouton "Analyser mon
// programme" / "Ma semaine change"). Propose seulement — ne régénère rien
// et ne crée aucune version tant que l'utilisateur n'a pas confirmé (cf.
// /api/adaptations/[id]/confirmer). Le déclenchement automatique après
// chaque check-in reste prévu pour une phase ultérieure.
export async function POST(request: Request, { params }: { params: { pilier: string } }) {
  const pilier = SLUG_TO_PILIER[params.pilier];
  if (!pilier) {
    return NextResponse.json({ error: "Pilier inconnu" }, { status: 400 });
  }

  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!canGenerateProgramme(user.subscription)) {
    return NextResponse.json(
      { error: "Un abonnement actif est nécessaire pour analyser ton programme." },
      { status: 403 }
    );
  }

  const programmeExistant = await prisma.programmeGenerated.findFirst({
    where: { userId: user.id, pilier, statut: { in: ["VALIDE", "GENERE_IA"] } },
  });
  if (!programmeExistant) {
    return NextResponse.json(
      { error: "Génère d'abord un programme pour ce pilier avant de l'analyser." },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const finPrevue = parsed.data.joursTemporaire
    ? new Date(Date.now() + parsed.data.joursTemporaire * 24 * 60 * 60 * 1000)
    : null;

  const resultat = await proposerAdaptation(user, pilier, parsed.data.contrainte, {
    contexte: parsed.data.contexte,
    douleurSignaleeManuelle: parsed.data.douleurSignaleeManuelle,
    temporaire: Boolean(parsed.data.joursTemporaire),
    finPrevue,
  });

  return NextResponse.json(resultat, { status: 200 });
}
