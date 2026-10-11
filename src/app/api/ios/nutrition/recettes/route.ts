import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/server";
import { hasCatalogueAccess } from "@/lib/subscription/plan";
import { RECETTES } from "@/lib/nutrition/recettes";

export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, Authorization",
  "X-Content-Type-Options": "nosniff",
};

const RECETTES_OFFERTES = 3;

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers });
}

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user) return jsonError("Connecte-toi pour ouvrir les recettes COAI.", 401);

    // This isolated web hotfix preserves the subscription rule already live
    // on the recipe page. Apple access remains disabled until its database
    // migration, server configuration and sandbox delivery are verified.
    const fullCatalogue = hasCatalogueAccess(user.subscription);
    const visible = fullCatalogue ? RECETTES : RECETTES.slice(0, RECETTES_OFFERTES);
    const recipes = visible.map(({ slug, nom, description, photoLocale, typeRepas, tempsMinutes,
      macros, ingredients, etapes, portion, allergenes, conservation }) => ({
      slug, nom, description, photo: photoLocale ?? null, typeRepas, tempsMinutes,
      macros, ingredients, etapes, portion: portion ?? null,
      allergenes: allergenes ?? [], conservation: conservation ?? null,
    }));

    return NextResponse.json({ recipes, fullCatalogue, total: RECETTES.length }, { headers });
  } catch (error) {
    console.error("[ios-recipes] Could not load recipe library", error instanceof Error ? error.name : "UnknownError");
    return jsonError("Impossible de charger les recettes pour le moment. Réessaie dans un instant.", 503);
  }
}
