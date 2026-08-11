import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateTextWithAI } from "@/lib/ai/client";
import { buildCoachQuestionPrompt } from "@/lib/ai/prompts/coach-question";
import { prisma } from "@/lib/db/client";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { z } from "zod";

// Le Q&A "coach IA" est limité (fenêtre glissante de 30 jours) uniquement
// sur Impulsion (GRATUIT, 19€) — Transformation (STANDARD, 49€) et l'ancien
// palier PREMIUM (199€) ont un accès illimité (11/08/2026 : avant ce
// changement, Transformation partageait le même quota qu'Impulsion, sans
// palier payant pour le lever puisque PREMIUM n'est plus vendu — corrigé
// pour que la disponibilité H24/7j/7 promue sur la home soit un vrai
// avantage du palier supérieur, pas juste une promesse marketing).
export const maxDuration = 30;

const QUOTA_LIMITE = 4;
const QUOTA_FENETRE_MS = 30 * 24 * 60 * 60 * 1000;

const contextSchema = z.object({
  source: z.literal("DAILY_WORKOUT"),
  sessionName: z.string().trim().max(150).optional(),
  exerciseName: z.string().trim().max(150).optional(),
  series: z.string().trim().max(50).optional(),
  repetitions: z.string().trim().max(100).optional(),
  rest: z.string().trim().max(50).optional(),
  loadGuidance: z.string().trim().max(500).optional(),
  workoutStarted: z.boolean().optional(),
  sleep: z.string().trim().max(30).optional(),
  energy: z.string().trim().max(30).optional(),
  pain: z.boolean().optional(),
  painArea: z.string().trim().max(100).optional(),
  availableMinutes: z.number().int().min(1).max(180).optional(),
  adaptationReason: z.string().trim().max(500).optional(),
  pendingCoach: z.boolean().optional(),
}).strict();

const bodySchema = z.object({
  question: z.string().trim().min(1).max(1000),
  context: contextSchema.optional(),
}).strict();

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Question invalide" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true, subscription: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const estLimite = getEffectivePlan(user.subscription) === "GRATUIT";

  if (estLimite) {
    const fenetreExpiree =
      !user.coachQuestionsResetAt ||
      Date.now() - user.coachQuestionsResetAt.getTime() >= QUOTA_FENETRE_MS;
    const questionsUtilisees = fenetreExpiree ? 0 : user.coachQuestionsUsed;

    if (questionsUtilisees >= QUOTA_LIMITE) {
      return NextResponse.json(
        {
          error: `Limite de ${QUOTA_LIMITE} questions/mois atteinte — contacte Anthony pour un accès illimité.`,
        },
        { status: 429 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        coachQuestionsUsed: questionsUtilisees + 1,
        ...(fenetreExpiree ? { coachQuestionsResetAt: new Date() } : {}),
      },
    });
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
      buildCoachQuestionPrompt(profil, parsed.data.question, parsed.data.context)
    );
    return NextResponse.json({ answer });
  } catch (error) {
    console.error("[coach/ask]", error);
    return NextResponse.json({ error: "Échec de la génération de la réponse" }, { status: 502 });
  }
}
