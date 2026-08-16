import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { ProfilForm } from "@/components/compte/profil-form";
import { ProfilCompletion } from "@/components/compte/profil-completion";
import { GenererProgrammeOnboarding } from "@/components/compte/generer-programme-onboarding";
import { MaFormuleCard } from "@/components/compte/ma-formule-card";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { computeProfilCompletion } from "@/lib/profil/completion";
import { hasSuiviAccess } from "@/lib/subscription/plan";
import type { ServiceKey } from "@/lib/pricing/tiers";

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: { onboarding?: string };
}) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const completion = computeProfilCompletion(user.profile);

  // Confirmation "Générer mon programme" (Phase 5.1, 11/08/2026) : affichée
  // uniquement quand on arrive depuis l'écran "COAI te connaît à X%" de
  // /bienvenue (?onboarding=1), le profil essentiel vient tout juste de
  // devenir suffisant, ET aucun programme n'existe encore — jamais montrée à
  // un abonné qui modifie juste son profil habituel.
  const enOnboarding = searchParams.onboarding === "1";
  const aDejaUnProgramme = enOnboarding
    ? Boolean(await prisma.programmeGenerated.findFirst({ where: { userId: user.id }, select: { id: true } }))
    : true;

  const formuleActuelle: ServiceKey | null = hasSuiviAccess(user.subscription)
    ? "TRANSFORMATION"
    : user.programmeUnlockedAt
      ? "IMPULSION"
      : null;

  return (
    <div className="flex flex-col gap-10">
      <div className="animate-reveal flex flex-col gap-3 border-b border-acier/25 pb-7">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Coaching</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Votre profil.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          {enOnboarding
            ? "Ton diagnostic nous a donné les bases. Complète maintenant les quelques informations qui permettront à COAI de construire un programme vraiment précis."
            : "Ces informations nourrissent votre programme IA — entraînement, alimentation, récupération — relu et validé par votre coach."}
        </p>
      </div>

      {/* Programme mis en avant, tout en haut (16/08/2026, demande Anthony —
          "c'est notre produit !") : avant en bas de page sous le long
          formulaire, remonté ici pour rester la première chose vue. */}
      <div className="flex flex-col gap-3">
        <Link
          href="/programme"
          className="flex items-center justify-between gap-4 rounded-2xl border border-laiton-400/30 bg-laiton-400/[0.08] px-6 py-5 transition hover:border-laiton-400/50 hover:bg-laiton-400/[0.12]"
        >
          <div className="flex flex-col gap-1">
            <SectionLabel>Ton programme</SectionLabel>
            <p className="text-sm text-graphite-300">
              Entraînement, nutrition et récupération — ce que ce profil nourrit vraiment.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-laiton-400 px-5 py-2.5 font-mono text-[0.65rem] font-semibold uppercase tracking-widest text-graphite-950">
            Voir mon programme →
          </span>
        </Link>

        <MaFormuleCard formuleActuelle={formuleActuelle} />
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Votre profil</SectionLabel>
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          <ProfilCompletion completion={completion} />
          {enOnboarding && completion.essentielComplet && !aDejaUnProgramme && (
            <GenererProgrammeOnboarding />
          )}
          <ProfilForm
            profil={{
              objectifs: user.profile?.objectifs,
              niveau: user.profile?.niveau,
              equipementDisponible: user.profile?.equipementDisponible,
              lieuEntrainement: user.profile?.lieuEntrainement,
              dureeSeanceMinutes: user.profile?.dureeSeanceMinutes,
              contraintesSante: user.profile?.contraintesSante,
              antecedentsMedicaux: user.profile?.antecedentsMedicaux,
              tailleCm: user.profile?.tailleCm,
              poidsKg: user.profile?.poidsKg,
              age: user.profile?.age,
              sexe: user.profile?.sexe,
              cycleMenstruelSuivi: user.profile?.cycleMenstruelSuivi,
              dateDernieresRegles: user.profile?.dateDernieresRegles,
              dureeCycleJours: user.profile?.dureeCycleJours,
              reglesDouloureuses: user.profile?.reglesDouloureuses,
              statutMaternite: user.profile?.statutMaternite,
              dateReferenceMaternite: user.profile?.dateReferenceMaternite,
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
              derniereAnalyseMontre: user.profile?.derniereAnalyseMontre,
              morphologieDetectee: user.profile?.morphologieDetectee,
              observationsPosture: user.profile?.observationsPosture,
            }}
          />
        </Card>
      </div>
    </div>
  );
}
