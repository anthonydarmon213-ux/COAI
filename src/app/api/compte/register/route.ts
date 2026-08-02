import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

const bodySchema = z.object({
  consentRgpd: z.boolean(),
});

// Appelée par le client juste après un signUp() Supabase Auth réussi :
// crée l'enregistrement User applicatif correspondant, avec l'horodatage
// du consentement RGPD explicite recueilli à l'inscription.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser || !authUser.email) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!parsed.data.consentRgpd) {
    return NextResponse.json({ error: "Consentement RGPD requis" }, { status: 400 });
  }

  const user = await prisma.user.upsert({
    where: { supabaseAuthId: authUser.id },
    update: {},
    create: {
      supabaseAuthId: authUser.id,
      email: authUser.email,
      consentRgpdAt: new Date(),
    },
  });

  return NextResponse.json(user, { status: 201 });
}
