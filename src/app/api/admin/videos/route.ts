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
      categorie: parsed.data.categorie || null,
    },
  });

  return NextResponse.json(video);
}
