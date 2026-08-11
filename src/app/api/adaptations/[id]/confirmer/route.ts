import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { confirmerAdaptation } from "@/lib/adaptation/engine";

// Même contrainte de durée que /api/programmes/generate : la confirmation
// régénère réellement le contenu du pilier (déplacé ici depuis la
// proposition, cf. engine.ts).
export const maxDuration = 60;

// "Accepter" — l'utilisateur confirme l'adaptation proposée par COAI.
// Régénère le contenu et crée la nouvelle version seulement maintenant.
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const resultat = await confirmerAdaptation(user.id, params.id);
  if ("error" in resultat) {
    return NextResponse.json({ error: resultat.error }, { status: 400 });
  }

  return NextResponse.json(resultat, { status: 200 });
}
