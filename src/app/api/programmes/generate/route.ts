import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/server";
import { genererPilier } from "@/lib/programmes/generer";
import { prochaineVersion } from "@/lib/programmes/version";
import { prisma } from "@/lib/db/client";
import { sendAdminNotification } from "@/lib/email/client";
import { canGenerateProgramme, getEffectivePlan, isInTrial } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

// Les piliers sont générés en parallèle par l'IA (appels Claude avec un
// max_tokens élevé) : ça peut dépasser la limite par défaut des fonctions
// Vercel (10s). On étend explicitement le délai autorisé (60s, plafond du
// plan Hobby). Génération elle-même (2 étapes : structure puis détail de
// chaque jour en parallèle) dans src/lib/programmes/generer.ts, partagée
// avec le moteur d'adaptation.
export const maxDuration = 60;

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

  // Génération bloquée tant que l'essai offert (7 jours, offre Impulsion)
  // n'est pas terminé — sinon un abonné peut générer son programme puis
  // résilier avant le premier prélèvement, sans jamais payer.
  if (isInTrial(user.subscription)) {
    return NextResponse.json(
      { error: "Ton programme sera généré une fois ton abonnement activé (fin de l'essai offert)." },
      { status: 403 }
    );
  }

  // Génération bloquée en l'absence d'abonnement Stripe actif — sans ce
  // garde-fou, quelqu'un qui n'a jamais payé (checkout Stripe abandonné,
  // abonnement résilié/incomplet) était traité comme le palier Gratuit par
  // défaut ailleurs dans le code et pouvait générer un programme complet
  // sans jamais avoir de CB enregistrée.
  if (!canGenerateProgramme(user.subscription)) {
    return NextResponse.json(
      { error: "Un abonnement actif (Impulsion ou Transformation) est nécessaire pour générer ton programme." },
      { status: 403 }
    );
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
    hrv: user.profile?.hrv,
    resumeMontre: user.profile?.resumeMontre,
    morphologieDetectee: user.profile?.morphologieDetectee,
    observationsPosture: user.profile?.observationsPosture,
  };

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

  const resultats = await Promise.allSettled(
    piliers.map(async (pilier) => {
      const [contenu, version] = await Promise.all([
        genererPilier(pilier, profil),
        prochaineVersion(user.id, pilier),
      ]);
      return prisma.programmeGenerated.create({
        data: { userId: user.id, pilier, contenu: contenu as object, statut: statutInitial, version },
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
