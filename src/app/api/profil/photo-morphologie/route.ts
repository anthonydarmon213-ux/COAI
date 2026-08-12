import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { generateWithVision } from "@/lib/ai/client";
import { buildBodyPhotoExtractionPrompt } from "@/lib/ai/prompts/body-photo-extraction";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type Extraction = {
  analysable: boolean;
  morphologieDetectee: string | null;
  observationsPosture: string | null;
  resume: string | null;
};

// Analyse une photo en tenue de sport pour affiner le profil (morphologie,
// posture) — mêmes garde-fous que /api/profil/montre : pas d'écran de
// relecture, mise à jour directe du Profil, image traitée en mémoire
// uniquement (jamais stockée). Le prompt (cf.
// src/lib/ai/prompts/body-photo-extraction.ts) refuse explicitement
// d'analyser toute photo où la personne ne semble pas clairement adulte ou
// qui ne montre pas une tenue de sport adaptée — dans ce cas "analysable"
// revient à false et rien n'est écrit en base.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
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

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  let extraction: Extraction;
  try {
    extraction = await generateWithVision<Extraction>(
      buildBodyPhotoExtractionPrompt(),
      buffer.toString("base64"),
      mediaType,
      { userId: user.id, feature: "vision_morphologie" }
    );
  } catch (err) {
    console.error("[profil/photo-morphologie] Échec de l'extraction IA", err);
    return NextResponse.json(
      { error: "Impossible d'analyser cette photo, réessaie avec une autre image." },
      { status: 502 }
    );
  }

  if (!extraction.analysable) {
    return NextResponse.json(
      { analysable: false, resume: extraction.resume ?? "Photo non analysable." },
      { status: 200 }
    );
  }

  const data: Record<string, string | Date> = { derniereAnalysePhoto: new Date() };
  if (extraction.morphologieDetectee) data.morphologieDetectee = extraction.morphologieDetectee;
  if (extraction.observationsPosture) data.observationsPosture = extraction.observationsPosture;

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json({ analysable: true, resume: extraction.resume, ...profile });
}
