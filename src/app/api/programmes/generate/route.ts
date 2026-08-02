import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateWithAI } from "@/lib/ai/client";
import { buildProgrammeEntrainementPrompt } from "@/lib/ai/prompts/programme-entrainement";
import { buildProgrammeNutritionPrompt } from "@/lib/ai/prompts/programme-nutrition";
import { buildProgrammeRecuperationPrompt } from "@/lib/ai/prompts/programme-recuperation";
import { prisma } from "@/lib/db/client";
import type { Pilier } from "@prisma/client";

const PROMPT_BUILDERS: Record<Pilier, typeof buildProgrammeEntrainementPrompt> = {
  ENTRAINEMENT: buildProgrammeEntrainementPrompt,
  NUTRITION: buildProgrammeNutritionPrompt,
  RECUPERATION: buildProgrammeRecuperationPrompt,
};

// Génère dynamiquement les 3 piliers du programme (pas de bibliothèque
// pré-construite — décision actée) à partir du Profile courant de l'utilisateur.
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const profil = {
    objectifs: user.profile?.objectifs,
    niveau: user.profile?.niveau,
    equipementDisponible: user.profile?.equipementDisponible,
    contraintesSante: user.profile?.contraintesSante,
  };

  const piliers = Object.keys(PROMPT_BUILDERS) as Pilier[];

  const resultats = await Promise.allSettled(
    piliers.map(async (pilier) => {
      const prompt = PROMPT_BUILDERS[pilier](profil);
      const contenu = await generateWithAI(prompt);
      return prisma.programmeGenerated.create({
        data: { userId: user.id, pilier, contenu: contenu as object },
      });
    })
  );

  const echecs = resultats.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (echecs.length === piliers.length) {
    return NextResponse.json(
      { error: "Échec de la génération IA", details: echecs.map((e) => String(e.reason)) },
      { status: 502 }
    );
  }

  const programmes = resultats
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof prisma.programmeGenerated.create>>> => r.status === "fulfilled")
    .map((r) => r.value);

  return NextResponse.json({ programmes, echecs: echecs.length }, { status: 201 });
}
