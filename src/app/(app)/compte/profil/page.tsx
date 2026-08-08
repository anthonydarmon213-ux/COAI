import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { ProfilForm } from "@/components/compte/profil-form";
import { ProfilCompletion } from "@/components/compte/profil-completion";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import { computeProfilCompletion } from "@/lib/profil/completion";

export default async function ProfilPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const { remplis, total } = computeProfilCompletion(user.profile);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Coaching</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Votre profil.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Ces informations nourrissent votre programme IA — entraînement, alimentation,
          récupération — relu et validé par votre coach.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Votre profil</SectionLabel>
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          <ProfilCompletion remplis={remplis} total={total} />
          <ProfilForm
            profil={{
              objectifs: user.profile?.objectifs,
              niveau: user.profile?.niveau,
              equipementDisponible: user.profile?.equipementDisponible,
              contraintesSante: user.profile?.contraintesSante,
              antecedentsMedicaux: user.profile?.antecedentsMedicaux,
              tailleCm: user.profile?.tailleCm,
              poidsKg: user.profile?.poidsKg,
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
              derniereAnalyseMontre: user.profile?.derniereAnalyseMontre,
            }}
          />
        </Card>

        <Link href="/programme" className="text-sm text-laiton-400 underline">
          Voir votre programme →
        </Link>
      </div>
    </div>
  );
}
