import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { rejeterAdaptation } from "@/lib/adaptation/engine";

// "Garder mon programme actuel" — l'utilisateur refuse l'adaptation
// proposée par COAI. Aucune version créée, l'adaptation reste consultable
// (statut REJETEE) dans l'historique.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const resultat = await rejeterAdaptation(user.id, params.id);
  if ("error" in resultat) {
    return NextResponse.json({ error: resultat.error }, { status: 400 });
  }

  return NextResponse.json(resultat, { status: 200 });
}
