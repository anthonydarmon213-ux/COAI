import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { generateWithVision } from "@/lib/ai/client";
import { buildWatchScreenshotExtractionPrompt } from "@/lib/ai/prompts/watch-screenshot-extraction";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type Extraction = {
  pasMoyenParJour: number | null;
  frequenceCardiaqueRepos: number | null;
  sommeilMoyenHeures: number | null;
  vo2Max: number | null;
  caloriesMoyennesParJour: number | null;
  resume: string | null;
};

// Analyse un screenshot de montre/app santé connectée et enrichit
// directement le Profil avec les métriques détectées — pas d'écran de
// relecture (choisi explicitement : simplicité > vérification manuelle).
// Une valeur non lisible sur l'image (null côté extraction) n'écrase pas
// une valeur déjà connue dans le profil, pour éviter qu'un screenshot
// partiel efface des données valides d'une analyse précédente.
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
      buildWatchScreenshotExtractionPrompt(),
      buffer.toString("base64"),
      mediaType
    );
  } catch (err) {
    console.error("[profil/montre] Échec de l'extraction IA", err);
    return NextResponse.json(
      { error: "Impossible d'analyser ce screenshot, réessaie avec une autre image." },
      { status: 502 }
    );
  }

  const data: Record<string, number | string | Date> = { derniereAnalyseMontre: new Date() };
  if (extraction.pasMoyenParJour != null) data.pasMoyenParJour = extraction.pasMoyenParJour;
  if (extraction.frequenceCardiaqueRepos != null)
    data.frequenceCardiaqueRepos = extraction.frequenceCardiaqueRepos;
  if (extraction.sommeilMoyenHeures != null) data.sommeilMoyenHeures = extraction.sommeilMoyenHeures;
  if (extraction.vo2Max != null) data.vo2Max = extraction.vo2Max;
  if (extraction.caloriesMoyennesParJour != null)
    data.caloriesMoyennesParJour = extraction.caloriesMoyennesParJour;
  if (extraction.resume) data.resumeMontre = extraction.resume;

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json(profile);
}
