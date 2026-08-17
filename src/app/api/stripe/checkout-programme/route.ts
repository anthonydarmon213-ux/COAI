import { NextResponse } from "next/server";

// Ancien checkout one-shot désactivé : les offres COAI sont désormais
// des accompagnements mensuels présentés sur la page des formules.
export async function POST() {
  return NextResponse.json(
    { error: "Cette ancienne offre n'est plus disponible.", redirect: "/pricing" },
    { status: 410 }
  );
}
