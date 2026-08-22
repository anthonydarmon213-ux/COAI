import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { generateWithVision } from "@/lib/ai/client";
import { buildMealPhotoExtractionPrompt } from "@/lib/ai/prompts/meal-photo-extraction";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type Extraction = {
  analysable: boolean;
  nomPlat: string | null;
  aliments: string[];
  caloriesEstimees: number | null;
  proteinesG: number | null;
  glucidesG: number | null;
  lipidesG: number | null;
  resume: string | null;
  conseilCoach: string | null;
};

// Estimation des macros/calories d'un repas à partir d'une photo (20/08/2026,
// demande Anthony). Même garde-fou que /api/profil/photo-morphologie et
// /api/profil/montre : image traitée en mémoire uniquement, jamais stockée.
// Contrairement à ces deux routes, rien n'est écrit en base ici — c'est un
// outil d'estimation ponctuelle (V1), pas une donnée de profil durable ni un
// remplacement du RepasLog déjà existant.
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
      buildMealPhotoExtractionPrompt(),
      buffer.toString("base64"),
      mediaType,
      { userId: user.id, feature: "vision_repas" }
    );
  } catch (err) {
    console.error("[nutrition/photo-repas] Échec de l'extraction IA", err);
    return NextResponse.json(
      { error: "Impossible d'analyser cette photo, réessaie avec une autre image." },
      { status: 502 }
    );
  }

  return NextResponse.json(extraction);
}
