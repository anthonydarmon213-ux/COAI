import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, PLAN_LABELS } from "@/lib/subscription/plan";
import { PLAN_FEATURES } from "@/lib/subscription/plan-features";
import { PortalButton } from "@/components/compte/portal-button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import { InstagramIcon, LinkedinIcon } from "@/components/ui/social-icons";

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
  const enEssai =
    statut === "ACTIVE" && user.subscription?.trialEnd && user.subscription.trialEnd > new Date();
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
            <img
              src="/anthony-darmon-portrait.jpg"
              alt="Anthony Darmon"
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
        {!finProgrammee && enEssai && (
          <p className="text-sm text-graphite-400">
            Ton mois offert se termine le{" "}
            {user.subscription!.trialEnd!.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            — passage automatique à 19€/mois sauf résiliation avant cette date.
          </p>
        )}
        {statut ? (
          <div className="flex flex-wrap items-center gap-4">
            <PortalButton />
            <a href="/pricing" className="text-sm text-laiton-400 underline">
              Voir les formules et les prix
            </a>
          </div>
        ) : (
          <a href="/pricing" className="text-laiton-400 underline">
            Voir les offres — à partir de 49€/mois
          </a>
        )}
      </Card>

      <Card className="flex flex-col items-start gap-3 border-laiton-400/30">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
            Aller plus loin
          </span>
          <Badge tone="warning">Places limitées</Badge>
        </div>
        <h2 className="text-lg font-semibold text-graphite-50">Coaching VIP avec Anthony Darmon</h2>
        <p className="text-sm text-graphite-300">
          Une séance individuelle avec Anthony, en plus de ton programme — présentiel à Paris
          centre, en club ou à domicile (200€/1h), ou en visio (100€/1h). Réservation à la
          séance, sans abonnement.
        </p>
        {vipHref ? (
          <a href={vipHref} target="_blank" rel="noopener noreferrer">
            <Button>Réserver via WhatsApp</Button>
          </a>
        ) : (
          <Button disabled>Contacte ton coach pour réserver</Button>
        )}
      </Card>
    </div>
  );
}
