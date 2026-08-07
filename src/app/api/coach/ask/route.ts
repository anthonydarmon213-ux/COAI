import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateTextWithAI } from "@/lib/ai/client";
import { buildCoachQuestionPrompt } from "@/lib/ai/prompts/coach-question";
import { prisma } from "@/lib/db/client";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { z } from "zod";

// Le Q&A "coach IA" est réservé aux paliers payants (Standard/Premium),
// cohérent avec l'assistant WhatsApp déjà positionné comme avantage Standard.
export const maxDuration = 30;

const bodySchema = z.object({
  question: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true, subscription: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  if (getEffectivePlan(user.subscription) === "GRATUIT") {
    return NextResponse.json(
      { error: "Réservé aux offres Standard et Premium" },
      { status: 403 }
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Question invalide" }, { status: 400 });
  }

  const profil = {
    objectifs: user.profile?.objectifs,
    niveau: user.profile?.niveau,
    contraintesSante: user.profile?.contraintesSante,
    antecedentsMedicaux: user.profile?.antecedentsMedicaux,
    age: user.profile?.age,
  };

  try {
    const answer = await generateTextWithAI(
      buildCoachQuestionPrompt(profil, parsed.data.question)
    );
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[coach/ask]", error);
    return NextResponse.json({ error: "Échec de la génération de la réponse" }, { status: 502 });
  }
}
