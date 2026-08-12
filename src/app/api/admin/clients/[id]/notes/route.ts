import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const schema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const auth = await getCurrentUser();
  if (!auth) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const admin = await prisma.user.findUnique({ where: { supabaseAuthId: auth.id }, select: { id: true, isAdmin: true } });
  if (!admin?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Note invalide" }, { status: 400 });
  const client = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  const note = await prisma.coachNote.create({ data: { clientId: client.id, authorId: admin.id, content: parsed.data.content } });
  return NextResponse.json(note, { status: 201 });
}
