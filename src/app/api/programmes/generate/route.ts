import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { saveGeneratedProgramme } from "@/lib/programmes/save-generated";
import { prisma } from "@/lib/db/client";
import { hasProgrammeAccess } from "@/lib/subscription/plan";
import { socleEntrainement, socleNutrition, socleRecuperation, socleAcceptable } from "@/lib/programmes-socles";
import { computeProfilCompletion } from "@/lib/profil/completion";
import type { Pilier, Prisma } from "@prisma/client";

export const maxDuration = 60;

// Décision Anthony, 10/09/2026 : bibliothèque pour toutes les offres,
// aucun repli IA payant. Les situations hors catalogue passent par le coach.
// Aucun changement rétroactif du statut des programmes existants.
export async function POST(request: Request) {
  const authUser = await getCurrentUser();
  if (!authUser) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true, subscription: true },
  });
  if (!user) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  if (!hasProgrammeAccess(user, user.subscription)) {
    return NextResponse.json({ error: "Choisis ton accompagnement COAI pour accéder à ton programme." }, { status: 403 });
  }

  const onboarding = new URL(request.url).searchParams.get("mode") === "onboarding";
  const tousLesPiliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];
  const derniers = (await Promise.all(tousLesPiliers.map(pilier => prisma.programmeGenerated.findFirst({
    where: { userId: user.id, pilier },
    orderBy: [{ generatedAt: "desc" }, { id: "desc" }],
    select: { id: true, pilier: true, statut: true },
  })))).filter((p): p is NonNullable<typeof p> => p !== null);
  const existants = onboarding ? derniers : [];
  const piliers = tousLesPiliers.filter(pilier => !existants.some(p => p.pilier === pilier));
  if (!piliers.length) {
    return NextResponse.json({ programmes: existants, echecs: 0, reused: true }, { status: 201 });
  }
  // Recréer ne doit pas contourner une relecture encore ouverte.
  if (derniers.some(p => p.statut === "EN_ATTENTE")) {
    return NextResponse.json({
      error: "Un programme attend encore sa relecture. Contacte ton coach avant de créer une nouvelle version.",
      requiresCoachReview: true, retryable: false,
    }, { status: 409 });
  }
  const completion = computeProfilCompletion(user.profile);
  if (!completion.essentielComplet) {
    return NextResponse.json({
      error: "Complète les informations essentielles de ton profil avant de préparer ton programme.",
      champsManquants: completion.champsEssentielsManquants,
    }, { status: 422 });
  }
  if (!socleAcceptable(user.profile ?? {})) {
    return NextResponse.json({
      error: "Ton profil nécessite un échange avec le coach avant de préparer un programme adapté. Aucun programme générique ne t’a été attribué.",
      requiresCoachReview: true, retryable: false,
    }, { status: 409 });
  }

  // Préparer tous les piliers avant d'enregistrer. Pas de remplacement payant
  // si le catalogue est absent ou défectueux.
  let contenus: unknown[];
  try {
    const builders = { ENTRAINEMENT: socleEntrainement, NUTRITION: socleNutrition, RECUPERATION: socleRecuperation };
    contenus = await Promise.all(piliers.map(pilier => builders[pilier](user.profile ?? {})));
    if (contenus.some(contenu => !contenu)) {
      return NextResponse.json({
        error: "Cette combinaison n’est pas encore disponible dans la bibliothèque. Contacte ton coach pour préparer la suite.",
        requiresCoachReview: true, retryable: false,
      }, { status: 409 });
    }
  } catch (error) {
    console.error("[programmes/generate] bibliothèque indisponible", error);
    return NextResponse.json({ error: "La bibliothèque est momentanément indisponible. Réessaie dans un instant.", retryable: true }, { status: 503 });
  }

  const resultats = await Promise.allSettled(piliers.map((pilier, index) => saveGeneratedProgramme({
    userId: user.id, pilier, contenu: contenus[index] as Prisma.InputJsonValue,
    statut: "GENERE_IA", onboarding,
  })));
  const sauvegardes = resultats
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof saveGeneratedProgramme>>> => r.status === "fulfilled")
    .map(r => r.value.programme);
  const echecs = resultats.length - sauvegardes.length;
  if (!sauvegardes.length) {
    return NextResponse.json({ error: "Le programme n’a pas pu être enregistré. Réessaie dans un instant.", retryable: true }, { status: 503 });
  }
  // Métadonnées uniquement : aucun contenu privé d'une relecture concurrente.
  return NextResponse.json({ programmes: [...existants, ...sauvegardes], echecs }, { status: 201 });
}
