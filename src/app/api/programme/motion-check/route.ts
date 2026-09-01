import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { hasPaidSubscription } from "@/lib/subscription/plan";
import { prisma } from "@/lib/db/client";
import { generateWithVision } from "@/lib/ai/client";
import { buildMotionCheckPrompt } from "@/lib/ai/prompts/motion-check-extraction";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type Extraction = {
  analysable: boolean;
  phaseVisible: string | null;
  points: { repere: string; constat: string; statut: "ok" | "a_surveiller" }[];
  conseil: string | null;
  resume: string | null;
};

// Motion Check (22/08/2026, demande Anthony) — analyse d'une photo de
// position pour un retour de technique.
//
// Photo et non vidéo : une vidéo coûterait un ordre de grandeur de plus en
// tokens pour une information que la position en bas de mouvement suffit à
// donner. Le composant client guide explicitement vers ce moment précis.
//
// Comme les autres routes vision : image traitée en mémoire, jamais
// stockée, rien écrit en base. Un retour de technique est ponctuel, pas une
// donnée de profil — et une photo de soi en tenue de sport n'a aucune raison
// d'être conservée.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const nomExercice = z.string().trim().min(1).max(120).safeParse(formData.get("exercice"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (!nomExercice.success) {
    return NextResponse.json({ error: "Exercice non précisé" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Format non supporté (JPEG, PNG, GIF ou WEBP requis)" },
      { status: 400 }
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image trop volumineuse (10 Mo max)" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  // Chaque appel IA a un coût réel : réservé aux abonnés (01/09/2026).
  if (!hasPaidSubscription(user?.subscription)) {
    return NextResponse.json(
      { error: "Un abonnement actif est nécessaire pour l’analyse de ton mouvement.", upgrade: "/pricing" },
      { status: 402 }
    );
  }
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  let extraction: Extraction;
  try {
    extraction = await generateWithVision<Extraction>(
      buildMotionCheckPrompt(nomExercice.data),
      buffer.toString("base64"),
      mediaType,
      { userId: user.id, feature: "vision_motion" }
    );
  } catch (err) {
    console.error("[programme/motion-check] Échec de l'extraction IA", err);
    return NextResponse.json(
      { error: "Impossible d'analyser cette photo, réessaie." },
      { status: 502 }
    );
  }

  return NextResponse.json(extraction);
}
