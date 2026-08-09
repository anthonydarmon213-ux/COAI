import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  date: z.coerce.date(),
  statut: z.enum(["COMME_PREVU", "PETIT_ECART", "GROS_ECART"]),
  notes: z.string().max(2000).optional(),
});

export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const repasLogs = await prisma.repasLog.findMany({
    where: { user: { supabaseAuthId: authUser.id } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(repasLogs);
}

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

  const repasLog = await prisma.repasLog.create({
    data: {
      userId: user.id,
      date: parsed.data.date,
      statut: parsed.data.statut,
      notes: parsed.data.notes,
    },
  });

  return NextResponse.json(repasLog, { status: 201 });
}
