import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { SectionLabel } from "@/components/ui/section-label";
import { Button } from "@/components/ui/button";
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
// tout est visible librement. (2) Juste après un vrai achat (Pass IA
// one-shot ou abonnement Coaching Hybride, cf. success_url des deux routes
// Stripe) — la carte d'embarquement reste affichée, avec les événements de
// conversion. On distingue les deux à partir des paramètres d'URL posés par
// les routes de paiement elles-mêmes (jamais par une simple intention côté
// client) : ?plan=... (Coaching Hybride) ou ?unlock=programme (Pass IA).
const CONTENU_PAR_PLAN: Record<
  "PASS_IA" | "STANDARD" | "PREMIUM",
  {
    formule: string;
    sousTitre: string;
    etapes: { titre: string; texte: string }[];
  }
> = {
  PASS_IA: {
    formule: "Standard IA",
    sousTitre: "Ton coach personnel augmenté reste disponible 24h/24 et fait évoluer ton programme.",
    etapes: [
      { titre: "Ton profil", texte: "Objectifs, niveau, contraintes — la base de tout le reste." },
      { titre: "Ton bilan du jour", texte: "Temps disponible, sommeil, forme et douleurs du jour." },
      { titre: "Ta séance s'adapte", texte: "Entraînement, nutrition et récupération évoluent avec ta vraie vie." },
      { titre: "Ton PT IA", texte: "Une réponse immédiate, même le soir et le week-end." },
    ],
  },
  STANDARD: {
    formule: "Premium Remote",
    sousTitre: "L'IA apporte la disponibilité ; le coach humain apporte le regard et la subtilité.",
    etapes: [
      { titre: "Ton profil", texte: "Objectifs, niveau, contraintes — la base de tout le reste." },
      { titre: "Ton bilan du jour", texte: "Temps disponible, sommeil, forme et douleurs du jour." },
      { titre: "Validé par ton coach", texte: "Un regard humain relit, nuance et ajuste les décisions importantes." },
      { titre: "Suivi jusqu'à ton objectif", texte: "Ton coach revient vers toi si besoin — jusqu'à ce que tu y sois." },
    ],
  },
  PREMIUM: {
    formule: "VIP Présentiel",
    sousTitre: "L'attention maximale : ton système COAI et tes séances privées avec Anthony.",
    etapes: [
      { titre: "Bilan premium", texte: "Objectif, antécédents, mobilité, posture et contraintes analysés en profondeur." },
      { titre: "Programme ultra-précis", texte: "Chaque détail est construit autour de ton corps, de ton rythme et de ta vie." },
      { titre: "Séance privée mensuelle", texte: "De 1 à 4 séances par mois, en visio ou à Paris centre." },
      { titre: "Ajustements prioritaires", texte: "Un accompagnement volontairement limité pour préserver sa qualité." },
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
      <div className="coai-welcome mx-auto flex max-w-2xl flex-col items-center gap-8 py-10 text-center sm:py-16">
        <div className="animate-reveal flex flex-col items-center gap-3">
          <SectionLabel>Compte créé</SectionLabel>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
            Bienvenue{prenom ? `, ${prenom}` : ""}.
          </h1>
          <p className="max-w-md text-sm leading-6 text-graphite-400">
            Ton espace personnel est prêt. On te guide, étape par étape.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="coai-rainbow-cta animate-reveal inline-flex min-h-14 w-full max-w-md items-center justify-center rounded-full px-8 py-4 text-base font-extrabold text-[#111216] shadow-[0_20px_55px_-20px_rgba(102,126,255,.75)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_65px_-18px_rgba(228,92,150,.65)]"
          style={{ animationDelay: "100ms" }}
        >
          Entrer dans mon espace&nbsp; →
        </Link>

        {/* Carte d'embarquement, version accès libre (16/08/2026, demande
            Anthony — un "effet whaou", pris en main dès l'arrivée, comme dans
            un palace, plutôt qu'un texte plat suivi d'une tentative de
            génération/paiement immédiate). Même esthétique que la version
            post-achat plus bas sur cette page, contenu adapté : pas de
            formule à afficher puisque rien n'est encore débloqué. Révélée en
            fondu/glissement après le titre, comme si on nous la tendait. */}
        <div
          className="coai-boarding-card animate-reveal w-full overflow-hidden rounded-[1.75rem] border border-laiton-400/25 bg-[#0f1113] text-left shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] sm:flex"
          style={{ animationDelay: "150ms" }}
        >
          <div className="flex flex-1 flex-col gap-6 p-7 sm:p-9">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-semibold tracking-tight text-white">COAI</span>
              <span className="flex items-center gap-1.5 rounded-full border border-laiton-400/30 bg-laiton-400/10 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-300">
                <span className="animate-status-pulse h-1.5 w-1.5 rounded-full bg-laiton-300" aria-hidden="true" />
                Compte créé
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Passager</p>
                <p className="mt-1 text-sm font-medium text-white">{prenom || user.email}</p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Accès</p>
                <p className="mt-1 text-sm font-medium text-white">Libre — tu choisis</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-graphite-300">
              Concierge personnel pendant ta visite : découvre ton espace avant de choisir quoi que
              ce soit.
            </p>
          </div>
          <div className="coai-boarding-next relative flex flex-row items-center gap-0 border-t border-dashed border-white/15 px-7 py-6 sm:w-56 sm:flex-col sm:justify-center sm:border-l sm:border-t-0 sm:px-6 sm:py-9">
            <span className="pointer-events-none absolute -left-2.5 -top-2.5 hidden h-5 w-5 rounded-full bg-lab-notch sm:block" aria-hidden="true" />
            <span className="pointer-events-none absolute -bottom-2.5 -left-2.5 hidden h-5 w-5 rounded-full bg-lab-notch sm:block" aria-hidden="true" />
            <div className="flex flex-1 flex-col items-center gap-1 sm:gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">
                Prochaine étape
              </span>
              <span className="font-display text-base font-semibold text-laiton-300">Ton espace</span>
              <span className="text-xs text-graphite-500">Visite guidée</span>
            </div>
          </div>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
          {[
            { titre: "Ton profil", texte: "Objectifs, niveau, contraintes — la base de ton futur programme." },
            { titre: "Ton programme", texte: "Standard IA, Premium Remote ou VIP Présentiel : le niveau d'attention qui te correspond." },
            { titre: "Ton Coach IA", texte: "Pose tes questions, 24h/24, dans l'esprit de la méthode d'Anthony." },
            { titre: "Ton suivi", texte: "Séances, mesures, progression — tout au même endroit." },
          ].map((etape, i) => (
            <div
              key={etape.titre}
              className="animate-reveal flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4"
              style={{ animationDelay: `${300 + i * 120}ms` }}
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

        {/* Le diagnostic reste appliqué au profil en silence si des réponses
            attendent en localStorage — mais plus aucune tentative de
            génération/paiement ne s'affiche automatiquement ici (cf. prop
            declencherGenerationAuto). */}
        <ActivationFlow
          coachValidationRequise={coachValidationRequise}
          profilInitial={user.profile ?? null}
          declencherGenerationAuto={false}
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
      </div>
    );
  }

  const plan: "PASS_IA" | "STANDARD" | "PREMIUM" =
    searchParams.plan === "PREMIUM" ? "PREMIUM" : searchParams.plan === "STANDARD" ? "STANDARD" : "PASS_IA";
  const { formule, sousTitre, etapes } = CONTENU_PAR_PLAN[plan];
  const date = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  // Pass IA en paiement unique (unlock=programme) tombait dans le même
  // calcul que les abonnements (plan="PASS_IA" par défaut → "Subscribe")
  // alors que ce n'est pas un abonnement — corrigé en "Purchase", l'événement
  // Meta standard pour une transaction unique (14/08/2026, audit tracking).
  const enEssai = plan !== "PREMIUM" && searchParams.essai !== "0";
    // Valeurs de pack pour STANDARD/PREMIUM (04/09/2026, repositionnement 3 offres) — ce
  // chemin (plan=STANDARD/PREMIUM) est en pratique mort depuis que checkout/route.ts
  // refuse ces deux plans en amont (sur devis WhatsApp uniquement), mais corrigé quand
  // même par précaution pour ne jamais faire remonter un faux montant a Meta si un
  // enregistrement historique passait encore par ici.
  const valeurMensuelle = plan === "PREMIUM" ? 1200 : plan === "STANDARD" ? 960 : 19.99;
  const metaEventAchat = enEssai ? "StartTrial" : "Subscribe";

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
        <SectionLabel>{enEssai ? "Essai activé" : "Accès confirmé"}</SectionLabel>
        <h1 className="font-display text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
          {enEssai ? "Tes 7 jours d'essai commencent." : `Bienvenue${prenom ? `, ${prenom}` : ""}.`}
        </h1>
        <p className="max-w-md text-sm leading-6 text-graphite-400">
          COAI prépare ton programme. Ta première séance sera accessible juste ici, sans chercher dans les menus.
        </p>
      </div>

      <ActivationFlow
        coachValidationRequise={coachValidationRequise}
        profilInitial={user.profile ?? null}
      />

      {/* Carte d'embarquement COAI — écho volontaire au "salon privé avant
          d'embarquer" évoqué par Anthony comme référence d'expérience. */}
      <div className="coai-boarding-card w-full overflow-hidden rounded-[1.75rem] border border-laiton-400/25 bg-[#0f1113] shadow-[0_40px_100px_-40px_rgba(0,0,0,0.85)] sm:flex">
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
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-graphite-500">Accompagnement</p>
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

      <Link href="/dashboard" className="text-sm text-graphite-500 underline hover:text-laiton-400">
        Retour au tableau de bord
      </Link>
    </div>
  );
}
