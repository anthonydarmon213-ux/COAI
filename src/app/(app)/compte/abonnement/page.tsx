import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, isInTrial, PLAN_LABELS } from "@/lib/subscription/plan";
import { PLAN_FEATURES } from "@/lib/subscription/plan-features";
import { PortalButton } from "@/components/compte/portal-button";
import { ParrainageCard } from "@/components/compte/parrainage-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";
import Image from "next/image";
import { ChurnFeedbackForm } from "@/components/compte/churn-feedback-form";
import { VipCheckoutButton } from "@/components/marketing/vip-checkout-button";
import { TIER_BY_SERVICE, VIP_MESSAGE } from "@/lib/pricing/tiers";

const PRIX_MENSUELS = { GRATUIT: 19, STANDARD: 49, PREMIUM: 199 } as const;
const PRIX_ANNUELS = { GRATUIT: 190, STANDARD: 490, PREMIUM: 2388 } as const;

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
  const enEssai = isInTrial(user.subscription);
  const vipHref = buildWhatsAppLink(VIP_MESSAGE);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 border-b border-acier/25 pb-7">
        <SectionLabel>Compte</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          Votre coach humain.
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <SectionLabel>Mon histoire</SectionLabel>
        <Card className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex shrink-0 flex-col items-center gap-3 sm:items-stretch">
            <Image
              src="/anthony-darmon-portrait.jpg"
              alt="Anthony Darmon"
              width={144}
              height={192}
              className="h-40 w-32 rounded-xl object-cover sm:h-48 sm:w-36"
            />
            <div className="flex items-center justify-center gap-2.5">
              <a
                href="https://instagram.com/anthonydarmoncoach"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-graphite-700 text-graphite-300 transition hover:border-laiton-400/40 hover:text-laiton-300"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/darmon-anthony-7a1303101"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-graphite-700 text-graphite-300 transition hover:border-laiton-400/40 hover:text-laiton-300"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-semibold text-graphite-50">Anthony Darmon</h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-acier">
                Fondateur de COAI
              </p>
              <p className="font-editorial text-sm italic text-laiton-300">
                « Le mouvement est la clé de tout. »
              </p>
            </div>
            <p className="text-sm leading-6 text-graphite-300">
              Anthony affiche aujourd&apos;hui un âge métabolique de 24 ans, à bientôt 40 ans —
              la preuve concrète de ce qu&apos;il enseigne. Sportif depuis l&apos;enfance :
              musculation et callisthénie — force et posture — jusqu&apos;à faire du handstand sa
              signature ; quinze ans de karaté — rigueur et précision du mouvement — qui
              l&apos;ont mené jusqu&apos;au Japon pour se former auprès de grands maîtres ; un
              séjour en Inde pour se certifier au yoga — respiration et maîtrise mentale — et un
              autre en Thaïlande pour le muay thaï — endurance et sang-froid.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              Coach diplômé d&apos;État, titulaire de la carte professionnelle
              d&apos;éducateur sportif et formé à l&apos;Institut des Métiers de la Forme (double
              mention forme et force), il cumule dix-sept ans d&apos;expérience terrain. Formé
              dans les clubs premium parisiens, il exerce aujourd&apos;hui au Club Montgolfière
              Paris et au Club RITM Saint-Germain, intervient en entreprise et accompagne à
              distance depuis 2020. Il a travaillé avec des centaines d&apos;entrepreneurs, VIP,
              politiques, acteurs et une Miss France.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              Sa mission : transmettre son expertise et motiver le plus grand nombre — pour un
              corps et un esprit en santé le plus longtemps possible. C&apos;est pour ça que COAI
              existe.
            </p>
          </div>
        </Card>
      </div>

      <Card className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-graphite-50">{PLAN_LABELS[plan]}</span>
          {statut && <Badge tone={STATUT_TONES[statut]}>{STATUT_LABELS[statut]}</Badge>}
          {user.subscription?.billingInterval === "ANNUAL" && <Badge tone="success">Facturation annuelle</Badge>}
        </div>
        <ul className="flex flex-col gap-1.5">
          {PLAN_FEATURES[plan].map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-graphite-300">
              <span className="mt-0.5 text-laiton-400">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        {finProgrammee && (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-laiton-400/25 bg-laiton-400/[0.06] p-3">
            <p className="text-sm text-laiton-300">
              Résiliation programmée — ton accès se termine le{" "}
              {user.subscription!.currentPeriodEnd!.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}.
            </p>
            <p className="text-xs text-graphite-400">Tu peux annuler la résiliation depuis le portail tant que cette date n’est pas passée.</p>
            <PortalButton label="Conserver mon abonnement" />
            <ChurnFeedbackForm />
          </div>
        )}
        {statut === "PAST_DUE" && (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-red-400/25 bg-red-400/[0.06] p-3">
            <p className="text-sm text-red-300">Ton dernier paiement n’a pas abouti.</p>
            <p className="text-xs text-graphite-400">Mets à jour ton moyen de paiement pour éviter une interruption de ton accompagnement.</p>
            <PortalButton label="Mettre à jour mon paiement" />
          </div>
        )}
        {!finProgrammee && enEssai && (
          <p className="text-sm text-graphite-400">
            Tes 7 jours offerts se terminent le{" "}
            {user.subscription!.trialEnd!.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            — passage automatique à {user.subscription?.billingInterval === "ANNUAL" ? `${PRIX_ANNUELS[plan]}€/an` : `${PRIX_MENSUELS[plan]}€/mois`} sauf résiliation avant cette date.
          </p>
        )}
        {statut && !finProgrammee && statut !== "PAST_DUE" ? (
          <div className="flex flex-wrap items-center gap-4">
            <PortalButton />
            <a href="/pricing" className="text-sm text-laiton-400 underline">
              Voir les formules et les prix
            </a>
          </div>
        ) : !statut ? (
          <a href="/pricing" className="text-laiton-400 underline">
            Voir les offres — à partir de 19€/mois
          </a>
        ) : null}
      </Card>

      <ParrainageCard />

      <Card id="vip" className="flex scroll-mt-24 flex-col items-start gap-4 border-laiton-400/30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
            Aller plus loin
          </span>
          <Badge tone="warning">Places limitées</Badge>
        </div>
        <h2 className="text-lg font-semibold text-graphite-50">Coaching VIP avec Anthony Darmon</h2>
        <p className="text-sm text-graphite-300">{TIER_BY_SERVICE.VIP.description}</p>

        {TIER_BY_SERVICE.VIP.sessions && (
          <div className="flex w-full flex-col gap-3 rounded-lg border border-graphite-800 bg-graphite-900/40 p-3 text-sm">
            {TIER_BY_SERVICE.VIP.sessions.map((session) => (
              <div key={session.label} className="flex flex-col gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-graphite-300">{session.label}</span>
                  <span className="font-semibold text-white">{session.prix}</span>
                </div>
                {session.pack && (
                  <VipCheckoutButton pack={session.pack} label={`Acheter — ${session.prix}`} variant="secondary" />
                )}
              </div>
            ))}
            <p className="text-xs leading-5 text-graphite-400">
              Valable 3 mois. Report gratuit jusqu&apos;à 24 h avant la séance ; passé ce délai, la
              séance est due.
            </p>
          </div>
        )}

        {vipHref && (
          <a href={vipHref} target="_blank" rel="noopener noreferrer" className="w-full">
            <Button variant="ghost" className="w-full">Une question ? Écrire sur WhatsApp</Button>
          </a>
        )}
      </Card>
    </div>
  );
}
