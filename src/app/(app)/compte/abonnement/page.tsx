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
              Anthony a 40 ans à peine, et un corps qui n&apos;a pas l&apos;air d&apos;être au
              courant — âge métabolique 24 ans. Ce n&apos;est pas un chiffre pour épater :
              c&apos;est ce qui arrive quand on refuse, depuis l&apos;enfance, de rester
              immobile. Musculation, callisthénie — le handstand est devenu sa signature —,
              quinze ans de karaté qui lui ont appris la rigueur jusqu&apos;à l&apos;envoyer
              s&apos;entraîner au Japon, un détour par l&apos;Inde pour apprendre à respirer, un
              autre par la Thaïlande pour apprendre à encaisser. Chez lui, le mouvement
              n&apos;est pas une discipline qu&apos;on coche. C&apos;est une façon d&apos;être
              vivant.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              De cette exigence-là est né un métier. Dix-sept ans à corriger un mouvement, à
              entendre ce qu&apos;un chiffre sur la balance ne dira jamais. Formé dans les clubs
              premium parisiens, il a trouvé sa place au Club Montgolfière Paris et au Club RITM
              Saint-Germain, sans jamais cesser d&apos;aller vers ceux qui en avaient besoin — en
              entreprise, à domicile, à distance depuis le Covid. Des centaines
              d&apos;entrepreneurs sont passés entre ses mains, des VIP, des politiques, des
              acteurs, une Miss France.
            </p>
            <p className="text-sm leading-6 text-graphite-300">
              Ce qu&apos;il veut, aujourd&apos;hui, c&apos;est simple : que le plus grand nombre
              connaisse ce qu&apos;il vit lui-même chaque jour — un corps qui ne fait pas mal,
              qui tient dans le temps, qui reste jeune. C&apos;est pour ça que COAI existe.
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
          centre, en club ou à domicile (200€/1h), ou en visio (100€/1h). Réservation à la
          séance, sans abonnement.
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
