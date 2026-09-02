import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { hasPaidSubscription } from "@/lib/subscription/plan";
import { generateTextWithAI } from "@/lib/ai/client";
import { buildCoachQuestionPrompt } from "@/lib/ai/prompts/coach-question";
import { prisma } from "@/lib/db/client";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { buildProfilIntelligence } from "@/lib/insight/profil-appris";
import { z } from "zod";
import { COACH_QUOTA_LIMIT, getCoachQuotaState } from "@/lib/subscription/coach-quota";

// Le Q&A "coach IA" est limité (fenêtre glissante de 30 jours) uniquement
// sur Pass IA (GRATUIT) — Coaching Hybride (STANDARD) et palier PREMIUM
// ont un accès illimité. Montants volontairement absents de ce
// commentaire : ils changent, et un commentaire périmé induit en erreur
// (cf. les tarifs restés à 49€/89€ ici jusqu'au 23/08/2026) (11/08/2026 : avant ce
// changement, Coaching Hybride partageait le même quota qu'Pass IA, sans
// palier payant pour le lever puisque PREMIUM n'est plus vendu — corrigé
// pour que la disponibilité H24/7j/7 promue sur la home soit un vrai
// avantage du palier supérieur, pas juste une promesse marketing).
export const maxDuration = 30;

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
  // Chaque appel IA a un coût réel : réservé aux abonnés (01/09/2026).
  if (!hasPaidSubscription(user?.subscription)) {
    return NextResponse.json(
      { error: "Un abonnement actif est nécessaire pour le coach IA.", upgrade: "/pricing" },
      { status: 402 }
    );
  }
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const estLimite = getEffectivePlan(user.subscription) === "PASS_IA";
  let quotaReserved = false;

  if (estLimite) {
    const quota = getCoachQuotaState(user.coachQuestionsUsed, user.coachQuestionsResetAt);

    if (quota.expired) {
      // Le timestamp observé fait office de verrou optimiste : si une autre
      // requête a déjà réinitialisé la fenêtre, celle-ci ne remet pas son
      // compteur à zéro une seconde fois.
      await prisma.user.updateMany({
        where: { id: user.id, coachQuestionsResetAt: user.coachQuestionsResetAt },
        data: { coachQuestionsUsed: 0, coachQuestionsResetAt: new Date() },
      });
    }

    // Réservation atomique : deux onglets ne peuvent pas dépasser le quota.
    const reserved = await prisma.user.updateMany({
      where: { id: user.id, coachQuestionsUsed: { lt: COACH_QUOTA_LIMIT } },
      data: { coachQuestionsUsed: { increment: 1 } },
    });
    if (reserved.count === 0) {
      return NextResponse.json(
        {
          error: `Limite de ${COACH_QUOTA_LIMIT} questions/mois atteinte — passe à Coaching Hybride pour un accès illimité.`,
          quotaRemaining: 0,
        },
        { status: 429 }
      );
    }
    quotaReserved = true;
  }

  const profil = {
    objectifs: user.profile?.objectifs,
    niveau: user.profile?.niveau,
    contraintesSante: user.profile?.contraintesSante,
    antecedentsMedicaux: user.profile?.antecedentsMedicaux,
    age: user.profile?.age,
  };

  try {
    // La mémoire est toujours recalculée côté serveur : le client ne peut ni
    // fabriquer ni modifier les apprentissages utilisés par le Coach IA.
    // Un échec isolé de ce calcul ne doit pas rendre le Coach indisponible.
    const intelligence = await buildProfilIntelligence(user.id).catch((error) => {
      console.error("[coach/ask:memory]", error);
      return null;
    });
    const memory = intelligence ? {
      progression: intelligence.progression,
      observations: intelligence.items.slice(0, 8),
      tendances: intelligence.tendances.slice(0, 3).map(({ titre, constat, preuve }) => ({ titre, constat, preuve })),
    } : undefined;
    const answer = await generateTextWithAI(
      buildCoachQuestionPrompt(profil, parsed.data.question, parsed.data.context, memory),
      { userId: user.id, feature: parsed.data.context ? "coach_daily" : "coach_chat" }
    );
    const refreshedUser = estLimite
      ? await prisma.user.findUnique({ where: { id: user.id }, select: { coachQuestionsUsed: true } })
      : null;
    const quotaRemaining = refreshedUser
      ? Math.max(0, COACH_QUOTA_LIMIT - refreshedUser.coachQuestionsUsed)
      : null;
    return NextResponse.json({ answer, quotaRemaining });
  } catch (error) {
    // Une panne IA ne consomme jamais une question payée par l'abonné.
    if (quotaReserved) {
      await prisma.user.update({
        where: { id: user.id },
        data: { coachQuestionsUsed: { decrement: 1 } },
      }).catch(() => undefined);
    }
    console.error("[coach/ask]", error);
    return NextResponse.json({ error: "Échec de la génération de la réponse" }, { status: 502 });
  }
}
