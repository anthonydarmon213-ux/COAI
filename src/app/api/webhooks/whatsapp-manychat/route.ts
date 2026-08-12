import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { isValidWhatsappWebhookRequest } from "@/lib/whatsapp/client";
import { generateTextWithAI } from "@/lib/ai/client";
import { buildCoachQuestionPrompt } from "@/lib/ai/prompts/coach-question";
import { prisma } from "@/lib/db/client";
import { getEffectivePlan } from "@/lib/subscription/plan";

// Appelé par ManyChat (étape "External Request" du flow WhatsApp) à chaque
// message reçu d'un abonné — remplace l'ancienne hypothèse Make.com/Twilio,
// jamais mise en place (cf. CLAUDE.md, 10/08/2026). Contrat côté ManyChat :
// POST, header x-webhook-secret, body { phoneWhatsapp, message }. Réponse
// { reply } que ManyChat renvoie tel quel à l'abonné sur WhatsApp.
export const maxDuration = 30;

const QUOTA_LIMITE = 4;
const QUOTA_FENETRE_MS = 30 * 24 * 60 * 60 * 1000;

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

  await prisma.whatsAppEvent.create({
    data: {
      userId: user.id,
      direction: "INBOUND",
      payload: { message } as Prisma.InputJsonValue,
    },
  });

  // Même quota que le coach IA sur le site (4 questions/mois, Impulsion
  // uniquement) — sans ça WhatsApp serait une voie de contournement du
  // quota web pour le même service.
  const estLimite = getEffectivePlan(user.subscription) === "GRATUIT";
  if (estLimite) {
    const fenetreExpiree =
      !user.coachQuestionsResetAt ||
      Date.now() - user.coachQuestionsResetAt.getTime() >= QUOTA_FENETRE_MS;
    const questionsUtilisees = fenetreExpiree ? 0 : user.coachQuestionsUsed;

    if (questionsUtilisees >= QUOTA_LIMITE) {
      const reply =
        "Tu as atteint tes 4 questions offertes ce mois-ci sur l'offre Impulsion. Passe à Transformation (49€/mois) pour un accès illimité au coach IA, sur le site comme ici sur WhatsApp.";
      await prisma.whatsAppEvent.create({
        data: { userId: user.id, direction: "OUTBOUND", payload: { reply } as Prisma.InputJsonValue },
      });
      return NextResponse.json({ reply });
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
    const reply = await generateTextWithAI(buildCoachQuestionPrompt(profil, message), {
      userId: user.id,
      feature: "coach_whatsapp",
    });
    await prisma.whatsAppEvent.create({
      data: { userId: user.id, direction: "OUTBOUND", payload: { reply } as Prisma.InputJsonValue },
    });
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[webhooks/whatsapp-manychat]", error);
    return NextResponse.json(
      { reply: "Petit souci technique de mon côté, réessaie dans quelques instants." },
      { status: 200 }
    );
  }
}
