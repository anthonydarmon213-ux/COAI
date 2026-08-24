import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { ProgrammePdf } from "@/lib/pdf/programme-pdf";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import type { Pilier } from "@prisma/client";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Mêmes slugs que les routes /programme/* (entrainement, alimentation,
// recuperation) pour rester cohérent avec le reste de l'app.
const SLUG_TO_PILIER: Record<string, Pilier> = {
  entrainement: "ENTRAINEMENT",
  alimentation: "NUTRITION",
  recuperation: "RECUPERATION",
};

export async function GET(request: Request, { params }: { params: { pilier: string } }) {
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

  const heroPath: Record<Pilier, string> = {
    ENTRAINEMENT: "/exercices/back-squat-barre.jpg",
    NUTRITION: "/repas/plat-saumon-quinoa-brocolis.jpg",
    RECUPERATION: user.profile?.sexe?.toLowerCase() === "homme"
      ? "/recuperation/sauna-homme-blond-premium.jpg"
      : "/recuperation/sauna-femme-blonde-premium.jpg",
  };
  const heroUrl = new URL(heroPath[pilier], request.url).toString();

  const exerciseImages: Record<string, string> = {};
  if (pilier === "ENTRAINEMENT" && isRecord(affiche.contenu)) {
    const seances = Array.isArray(affiche.contenu.seances) ? affiche.contenu.seances : [];
    const premiereSeance = isRecord(seances[0]) ? seances[0] : null;
    const exercices = premiereSeance && Array.isArray(premiereSeance.exercices) ? premiereSeance.exercices : [];
    for (const exercice of exercices.slice(0, 6)) {
      if (!isRecord(exercice) || typeof exercice.nom !== "string") continue;
      const photo = photoCoaiPourNom(exercice.nom);
      if (photo) exerciseImages[exercice.nom] = new URL(photo, request.url).toString();
    }
  }

  const buffer = await renderToBuffer(
    <ProgrammePdf pilier={pilier} data={affiche.contenu} prenom={user.prenom} generatedAt={affiche.generatedAt} heroUrl={heroUrl} exerciseImages={exerciseImages} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="coai-programme-${params.pilier}.pdf"`,
    },
  });
}
