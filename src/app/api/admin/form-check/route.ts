import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  id: z.string().uuid(),
  reponse: z.string().trim().min(1).max(4000),
});

export async function PATCH(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
  }

  await prisma.formCheck.update({
    where: { id: parsed.data.id },
    data: { reponse: parsed.data.reponse, statut: "REPONDU", repondueAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
