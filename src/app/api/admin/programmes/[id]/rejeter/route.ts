import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "Accès réservé au coach" }, { status: 403 });
  }

  const programme = await prisma.programmeGenerated.findUnique({ where: { id: params.id } });
  if (!programme || programme.statut !== "EN_ATTENTE") {
    return NextResponse.json({ error: "Programme introuvable ou déjà traité" }, { status: 404 });
  }

  await prisma.programmeGenerated.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
