import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan } from "@/lib/subscription/plan";
import { AskCoach } from "@/components/coach/ask-coach";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import Link from "next/link";

export default async function CoachPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const plan = getEffectivePlan(user.subscription);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-white/[0.07] pb-7">
        <SectionLabel>Coach IA</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Posez votre question.
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">
          Réponse immédiate par l&apos;IA, dans l&apos;esprit de la méthode d&apos;Anthony
          Darmon. Pour un suivi médical ou un ajustement personnalisé approfondi, un échange
          direct avec ton coach reste la meilleure option.
        </p>
      </div>

      {plan === "GRATUIT" ? (
        <Card className="flex flex-col items-start gap-3">
          <Badge tone="warning">Réservé aux offres Standard et Premium</Badge>
          <p className="text-sm text-graphite-300">
            Passe à l&apos;offre Standard (49€/mois) pour poser tes questions à ton coach IA à
            tout moment.
          </p>
          <Link href="/pricing">
            <Button>Voir les offres</Button>
          </Link>
        </Card>
      ) : (
        <AskCoach />
      )}
    </div>
  );
}
