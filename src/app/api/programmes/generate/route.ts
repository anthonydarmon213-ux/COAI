import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { generateWithAI, type ProfilUtilisateur } from "@/lib/ai/client";
import {
  buildProgrammeEntrainementStructurePrompt,
  type StructureEntrainement,
} from "@/lib/ai/prompts/programme-entrainement-structure";
import { buildProgrammeEntrainementSessionPrompt } from "@/lib/ai/prompts/programme-entrainement-session";
import {
  buildProgrammeNutritionStructurePrompt,
  type StructureNutrition,
} from "@/lib/ai/prompts/programme-nutrition-structure";
import { buildProgrammeNutritionJourPrompt } from "@/lib/ai/prompts/programme-nutrition-jour";
import {
  buildProgrammeRecuperationStructurePrompt,
  type StructureRecuperation,
} from "@/lib/ai/prompts/programme-recuperation-structure";
import { buildProgrammeRecuperationJourPrompt } from "@/lib/ai/prompts/programme-recuperation-jour";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { getEffectivePlan } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

// Les piliers sont générés en parallèle par l'IA (appels Claude avec un
// max_tokens élevé) : ça peut dépasser la limite par défaut des fonctions
// Vercel (10s). On étend explicitement le délai autorisé (60s, plafond du
// plan Hobby).
export const maxDuration = 60;

// Les 3 piliers sont générés en 2 étapes (structure rapide, puis le détail
// de chaque jour en parallèle) au lieu d'un seul gros appel par pilier :
// avec le niveau de détail demandé par jour, un appel unique par pilier
// dépassait 60s (mesuré ~76s pour ENTRAÎNEMENT) et provoquait un timeout
// Vercel. Les appels "détail d'un jour" restent, eux, individuellement
// courts (mesuré ~34s pour un appel nutrition équivalent) et tournent en
// parallèle via Promise.all — la latence totale reste bornée par le plus
// lent des appels du jour, pas par leur somme.
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
    contreIndications: structure.contreIndications,
    dureeProgramme: structure.dureeProgramme,
    seances,
  };
}

async function genererNutrition(profil: ProfilUtilisateur) {
  const structure = await generateWithAI<StructureNutrition>(
    buildProgrammeNutritionStructurePrompt(profil)
  );

  const jours = await Promise.all(
    structure.jours.map((jour) => generateWithAI(buildProgrammeNutritionJourPrompt(profil, jour)))
  );

  return {
    titre: structure.titre,
    vueEnsemble: structure.vueEnsemble,
    contreIndications: structure.contreIndications,
    objectifsJournaliers: structure.objectifsJournaliers,
    conseilsHabitudes: structure.conseilsHabitudes,
    jours,
  };
}

async function genererRecuperation(profil: ProfilUtilisateur) {
  const structure = await generateWithAI<StructureRecuperation>(
    buildProgrammeRecuperationStructurePrompt(profil)
  );

  const jours = await Promise.all(
    structure.jours.map((jour) =>
      generateWithAI(buildProgrammeRecuperationJourPrompt(profil, jour))
    )
  );

  return {
    titre: structure.titre,
    vueEnsemble: structure.vueEnsemble,
    contreIndications: structure.contreIndications,
    jours,
  };
}

async function genererPilier(pilier: Pilier, profil: ProfilUtilisateur) {
  switch (pilier) {
    case "ENTRAINEMENT":
      return genererEntrainement(profil);
    case "NUTRITION":
      return genererNutrition(profil);
    case "RECUPERATION":
      return genererRecuperation(profil);
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
    include: { profile: true, subscription: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }

  // Palier Gratuit (19€) : programme 100% IA, jamais envoyé en relecture au
  // coach (statut GENERE_IA, visible immédiatement). Standard/Premium :
  // comportement inchangé, en attente de validation humaine.
  const plan = getEffectivePlan(user.subscription);
  const statutInitial = plan === "GRATUIT" ? "GENERE_IA" : "EN_ATTENTE";

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
    allergiesAlimentaires: user.profile?.allergiesAlimentaires,
    repasParJour: user.profile?.repasParJour,
    hydratation: user.profile?.hydratation,
    consommationCafe: user.profile?.consommationCafe,
    consommationAlcool: user.profile?.consommationAlcool,
    qualiteSommeil: user.profile?.qualiteSommeil,
    pasMoyenParJour: user.profile?.pasMoyenParJour,
    frequenceCardiaqueRepos: user.profile?.frequenceCardiaqueRepos,
    sommeilMoyenHeures: user.profile?.sommeilMoyenHeures,
    vo2Max: user.profile?.vo2Max,
    caloriesMoyennesParJour: user.profile?.caloriesMoyennesParJour,
    resumeMontre: user.profile?.resumeMontre,
    morphologieDetectee: user.profile?.morphologieDetectee,
    observationsPosture: user.profile?.observationsPosture,
  };

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

  const resultats = await Promise.allSettled(
    piliers.map(async (pilier) => {
      const contenu = await genererPilier(pilier, profil);
      return prisma.programmeGenerated.create({
        data: { userId: user.id, pilier, contenu: contenu as object, statut: statutInitial },
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

  if (programmes.length > 0 && statutInitial === "EN_ATTENTE") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendAdminNotification(
      "Nouveau programme à valider",
      `${user.prenom ?? user.email} vient de générer ${programmes.length} pilier(s) de programme, en attente de ta validation.\n\n${appUrl}/admin/programmes`
    );
  }

  return NextResponse.json({ programmes, echecs: echecs.length }, { status: 201 });
}
