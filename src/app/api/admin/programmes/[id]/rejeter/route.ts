import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  note: z.string().max(1000).optional(),
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

  const programme = await prisma.programmeGenerated.findUnique({ where: { id: params.id } });
  if (!programme || programme.statut !== "EN_ATTENTE") {
    return NextResponse.json({ error: "Programme introuvable ou déjà traité" }, { status: 404 });
  }

  // Même correctif que la validation (Phase 4) : sans ça, la
  // ProgrammeAdaptation d'origine restait "EN_ATTENTE" indéfiniment, pointant
  // vers un ProgrammeGenerated qui vient d'être supprimé.
  await prisma.programmeAdaptation.updateMany({
    where: { programmeSuivantId: params.id, statut: "EN_ATTENTE" },
    data: { statut: "REJETEE", ...(parsed.data.note ? { noteCoach: parsed.data.note } : {}) },
  });

  await prisma.programmeGenerated.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
