import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { ProgrammeCompletPdf, type PilierPdfEntree } from "@/lib/pdf/programme-pdf";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import type { Pilier } from "@prisma/client";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ORDRE: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

// Fiche complète (02/09/2026, demande Anthony) : les trois piliers dans un
// seul PDF. Chacun avait déjà sa route, mais il fallait télécharger trois
// fichiers et les rassembler soi-même — d'où le « 1 / 1 » en pied de page.
export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const heroPath: Record<Pilier, string> = {
    ENTRAINEMENT: "/exercices/back-squat-barre.jpg",
    NUTRITION: "/repas/plat-saumon-quinoa-brocolis.jpg",
    RECUPERATION:
      user.profile?.sexe?.toLowerCase() === "homme"
        ? "/recuperation/sauna-homme-blond-premium.jpg"
        : "/recuperation/sauna-femme-blonde-premium.jpg",
  };

  const entrees: PilierPdfEntree[] = [];

  for (const pilier of ORDRE) {
    // Même sélection que les routes par pilier : le dernier programme validé
    // prime, sinon le dernier en attente ou généré par l'IA.
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
    if (!affiche) continue;

    const exerciseImages: Record<string, string> = {};
    if (pilier === "ENTRAINEMENT" && isRecord(affiche.contenu)) {
      const seances = Array.isArray(affiche.contenu.seances) ? affiche.contenu.seances : [];
      const premiere = isRecord(seances[0]) ? seances[0] : null;
      const exercices = premiere && Array.isArray(premiere.exercices) ? premiere.exercices : [];
      for (const exercice of exercices.slice(0, 6)) {
        if (!isRecord(exercice) || typeof exercice.nom !== "string") continue;
        const photo = photoCoaiPourNom(exercice.nom);
        if (photo) exerciseImages[exercice.nom] = new URL(photo, request.url).toString();
      }
    }

    entrees.push({
      pilier,
      data: affiche.contenu,
      generatedAt: affiche.generatedAt,
      heroUrl: new URL(heroPath[pilier], request.url).toString(),
      exerciseImages,
    });
  }

  if (entrees.length === 0) {
    return NextResponse.json({ error: "Aucun programme généré" }, { status: 404 });
  }

  const buffer = await renderToBuffer(
    <ProgrammeCompletPdf entrees={entrees} prenom={user.prenom} />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="coai-ma-fiche.pdf"`,
    },
  });
}
