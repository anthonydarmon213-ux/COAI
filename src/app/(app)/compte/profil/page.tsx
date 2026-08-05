import { getCurrentAppUser } from "@/lib/auth/server";
import { ProfilForm } from "@/components/compte/profil-form";
import { SectionLabel } from "@/components/ui/section-label";

export default async function ProfilPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Compte</SectionLabel>
        <h1 className="text-2xl font-semibold">Mon profil</h1>
        <p className="text-sm text-graphite-400">
          Ces informations servent à personnaliser ton programme généré par l&apos;IA.
        </p>
      </div>
      <ProfilForm
        profil={{
          objectifs: user.profile?.objectifs,
          niveau: user.profile?.niveau,
          equipementDisponible: user.profile?.equipementDisponible,
          contraintesSante: user.profile?.contraintesSante,
          tailleCm: user.profile?.tailleCm,
          age: user.profile?.age,
          morphologie: user.profile?.morphologie,
          frequenceEntrainement: user.profile?.frequenceEntrainement,
          habitudesAlimentaires: user.profile?.habitudesAlimentaires,
          consommationCafe: user.profile?.consommationCafe,
          consommationAlcool: user.profile?.consommationAlcool,
          qualiteSommeil: user.profile?.qualiteSommeil,
        }}
      />
    </div>
  );
}
