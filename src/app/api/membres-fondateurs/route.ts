import { NextResponse } from "next/server";
import { MEMBRES_FONDATEURS_MAX, placesFondateursRestantes } from "@/lib/pricing/membre-fondateur";

// Sans paramètre de requête ni cookie lu, Next.js tenterait sinon de
// pré-rendre cette route statiquement au build (donc contre une base
// injoignable à ce moment-là) — forcé en dynamique pour un comptage
// toujours recalculé à la demande.
export const dynamic = "force-dynamic";

// Route publique (page tarifs/paywall, avant tout compte) : le nombre de
// places fondateurs restantes est une info marketing, pas une donnée
// personnelle — aucune auth requise. Comptage live, jamais mis en cache
// côté serveur pour rester exact.
export async function GET() {
  const placesRestantes = await placesFondateursRestantes();
  return NextResponse.json({ placesRestantes, max: MEMBRES_FONDATEURS_MAX });
}
