import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { generateWithVision } from "@/lib/ai/client";
import { buildMenuRestaurantPrompt } from "@/lib/ai/prompts/menu-restaurant-extraction";
import { hasPaidSubscription } from "@/lib/subscription/plan";

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

type Extraction = {
  analysable: boolean;
  restaurant: string | null;
  choix: { plat: string; pourquoi: string; ajustement: string | null }[];
  resume: string | null;
};

// Restaurant Decoder (22/08/2026, demande Anthony) — mêmes garde-fous que
// /api/nutrition/photo-repas : image traitée en mémoire, jamais stockée,
// rien écrit en base. C'est une aide à la décision ponctuelle, pas une
// donnée de profil.
//
// L'image est compressée CÔTÉ CLIENT avant l'envoi (cf. le composant) : une
// photo de menu prise au téléphone fait 3-5 Mo, dont l'immense majorité est
// inutile pour lire du texte. Moins d'octets = moins de tokens d'image
// facturés et un aller-retour plus rapide au restaurant, où la personne
// attend.
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

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true, subscription: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }
  if (!hasPaidSubscription(user.subscription)) {
    return NextResponse.json(
      { error: "Le scanner de menu est réservé à COAI Premium et COAI Elite." },
      { status: 403 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

  let extraction: Extraction;
  try {
    extraction = await generateWithVision<Extraction>(
      buildMenuRestaurantPrompt(user.profile?.objectifs),
      buffer.toString("base64"),
      mediaType,
      { userId: user.id, feature: "vision_menu" }
    );
  } catch (err) {
    console.error("[nutrition/menu-restaurant] Échec de l'extraction IA", err);
    return NextResponse.json(
      { error: "Impossible de lire ce menu, réessaie avec une photo plus nette." },
      { status: 502 }
    );
  }

  return NextResponse.json(extraction);
}
