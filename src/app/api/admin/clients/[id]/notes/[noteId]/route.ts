import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { z } from "zod";

const schema = z.object({ content: z.string().trim().min(1).max(2000) });

async function requireAdmin() {
  const auth = await getCurrentUser();
  if (!auth) return null;
  return prisma.user.findUnique({ where: { supabaseAuthId: auth.id }, select: { isAdmin: true } });
}

export async function PATCH(request: Request, { params }: { params: { id: string; noteId: string } }) {
  const admin = await requireAdmin();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Note invalide" }, { status: 400 });
  const result = await prisma.coachNote.updateMany({ where: { id: params.noteId, clientId: params.id }, data: { content: parsed.data.content } });
  if (result.count === 0) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  return NextResponse.json({ updated: true });
}

export async function DELETE(_request: Request, { params }: { params: { id: string; noteId: string } }) {
  const admin = await requireAdmin();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const result = await prisma.coachNote.deleteMany({ where: { id: params.noteId, clientId: params.id } });
  if (result.count === 0) return NextResponse.json({ error: "Note introuvable" }, { status: 404 });
  return NextResponse.json({ deleted: true });
}
