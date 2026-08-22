import { NextResponse } from "next/server";
import { z } from "zod";
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
  hrv: number | null;
  resume: string | null;
};

// Payload envoyé par coai-mobile (lecture HealthKit native) — mêmes champs
// cibles que l'extraction par IA vision, mais valeurs exactes lues sur
// l'appareil : pas d'estimation, donc pas d'appel à generateWithVision pour
// ce chemin.
const healthkitSchema = z.object({
  source: z.literal("healthkit"),
  pasMoyenParJour: z.number().int().nonnegative().nullable().optional(),
  frequenceCardiaqueRepos: z.number().int().positive().max(250).nullable().optional(),
  sommeilMoyenHeures: z.number().nonnegative().max(24).nullable().optional(),
  vo2Max: z.number().positive().max(100).nullable().optional(),
  caloriesMoyennesParJour: z.number().int().nonnegative().nullable().optional(),
  hrv: z.number().nonnegative().nullable().optional(),
});

// Analyse un screenshot de montre/app santé connectée, OU reçoit une lecture
// HealthKit déjà structurée depuis coai-mobile — deux sources pour les mêmes
// colonnes du Profil. Pas d'écran de relecture avant écriture (choisi
// explicitement : simplicité > vérification manuelle). Une valeur absente
// (null/non fournie) n'écrase jamais une valeur déjà connue dans le profil,
// pour éviter qu'une lecture partielle efface des données valides d'une
// analyse précédente — vrai pour les deux chemins.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") ?? "";

  const data: Record<string, number | string | Date> = { derniereAnalyseMontre: new Date() };

  if (contentType.includes("application/json")) {
    const parsed = healthkitSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { source: _source, ...values } = parsed.data;
    for (const [key, value] of Object.entries(values)) {
      if (value != null) data[key] = value;
    }
    data.resumeMontre = "Synchronisé automatiquement via Apple Santé.";
  } else {
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    let extraction: Extraction;
    try {
      extraction = await generateWithVision<Extraction>(
        buildWatchScreenshotExtractionPrompt(),
        buffer.toString("base64"),
        mediaType,
        { userId: user.id, feature: "vision_montre" }
      );
    } catch (err) {
      console.error("[profil/montre] Échec de l'extraction IA", err);
      return NextResponse.json(
        { error: "Impossible d'analyser ce screenshot, réessaie avec une autre image." },
        { status: 502 }
      );
    }

    if (extraction.pasMoyenParJour != null) data.pasMoyenParJour = extraction.pasMoyenParJour;
    if (extraction.frequenceCardiaqueRepos != null)
      data.frequenceCardiaqueRepos = extraction.frequenceCardiaqueRepos;
    if (extraction.sommeilMoyenHeures != null)
      data.sommeilMoyenHeures = extraction.sommeilMoyenHeures;
    if (extraction.vo2Max != null) data.vo2Max = extraction.vo2Max;
    if (extraction.caloriesMoyennesParJour != null)
      data.caloriesMoyennesParJour = extraction.caloriesMoyennesParJour;
    if (extraction.hrv != null) data.hrv = extraction.hrv;
    if (extraction.resume) data.resumeMontre = extraction.resume;
  }

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });

  return NextResponse.json(profile);
}
