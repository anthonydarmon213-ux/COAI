import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { ProgrammePdf } from "@/lib/pdf/programme-pdf";
import type { Pilier } from "@prisma/client";

export const runtime = "nodejs";

// Mêmes slugs que les routes /programme/* (entrainement, alimentation,
// recuperation) pour rester cohérent avec le reste de l'app.
const SLUG_TO_PILIER: Record<string, Pilier> = {
  entrainement: "ENTRAINEMENT",
  alimentation: "NUTRITION",
  recuperation: "RECUPERATION",
};

export async function GET(_request: Request, { params }: { params: { pilier: string } }) {
  const pilier = SLUG_TO_PILIER[params.pilier];
  if (!pilier) {
    return NextResponse.json({ error: "Pilier inconnu" }, { status: 400 });
  }

  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Même logique de sélection du programme affiché que PilierPage : le
  // dernier programme validé prime, sinon le dernier en attente/généré IA.
  const [valide, dernier] = await Promise.all([
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier, statut: "VALIDE" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier },
      orderBy: { generatedAt: "desc" },
    }),
  ]);
  const enAttente = dernier && dernier.statut === "EN_ATTENTE";
  const genereIA = dernier && dernier.statut === "GENERE_IA";
  const affiche = valide ? valide : enAttente || genereIA ? dernier : null;

  if (!affiche) {
    return NextResponse.json({ error: "Aucun programme généré" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <ProgrammePdf pilier={pilier} data={affiche.contenu} prenom={user.prenom} generatedAt={affiche.generatedAt} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="coai-programme-${params.pilier}.pdf"`,
    },
  });
}
