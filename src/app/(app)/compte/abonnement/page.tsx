import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, PLAN_LABELS } from "@/lib/subscription/plan";
import { PortalButton } from "@/components/compte/portal-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { buildWhatsAppLink } from "@/lib/whatsapp";

const VIP_MESSAGE =
  "Bonjour Anthony, je suis sur mon espace COAI et j'aimerais réserver une séance VIP (présentiel ou visio).";

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
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);

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

      <Card className="flex flex-col items-start gap-3 border-laiton-400/30">
        <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
          Aller plus loin
        </span>
        <h2 className="text-lg font-semibold text-graphite-50">Coaching VIP avec Anthony Darmon</h2>
        <p className="text-sm text-graphite-300">
          Une séance individuelle avec Anthony, en plus de ton programme — présentiel à Paris
          centre (200€/1h) ou en visio (100€/1h). Réservation à la séance, sans abonnement.
        </p>
        {vipHref ? (
          <a href={vipHref} target="_blank" rel="noopener noreferrer">
            <Button>Réserver via WhatsApp</Button>
          </a>
        ) : (
          <p className="text-sm text-graphite-400">Contacte ton coach pour réserver.</p>
        )}
      </Card>
    </div>
  );
}
