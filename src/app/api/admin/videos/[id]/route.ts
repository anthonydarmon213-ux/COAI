import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!admin?.isAdmin) {
    return NextResponse.json({ error: "Accès réservé au coach" }, { status: 403 });
  }

  await prisma.video.delete({ where: { id: params.id } });

  return NextResponse.json({ ok: true });
}
