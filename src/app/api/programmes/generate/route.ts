import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateWithAI, type ProfilUtilisateur } from "@/lib/ai/client";
import {
  buildProgrammeEntrainementStructurePrompt,
  type StructureEntrainement,
} from "@/lib/ai/prompts/programme-entrainement-structure";
import { buildProgrammeEntrainementSessionPrompt } from "@/lib/ai/prompts/programme-entrainement-session";
import { buildProgrammeNutritionPrompt } from "@/lib/ai/prompts/programme-nutrition";
import { buildProgrammeRecuperationPrompt } from "@/lib/ai/prompts/programme-recuperation";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import type { Pilier } from "@prisma/client";

// Les piliers sont générés en parallèle par l'IA (appels Claude avec un
// max_tokens élevé) : ça peut dépasser la limite par défaut des fonctions
// Vercel (10s). On étend explicitement le délai autorisé (60s, plafond du
// plan Hobby).
export const maxDuration = 60;

// ENTRAÎNEMENT est généré en 2 étapes (structure rapide, puis le détail de
// chaque séance en parallèle) au lieu d'un seul gros appel : avec tout le
// niveau de détail demandé par séance (échauffement, méthode, répétitions,
// charge...), un appel unique dépassait 60s (mesuré ~76s) et provoquait un
// timeout Vercel. NUTRITION et RÉCUPÉRATION restent des appels simples,
// nettement plus courts (~34s mesuré pour NUTRITION).
async function genererEntrainement(profil: ProfilUtilisateur) {
  const structure = await generateWithAI<StructureEntrainement>(
    buildProgrammeEntrainementStructurePrompt(profil)
  );

  const seances = await Promise.all(
    structure.jours.map((jour) =>
      generateWithAI(buildProgrammeEntrainementSessionPrompt(profil, jour))
    )
  );

  return {
    titre: structure.titre,
    frequenceParSemaine: structure.frequenceParSemaine,
    vueEnsemble: structure.vueEnsemble,
    dureeProgramme: structure.dureeProgramme,
    seances,
  };
}

async function genererPilier(pilier: Pilier, profil: ProfilUtilisateur) {
  switch (pilier) {
    case "ENTRAINEMENT":
      return genererEntrainement(profil);
    case "NUTRITION":
      return generateWithAI(buildProgrammeNutritionPrompt(profil));
    case "RECUPERATION":
      return generateWithAI(buildProgrammeRecuperationPrompt(profil));
  }
}

// Génère dynamiquement les 3 piliers du programme (pas de bibliothèque
// pré-construite — décision actée) à partir du Profile courant de l'utilisateur.
export async function POST() {
  const authUser = await getCurrentUser();
  if (!authUser) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseAuthId: authUser.id },
    include: { profile: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  const profil = {
    objectifs: user.profile?.objectifs,
    niveau: user.profile?.niveau,
    equipementDisponible: user.profile?.equipementDisponible,
    contraintesSante: user.profile?.contraintesSante,
    antecedentsMedicaux: user.profile?.antecedentsMedicaux,
    tailleCm: user.profile?.tailleCm,
    age: user.profile?.age,
    sexe: user.profile?.sexe,
    morphologie: user.profile?.morphologie,
    frequenceEntrainement: user.profile?.frequenceEntrainement,
    sportsPratiques: user.profile?.sportsPratiques,
    habitudesAlimentaires: user.profile?.habitudesAlimentaires,
    repasParJour: user.profile?.repasParJour,
    hydratation: user.profile?.hydratation,
    consommationCafe: user.profile?.consommationCafe,
    consommationAlcool: user.profile?.consommationAlcool,
    qualiteSommeil: user.profile?.qualiteSommeil,
  };

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

  const resultats = await Promise.allSettled(
    piliers.map(async (pilier) => {
      const contenu = await genererPilier(pilier, profil);
      return prisma.programmeGenerated.create({
        data: { userId: user.id, pilier, contenu: contenu as object },
      });
    })
  );

  resultats.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[programmes/generate] pilier ${piliers[i]} :`, r.reason);
    }
  });

  const echecs = resultats.filter((r): r is PromiseRejectedResult => r.status === "rejected");
  if (echecs.length === piliers.length) {
    return NextResponse.json(
      { error: "Échec de la génération IA", details: echecs.map((e) => String(e.reason)) },
      { status: 502 }
    );
  }

  const programmes = resultats
    .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof prisma.programmeGenerated.create>>> => r.status === "fulfilled")
    .map((r) => r.value);

  if (programmes.length > 0) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendAdminNotification(
      "Nouveau programme à valider",
      `${user.prenom ?? user.email} vient de générer ${programmes.length} pilier(s) de programme, en attente de ta validation.\n\n${appUrl}/admin/programmes`
    );
  }

  return NextResponse.json({ programmes, echecs: echecs.length }, { status: 201 });
}
