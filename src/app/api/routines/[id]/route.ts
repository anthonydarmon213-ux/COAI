import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

// Suppression d'une routine. Le filtre porte sur userId ET id : sans le
// userId, connaître un identifiant suffirait à supprimer la routine d'un
// autre utilisateur.
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const suppression = await prisma.routine.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  if (suppression.count === 0) {
    return NextResponse.json({ error: "Routine introuvable" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
