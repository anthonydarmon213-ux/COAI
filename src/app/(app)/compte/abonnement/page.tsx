import { getCurrentAppUser } from "@/lib/auth/server";
import { PortalButton } from "@/components/compte/portal-button";

const STATUT_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Résilié",
  INCOMPLETE: "Incomplet",
};

export default async function AbonnementPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const statut = user.subscription?.status;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Mon abonnement</h1>
      <p className="text-graphite-200">
        Statut : {statut ? STATUT_LABELS[statut] : "Aucun abonnement actif"}
      </p>
      {statut ? (
        <PortalButton />
      ) : (
        <a href="/pricing" className="text-laiton-400 underline">
          S&apos;abonner pour 49€/mois
        </a>
      )}
    </div>
  );
}
