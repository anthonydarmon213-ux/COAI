import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { reprendreProgrammeHabituel } from "@/lib/adaptation/engine";
import type { Pilier } from "@prisma/client";

const SLUG_TO_PILIER: Record<string, Pilier> = {
  entrainement: "ENTRAINEMENT",
  alimentation: "NUTRITION",
  recuperation: "RECUPERATION",
};

// "Ton voyage est terminé. Reprendre ton programme habituel ?" — revient au
// contenu d'avant l'adaptation temporaire (mode voyage), sans le supprimer
// de l'historique des versions.
export async function POST(_request: Request, { params }: { params: { pilier: string } }) {
  const pilier = SLUG_TO_PILIER[params.pilier];
  if (!pilier) {
    return NextResponse.json({ error: "Pilier inconnu" }, { status: 400 });
  }

  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const resultat = await reprendreProgrammeHabituel(user.id, pilier);
  if (!resultat) {
    return NextResponse.json(
      { error: "Aucun programme temporaire actif à reprendre pour ce pilier." },
      { status: 400 }
    );
  }

  return NextResponse.json(resultat, { status: 200 });
}
