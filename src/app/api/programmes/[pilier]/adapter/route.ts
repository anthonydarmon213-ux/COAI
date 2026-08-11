import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { analyserEtAdapter } from "@/lib/adaptation/engine";
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
});

// Déclenchement manuel de l'analyse d'adaptation (Phase 1 — bouton "Analyser
// mon programme"). Le déclenchement automatique après chaque check-in est
// prévu pour une phase ultérieure, une fois le comportement observé en
// conditions réelles.
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
    where: { userId: user.id, pilier },
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

  const resultat = await analyserEtAdapter(user, pilier, parsed.data.contrainte);

  return NextResponse.json(resultat, { status: 200 });
}
