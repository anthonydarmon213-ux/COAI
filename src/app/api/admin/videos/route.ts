import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { extractYoutubeId } from "@/lib/youtube";

const bodySchema = z.object({
  titre: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  lien: z.string().trim().min(1),
  categorie: z.string().trim().max(60).optional().or(z.literal("")),
  // Aperçu offert (01/09/2026) : un SECOND lien YouTube, vers un extrait
  // publié séparément. Jamais un découpage de la vidéo complète — son
  // identifiant ne doit jamais parvenir à un non-abonné.
  lienApercu: z.string().trim().min(1).optional().or(z.literal("")),
  dureeMinutes: z.coerce.number().int().min(1).max(600).optional(),
  apercuMinutes: z.coerce.number().int().min(1).max(120).optional(),
});

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "Accès réservé au coach" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Formulaire invalide" }, { status: 400 });
  }

  const youtubeId = extractYoutubeId(parsed.data.lien);
  if (!youtubeId) {
    return NextResponse.json({ error: "Lien YouTube invalide" }, { status: 400 });
  }

  const video = await prisma.video.create({
    data: {
      titre: parsed.data.titre,
      description: parsed.data.description || null,
      youtubeId,
      youtubeIdApercu: parsed.data.lienApercu ? extractYoutubeId(parsed.data.lienApercu) : null,
      dureeMinutes: parsed.data.dureeMinutes ?? null,
      apercuMinutes: parsed.data.apercuMinutes ?? null,
      categorie: parsed.data.categorie || null,
    },
  });

  return NextResponse.json(video);
}
