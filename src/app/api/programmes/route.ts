import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import type { Pilier } from "@prisma/client";

// Dernier programme généré par pilier (entraînement/nutrition/récupération)
// pour l'utilisateur courant — utilisé par l'app mobile, qui n'a pas accès
// au Server Component pilier-page.tsx du site web.
export async function GET() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { supabaseAuthId: authUser.id } });
  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];
  const programmes = await Promise.all(
    piliers.map((pilier) =>
      prisma.programmeGenerated.findFirst({
        where: { userId: user.id, pilier, statut: { in: ["VALIDE", "GENERE_IA"] } },
        orderBy: { generatedAt: "desc" },
      })
    )
  );

  return NextResponse.json({
    entrainement: programmes[0],
    nutrition: programmes[1],
    recuperation: programmes[2],
  });
}
