import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, PLAN_LABELS } from "@/lib/subscription/plan";
import { PortalButton } from "@/components/compte/portal-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";

const STATUT_LABELS: Record<string, string> = {
  ACTIVE: "Actif",
  PAST_DUE: "Paiement en retard",
  CANCELED: "Résilié",
  INCOMPLETE: "Incomplet",
};

const STATUT_TONES: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  ACTIVE: "success",
  PAST_DUE: "warning",
  CANCELED: "danger",
  INCOMPLETE: "neutral",
};

export default async function AbonnementPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const statut = user.subscription?.status;
  const plan = getEffectivePlan(user.subscription);
  const finProgrammee = user.subscription?.cancelAtPeriodEnd && user.subscription.currentPeriodEnd;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <SectionLabel>Compte</SectionLabel>
        <h1 className="text-2xl font-semibold">Mon accompagnement</h1>
      </div>
      <Card className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-graphite-50">{PLAN_LABELS[plan]}</span>
          {statut && <Badge tone={STATUT_TONES[statut]}>{STATUT_LABELS[statut]}</Badge>}
        </div>
        {finProgrammee && (
          <p className="text-sm text-laiton-400">
            Résiliation programmée — ton accès se termine le{" "}
            {user.subscription!.currentPeriodEnd!.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        )}
        {statut ? (
          <PortalButton />
        ) : (
          <a href="/pricing" className="text-laiton-400 underline">
            Voir les offres — à partir de 49€/mois
          </a>
        )}
      </Card>

      {plan === "STANDARD" && (
        <Card className="flex flex-col items-start gap-3 border-laiton-400/30">
          <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
            Aller plus loin
          </span>
          <h2 className="text-lg font-semibold text-graphite-50">
            Passe à Premium — 199€/mois
          </h2>
          <p className="text-sm text-graphite-300">
            En plus de ton programme IA validé par Anthony, débloque 1 séance de coaching par
            mois en présentiel à Paris ou en visio — une version light de THE METHOD, sans
            attendre l&apos;accompagnement 1-to-1 complet.
          </p>
          <PortalButton label="Passer à Premium" />
        </Card>
      )}
    </div>
  );
}
