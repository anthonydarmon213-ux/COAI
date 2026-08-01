import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";

// RGPD — droit à la portabilité : exporte l'ensemble des données personnelles
// de l'utilisateur (profil, programmes générés, séances, mesures, événements WhatsApp).
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const data = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: {
      profile: true,
      subscription: true,
      programmes: true,
      seances: true,
      mesures: true,
      whatsappEvents: true,
    },
  });

  if (!data) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  return NextResponse.json(data);
}
