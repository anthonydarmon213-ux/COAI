import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { stripe } from "@/lib/stripe/client";
import { ActivationFlow } from "@/components/onboarding/activation-flow";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { ParrainageCard } from "@/components/compte/parrainage-card";
import { buildMiniDiagnostic, type ReponsesDiagnostic } from "@/lib/diagnostic/mini-diagnostic";
import { hasSuiviAccess } from "@/lib/subscription/plan";

type CheckoutConfirmation = {
  plan: "GRATUIT" | "STANDARD";
  formule: "Impulsion" | "Transformation";
  enEssai: boolean;
  montant: number;
};

function split(value?: string | null): string[] {
  return value?.split(", ").map((item) => item.trim()).filter(Boolean) ?? [];
}

function diagnosticFromProfile(profile: NonNullable<Awaited<ReturnType<typeof getCurrentAppUser>>>["profile"]): ReponsesDiagnostic | null {
  if (!profile) return null;
  return {
    persona: split(profile.persona),
    niveau: profile.niveau,
    objectif: profile.objectifs,
    equipement: split(profile.equipementDisponible),
    lieu: profile.lieuEntrainement,
    duree: profile.dureeSeanceMinutes ? `${profile.dureeSeanceMinutes} minutes` : null,
    frequence: profile.frequenceEntrainement,
    habitudesAlimentaires: profile.habitudesAlimentaires,
    qualiteSommeil: profile.qualiteSommeil,
    sante: split(profile.contraintesSante),
  };
}

async function confirmCheckout(sessionId: string | undefined, userId: string): Promise<CheckoutConfirmation | null> {
  if (!sessionId?.startsWith("cs_")) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== userId || session.status !== "complete") return null;

    const plan = session.metadata?.plan === "STANDARD" ? "STANDARD" : "GRATUIT";
    return {
      plan,
      formule: plan === "STANDARD" ? "Transformation" : "Impulsion",
      enEssai: session.mode === "subscription" && session.payment_status === "no_payment_required",
      montant: (session.amount_total ?? (plan === "STANDARD" ? 4900 : 1900)) / 100,
    };
  } catch {
    return null;
  }
}

export default async function BienvenuePage({
  searchParams,
}: {
  searchParams: { session_id?: string };
}) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const confirmation = await confirmCheckout(searchParams.session_id, user.id);
  const reponses = diagnosticFromProfile(user.profile);
  const diagnostic = reponses ? buildMiniDiagnostic(reponses) : null;
  const score = diagnostic?.indiceCoai.score ?? null;
  const objectifScore = score === null ? null : Math.min(100, score + 8);
  const objectif = user.profile?.objectifs ?? "Construire une progression durable";
  const coachValidationRequise = confirmation?.plan === "STANDARD" || hasSuiviAccess(user.subscription);
  const prenom = user.prenom ?? "";

  if (!confirmation) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 py-8 text-center sm:py-14">
        <div className="w-full rounded-[2rem] border border-[#d8c49e]/70 bg-[#fbfaf6] px-6 py-10 text-[#171714] shadow-[0_32px_90px_-50px_rgba(25,25,20,0.55)] sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a47b37]">Ton espace COAI</p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
            Bienvenue{prenom ? `, ${prenom}` : ""}.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#615e57]">
            Ton profil est enregistré. Retrouve ton diagnostic, ton score COAI et choisis la formule qui correspond à l&apos;accompagnement dont tu as besoin.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/dashboard" className="rounded-full bg-[#d4aa5f] px-7 py-3 text-sm font-semibold text-[#171714] transition hover:bg-[#dfb86e]">
              Aller à mon tableau de bord
            </Link>
            <Link href="/diagnostic?restart=1" className="rounded-full border border-[#cfc7b8] px-7 py-3 text-sm font-semibold text-[#3d3a34] transition hover:bg-white">
              Refaire mon diagnostic
            </Link>
          </div>
        </div>
        <ActivationFlow coachValidationRequise={coachValidationRequise} profilInitial={user.profile ?? null} />
      </div>
    );
  }

  const metaEvent = confirmation.plan === "GRATUIT" ? "Purchase" : confirmation.enEssai ? "StartTrial" : "Subscribe";

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-7 py-6 sm:py-12">
      <TrackConversion
        name="subscription_started"
        params={{ plan: confirmation.plan }}
        metaEvent={metaEvent}
        metaParams={{ value: confirmation.montant, currency: "EUR" }}
      />
      <TrackConversion name="checkout_completed" params={{ plan: confirmation.plan }} />

      <section className="overflow-hidden rounded-[2rem] border border-[#d7c49f]/70 bg-[linear-gradient(135deg,#fffdf8_0%,#f4f0e8_55%,#e8f1f3_100%)] text-[#171714] shadow-[0_38px_100px_-55px_rgba(10,25,35,0.65)]">
        <div className="grid gap-8 px-6 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1.25fr_0.75fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-[#c99d50]/45 bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9b712f]">Paiement confirmé</span>
              <span className="rounded-full border border-[#cfd8d9] bg-white/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#55717a]">{confirmation.formule}</span>
            </div>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.03] tracking-[-0.04em] sm:text-6xl">
              Bienvenue{prenom ? `, ${prenom}` : ""}.<br />Ton évolution commence ici.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#5e5a52] sm:text-lg">
              COAI va maintenant transformer ton diagnostic en un plan concret pour atteindre ton objectif : <strong className="font-semibold text-[#27231d]">{objectif}</strong>.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-white/90 bg-white/70 p-6 text-center shadow-[0_24px_55px_-40px_rgba(26,38,42,0.65)] backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a8378]">Ton score COAI</p>
            {score !== null ? (
              <>
                <div className="relative mx-auto mt-4 flex h-36 w-36 items-center justify-center rounded-full bg-[conic-gradient(#d3a95d_var(--score),#e6e1d8_0)] p-[9px]" style={{ "--score": `${score}%` } as React.CSSProperties}>
                  <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-[#fffdf9]">
                    <span className="font-display text-5xl font-semibold leading-none">{score}</span>
                    <span className="mt-1 text-xs text-[#777168]">sur 100</span>
                  </div>
                </div>
                <p className="mt-4 text-sm font-semibold text-[#4e4941]">Premier cap : {objectifScore}/100</p>
                <p className="mt-1 text-xs leading-5 text-[#777168]">Ton score évoluera avec tes séances, tes check-ins et ta régularité.</p>
              </>
            ) : (
              <p className="mt-4 text-sm leading-6 text-[#6d685f]">Complète ton profil pour révéler ton score et suivre son évolution.</p>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {(diagnostic?.indiceCoai.actions ?? [
          { titre: "Finaliser ton profil", impact: "Pour personnaliser chaque détail du programme." },
          { titre: "Lancer ton programme", impact: "Pour passer immédiatement du diagnostic à l’action." },
          { titre: "Faire ton premier check-in", impact: "Pour que COAI commence à apprendre de toi." },
        ]).slice(0, 3).map((action, index) => (
          <article key={action.titre} className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4aa5f] text-sm font-bold text-[#171714]">{index + 1}</span>
            <h2 className="mt-4 text-base font-semibold text-white">{action.titre}</h2>
            <p className="mt-2 text-sm leading-6 text-graphite-400">{action.impact}</p>
          </article>
        ))}
      </section>

      <div className="rounded-[1.75rem] border border-laiton-400/20 bg-white/[0.035] p-5 sm:p-7">
        <p className="text-center text-sm leading-6 text-graphite-300">
          L&apos;IA personnalise et adapte. Un coach humain diplômé valide, suit ta progression et reste disponible quand tu en as besoin.
        </p>
        <div className="mt-5">
          <ActivationFlow coachValidationRequise={coachValidationRequise} profilInitial={user.profile ?? null} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <ParrainageCard />
        <div className="flex flex-col gap-3 text-center lg:min-w-56">
          <Link href="/dashboard" className="rounded-full bg-[#d4aa5f] px-7 py-3 text-sm font-semibold text-[#171714]">Voir mon espace COAI</Link>
          <Link href="/programme/evolution" className="text-sm text-graphite-400 underline hover:text-white">Suivre l&apos;évolution de mon score</Link>
        </div>
      </div>
    </div>
  );
}
