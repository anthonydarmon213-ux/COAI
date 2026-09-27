import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { isValidWhatsappWebhookRequest } from "@/lib/whatsapp/client";
import { generateTextWithAI } from "@/lib/ai/client";
import { buildCoachQuestionPrompt } from "@/lib/ai/prompts/coach-question";
import { prisma } from "@/lib/db/client";
import { getEffectivePlan, hasPaidSubscription } from "@/lib/subscription/plan";
import { COACH_QUOTA_LIMIT, getCoachQuotaState } from "@/lib/subscription/coach-quota";

// Appelé par ManyChat (étape "External Request" du flow WhatsApp) à chaque
// message reçu d'un abonné — remplace l'ancienne hypothèse Make.com/Twilio,
// jamais mise en place (cf. CLAUDE.md, 10/08/2026). Contrat côté ManyChat :
// POST, header x-webhook-secret, body { phoneWhatsapp, message }. Réponse
// { reply } que ManyChat renvoie tel quel à l'abonné sur WhatsApp.
export const maxDuration = 30;

const bodySchema = z.object({
  phoneWhatsapp: z.string().min(6),
  message: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  if (!isValidWhatsappWebhookRequest(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { phoneWhatsapp, message } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { phoneWhatsapp },
    include: { profile: true, subscription: true },
  });

  if (!user) {
    return NextResponse.json({
      reply:
        "Je ne retrouve pas ton compte COAI avec ce numéro. Connecte-toi sur coai.fr, va dans Compte > Paramètres, et renseigne ce numéro WhatsApp pour qu'on puisse discuter ici.",
    });
  }

  // Same paid-access boundary as /api/coach/ask, before storing personal
  // messages, reserving quota or triggering a billed AI call.
  if (!hasPaidSubscription(user.subscription)) {
    return NextResponse.json({
      reply: "Un abonnement actif est nécessaire pour le coach IA. Consulte ton abonnement dans ton compte COAI.",
    });
  }

  await prisma.whatsAppEvent.create({
    data: {
      userId: user.id,
      direction: "INBOUND",
      payload: { message } as Prisma.InputJsonValue,
    },
  });

  // Même quota que le coach IA sur le site (4 questions/mois, COAI Essentiel
  // uniquement) — sans ça WhatsApp serait une voie de contournement du
  // quota web pour le même service.
  const estLimite = getEffectivePlan(user.subscription) === "PASS_IA";
  let reservedWindow: Date | null = null;
  if (estLimite) {
    const quota = getCoachQuotaState(user.coachQuestionsUsed, user.coachQuestionsResetAt);
    if (quota.expired) {
      await prisma.user.updateMany({
        where: { id: user.id, coachQuestionsResetAt: user.coachQuestionsResetAt },
        data: { coachQuestionsUsed: 0, coachQuestionsResetAt: new Date() },
      });
    }
    const current = await prisma.user.findUnique({
      where: { id: user.id }, select: { coachQuestionsResetAt: true },
    });
    const reserved = current?.coachQuestionsResetAt
      ? await prisma.user.updateMany({
          where: { id: user.id, coachQuestionsResetAt: current.coachQuestionsResetAt,
            coachQuestionsUsed: { lt: COACH_QUOTA_LIMIT } },
          data: { coachQuestionsUsed: { increment: 1 } },
        })
      : { count: 0 };

    if (reserved.count === 0) {
      const reply =
        "Tu as atteint tes 4 questions offertes ce mois-ci sur l'offre COAI Essentiel. Passe à Premium Remote — un accompagnement individuel avec Anthony, 960€ pour un engagement de 3 mois minimum, sur devis — pour un accès illimité au coach IA et le regard d'un coach humain.";
      await prisma.whatsAppEvent.create({
        data: { userId: user.id, direction: "OUTBOUND", payload: { reply } as Prisma.InputJsonValue },
      });
      return NextResponse.json({ reply });
    }

    reservedWindow = current!.coachQuestionsResetAt;
  }

  const profil = {
    objectifs: user.profile?.objectifs,
    niveau: user.profile?.niveau,
    contraintesSante: user.profile?.contraintesSante,
    antecedentsMedicaux: user.profile?.antecedentsMedicaux,
    age: user.profile?.age,
  };

  try {
    const reply = await generateTextWithAI(buildCoachQuestionPrompt(profil, message), {
      userId: user.id,
      feature: "coach_whatsapp",
    });
    await prisma.whatsAppEvent.create({
      data: { userId: user.id, direction: "OUTBOUND", payload: { reply } as Prisma.InputJsonValue },
    });
    return NextResponse.json({ reply });
  } catch {
    if (reservedWindow) {
      // Refund only this quota window: a late failure must not decrement
      // a new month's counter. Never retry the billed AI call automatically.
      await prisma.user.updateMany({
        where: { id: user.id, coachQuestionsResetAt: reservedWindow, coachQuestionsUsed: { gt: 0 } },
        data: { coachQuestionsUsed: { decrement: 1 } },
      }).catch(() => console.error("[webhooks/whatsapp-manychat] Restitution du quota indisponible"));
    }
    console.error("[webhooks/whatsapp-manychat] Réponse indisponible");
    return NextResponse.json(
      { reply: "Petit souci technique de mon côté, réessaie dans quelques instants." },
      { status: 200 }
    );
  }
}
