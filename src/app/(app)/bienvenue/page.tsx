import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { SectionLabel } from "@/components/ui/section-label";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { ActivationFlow } from "@/components/onboarding/activation-flow";
import { hasSuiviAccess } from "@/lib/subscription/plan";
import { ParrainageCard } from "@/components/compte/parrainage-card";

// Écran d'accueil post-paiement (10/08/2026) : repensé façon "salon
// d'embarquement" plutôt qu'un simple accusé de réception transactionnel.
//
// Nouveau modèle d'accès libre (13/08/2026) : cette page sert désormais deux
// moments différents. (1) Juste après une inscription gratuite — aucun
// paiement n'a eu lieu, la carte d'embarquement façon "confirmation d'achat"
// n'a plus lieu d'être, remplacée par un accueil neutre qui explique que
// tout est visible librement. (2) Juste après un vrai achat (Impulsion
// one-shot ou abonnement Transformation, cf. success_url des deux routes
// Stripe) — la carte d'embarquement reste affichée, avec les événements de
// conversion. On distingue les deux à partir des paramètres d'URL posés par
// les routes de paiement elles-mêmes (jamais par une simple intention côté
// client) : ?plan=... (Transformation) ou ?unlock=programme (Impulsion).
const CONTENU_PAR_PLAN: Record<
  "GRATUIT" | "STANDARD",
  {
    formule: string;
    sousTitre: string;
    etapes: { titre: string; texte: string }[];
  }
> = {
  GRATUIT: {
    formule: "Impulsion",
    sousTitre: "Paiement unique de 19€. Ton programme est prêt dès maintenant.",
    etapes: [
      { titre: "Ton profil", texte: "Objectifs, niveau, contraintes — la base de tout le reste." },
      { titre: "Ton programme, généré par l'IA", texte: "Entraînement, nutrition, récupération, en quelques secondes." },
      { titre: "Tu t'entraînes", texte: "Ton programme est prêt dès aujourd'hui." },
      { titre: "On veille sur toi", texte: "Une relance automatique si on ne te voit plus — jamais vraiment seul." },
    ],
  },
  STANDARD: {
    formule: "Transformation",
    sousTitre: "Ton coach diplômé d'État prend le relais avec l'IA, jusqu'à l'atteinte de ton objectif.",
    etapes: [
      { titre: "Ton profil", texte: "Objectifs, niveau, contraintes — la base de tout le reste." },
      { titre: "Ton programme, généré par l'IA", texte: "Entraînement, nutrition, récupération, en quelques secondes." },
      { titre: "Validé par ton coach", texte: "Un coach diplômé d'État relit et ajuste avant que ce soit définitif." },
      { titre: "Suivi jusqu'à ton objectif", texte: "Ton coach revient vers toi si besoin — jusqu'à ce que tu y sois." },
    ],
  },
};

export default async function BienvenuePage({
  searchParams,
}: {
  searchParams: { plan?: string; essai?: string; unlock?: string };
}) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const coachValidationRequise = hasSuiviAccess(user.subscription);

  // Un vrai paiement vient de se terminer seulement si l'un de ces
  // paramètres, posés uniquement par les routes Stripe elles-mêmes
  // (success_url), est présent — jamais déduit d'une simple intention.
  const achatConfirme = Boolean(searchParams.plan) || searchParams.unlock === "programme";

  const prenom = user.prenom ?? "";

  if (!achatConfirme) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-8 py-10 text-center sm:py-16">
        <div className="flex flex-col items-center gap-3">
          <SectionLabel>Compte créé</SectionLabel>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
            Bienvenue{prenom ? `, ${prenom}` : ""}.
          </h1>
          <p className="max-w-md text-sm leading-6 text-graphite-400">
            Ton compte est gratuit — explore l&apos;interface, découvre les fonctionnalités. Tu
            choisis ce que tu débloques, quand tu veux.
          </p>
        </div>

        <ActivationFlow
          coachValidationRequise={coachValidationRequise}
          profilInitial={user.profile ?? null}
        />

        {/* Partage du lien de parrainage remonté ici (14/08/2026, test
            acquisition) : jusque-là visible uniquement sur compte/abonnement,
            donc jamais vu par quelqu'un qui explore encore gratuitement.
            Réutilise ParrainageCard tel quel (même carte, même API) —
            l'enthousiasme de l'inscription est le moment le plus favorable
            pour proposer de partager, avant même un premier paiement. */}
        <div className="w-full max-w-md text-left">
          <ParrainageCard />
        </div>

        <Link href="/dashboard" className="text-sm text-graphite-500 underline hover:text-laiton-400">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const plan: "GRATUIT" | "STANDARD" = searchParams.plan === "STANDARD" ? "STANDARD" : "GRATUIT";
  const { formule, sousTitre, etapes } = CONTENU_PAR_PLAN[plan];
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  // Impulsion en paiement unique (unlock=programme) tombait dans le même
  // calcul que les abonnements (plan="GRATUIT" par défaut → "Subscribe")
  // alors que ce n'est pas un abonnement — corrigé en "Purchase", l'événement
  // Meta standard pour une transaction unique (14/08/2026, audit tracking).
  const unlockOneShot = searchParams.unlock === "programme";

  // Événement Meta : Purchase pour Impulsion en paiement unique (pas un
  // abonnement), StartTrial si les 7 jours offerts de Transformation sont
  // en cours (carte enregistrée, pas encore prélevée), Subscribe sinon
  // (Transformation souscrite directement, essai déjà sauté). Valeur = prix
  // réel de l'offre choisie, pour que l'algorithme Meta puisse optimiser
  // vers les conversions les plus rentables, pas juste les plus nombreuses.
  const enEssai = plan === "STANDARD" && searchParams.essai !== "0";
  const valeurMensuelle = plan === "STANDARD" ? 49 : 19;
  const metaEventAchat = unlockOneShot ? "Purchase" : enEssai ? "StartTrial" : "Subscribe";

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-10 py-10 text-center sm:py-16">
      <TrackConversion
        name="subscription_started"
        params={{ plan }}
        metaEvent={metaEventAchat}
        metaParams={{ value: valeurMensuelle, currency: "EUR" }}
      />
      <TrackConversion name="checkout_completed" params={{ plan }} />

      <div className="flex flex-col items-center gap-3">
        <SectionLabel>Accès confirmé</SectionLabel>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
          Bienvenue{prenom ? `, ${prenom}` : ""}.
        </h1>
        <p className="max-w-md text-sm leading-6 text-graphite-400">
          À partir d&apos;ici, on s&apos;occupe de tout — jusqu&apos;à l&apos;atteinte de ton
          objectif.
        </p>
      </div>

      {/* Carte d'embarquement COAI — écho volontaire au "salon privé avant
          d'embarquer" évoqué par Anthony comme référence d'expérience. */}
      <div className="w-full overflow-hidden rounded-[1.75rem] border border-laiton-400/25 bg-[#0f1113] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] sm:flex">
        <div className="flex flex-1 flex-col gap-6 p-7 text-left sm:p-9">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-semibold tracking-tight text-white">
              COAI
            </span>
            <span className="rounded-full border border-laiton-400/30 bg-laiton-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">
              Confirmé
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Passager</p>
              <p className="mt-1 text-sm font-medium text-white">{prenom || user.email}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Formule</p>
              <p className="mt-1 text-sm font-medium text-white">{formule}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Date</p>
              <p className="mt-1 text-sm font-medium text-white">{date}</p>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Accompagnement</p>
              <p className="mt-1 text-sm font-medium text-white">Jusqu&apos;à ton objectif</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-graphite-300">{sousTitre}</p>
        </div>

        {/* Talon perforé, comme une vraie carte d'embarquement. */}
        <div className="relative flex flex-row items-center gap-0 border-t border-dashed border-white/15 bg-white/[0.02] px-7 py-6 sm:w-56 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:px-6 sm:py-9">
          <span className="pointer-events-none absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full bg-lab-notch sm:block" aria-hidden="true" />
          <span className="pointer-events-none absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-lab-notch sm:block" aria-hidden="true" />
          <div className="flex flex-1 flex-col items-center gap-1 sm:gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">
              Prochaine étape
            </span>
            <span className="font-display text-base font-semibold text-laiton-300">Embarquement</span>
            <span className="text-xs text-graphite-500">Ton profil</span>
          </div>
        </div>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
        {etapes.map((etape, i) => (
          <div
            key={etape.titre}
            className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full border border-laiton-400/30 bg-laiton-400/10 text-xs font-semibold text-laiton-300">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{etape.titre}</p>
              <p className="mt-0.5 text-xs leading-5 text-graphite-400">{etape.texte}</p>
            </div>
          </div>
        ))}
      </div>

      <ActivationFlow
        coachValidationRequise={coachValidationRequise}
        profilInitial={user.profile ?? null}
      />

      <Link href="/dashboard" className="text-sm text-graphite-500 underline hover:text-laiton-400">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
