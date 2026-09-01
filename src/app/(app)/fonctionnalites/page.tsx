import { FonctionnalitesMenu } from "@/components/fonctionnalites/fonctionnalites-menu";
import { getCurrentAppUser } from "@/lib/auth/server";
import { getMembershipLabel, hasPaidSubscription } from "@/lib/subscription/plan";

export default async function FonctionnalitesPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;
  const abonne = hasPaidSubscription(user.subscription);

  return (
    <div className="flex flex-col gap-8">
      <div className="animate-reveal flex flex-col gap-3">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>{getMembershipLabel(user.subscription)}</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Tout ce que COAI sait faire.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-300">
          Les fonctions ouvertes à tous, et celles que débloque l&apos;abonnement.
          Un cadenas signale ce qui demande une formule active.
        </p>
      </div>
      <FonctionnalitesMenu abonne={abonne} />
    </div>
  );
}
