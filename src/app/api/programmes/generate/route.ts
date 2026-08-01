import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateWithAI } from "@/lib/ai/client";
import { buildProgrammeEntrainementPrompt } from "@/lib/ai/prompts/programme-entrainement";
import { buildProgrammeNutritionPrompt } from "@/lib/ai/prompts/programme-nutrition";
import { buildProgrammeRecuperationPrompt } from "@/lib/ai/prompts/programme-recuperation";
import { prisma } from "@/lib/db/client";

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

  const profil = user.profile ?? {};

  // TODO: appeler generateWithAI(...) pour chaque pilier, parser le JSON retourné,
  // puis persister via prisma.programmeGenerated.create pour chacun.
  void generateWithAI;
  void buildProgrammeEntrainementPrompt;
  void buildProgrammeNutritionPrompt;
  void buildProgrammeRecuperationPrompt;
  void profil;

  return NextResponse.json({ error: "Non implémenté" }, { status: 501 });
}
