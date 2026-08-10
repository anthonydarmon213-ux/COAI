import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";

const bodySchema = z.object({
  note: z.number().int().min(1).max(5),
  commentaire: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const avis = await prisma.avis.create({
    data: { userId: user.id, note: parsed.data.note, commentaire: parsed.data.commentaire },
  });

  await sendAdminNotification(
    `Nouvel avis COAI — ${parsed.data.note}/5`,
    `${user.prenom ? user.prenom : "Un abonné"} (${user.email}) a laissé un avis (${parsed.data.note}/5) :\n\n${parsed.data.commentaire}`
  );

  return NextResponse.json(avis, { status: 201 });
}
