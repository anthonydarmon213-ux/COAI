import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  contenu: z.unknown().optional(),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
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
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const programme = await prisma.programmeGenerated.update({
    where: { id: params.id },
    data: {
      statut: "VALIDE",
      valideAt: new Date(),
      ...(parsed.data.contenu !== undefined ? { contenu: parsed.data.contenu as object } : {}),
    },
  });

  return NextResponse.json(programme);
}
