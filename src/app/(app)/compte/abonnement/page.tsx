import { getCurrentAppUser } from "@/lib/auth/server";
import { getEffectivePlan, PLAN_LABELS } from "@/lib/subscription/plan";
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
              Passionné par le mouvement du corps, sportif depuis toujours — pratiquant de
              musculation et de callisthénie. Quinze ans de karaté, jusqu&apos;à la ceinture
              noire, deuxième dan obtenu à Paris — après un voyage au Japon pour pratiquer
              directement auprès des grands maîtres. Une recherche du même genre l&apos;a mené en
              Inde, où il s&apos;est certifié au yoga, et en Thaïlande, où il s&apos;est entraîné
              au muay thaï en stage, dans des camps locaux. Également adepte de philosophie, il
              est fasciné par la puissance du mental — la même exigence qu&apos;il applique au
              corps. Sa signature, et l&apos;un de ses mouvements préférés : le handstand.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              De ce parcours est né un métier : coach diplômé d&apos;État, titulaire de la carte
              professionnelle d&apos;éducateur sportif. Dix-sept ans d&apos;expérience sur le
              terrain — en salle, en visio, à corriger un mouvement, ajuster un macro, entendre ce
              qu&apos;un chiffre sur la balance ne dit jamais. Formé dans les clubs premium
              parisiens, il a fait évoluer sa pratique avec son temps — coaching à distance
              développé dès le Covid, à domicile, en entreprise. Il coache aujourd&apos;hui à la
              Montgolfière Paris et au Club RITM Saint-Germain. Il a accompagné des personnes très
              différentes — entrepreneurs, VIP, politiques, acteurs, Miss France — mais toutes
              réunies par la même chose : passer à l&apos;action. Lui-même Bélier, il fonce.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              Son objectif : mettre les gens en mouvement, améliorer leur santé et leur longévité —
              un corps sans douleur, fonctionnel, fort, endurant, souple : toutes les qualités
              physiques. Convaincu que le mouvement est la clé d&apos;une meilleure santé —
              surtout quand on reste assis toute la journée, c&apos;est vital — il veut
              aujourd&apos;hui impacter le plus grand nombre. C&apos;est pour ça que COAI existe.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              Chaque programme généré par l&apos;IA sur COAI est relu et validé par lui, ou par un
              coach qu&apos;il a formé, avant de t&apos;arriver — l&apos;expérience du terrain,
              appliquée à chaque profil.
            </p>
          </div>
        </Card>
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
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-laiton-400">
            Aller plus loin
          </span>
          <Badge tone="warning">Places limitées</Badge>
        </div>
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
