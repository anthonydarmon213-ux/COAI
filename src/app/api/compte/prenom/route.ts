import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  prenom: z.string().max(100).nullable(),
  nom: z.string().max(100).nullable(),
});

export async function PUT(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { supabaseAuthId: authUser.id },
    data: { prenom: parsed.data.prenom, nom: parsed.data.nom },
  });

  return NextResponse.json({ prenom: user.prenom, nom: user.nom });
}
