import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const schema = z.object({
  reason: z.enum(["PRIX", "UTILISATION", "RESULTATS", "TECHNIQUE", "COACHING", "AUTRE"]),
  comment: z.string().trim().max(500).optional(),
}).strict();

export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { subscription: true },
  });
  if (!user?.subscription?.cancelAtPeriodEnd) {
    return NextResponse.json({ error: "Aucune résiliation programmée" }, { status: 409 });
  }

  await prisma.churnFeedback.upsert({
    where: { userId: user.id },
    create: { userId: user.id, reason: parsed.data.reason, comment: parsed.data.comment || null },
    update: { reason: parsed.data.reason, comment: parsed.data.comment || null },
  });
  return NextResponse.json({ saved: true });
}
