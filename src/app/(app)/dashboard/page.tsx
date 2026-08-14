import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { DailyExperience } from "@/components/daily/daily-experience";
import { ActiviteQuotidienneCard } from "@/components/dashboard/activite-quotidienne-card";
import { CoaiInsightCard } from "@/components/dashboard/coai-insight-card";
import { GenererProgrammeOnboarding } from "@/components/compte/generer-programme-onboarding";
import { getCoaiInsight } from "@/lib/insight/coai-insight";
import { computeProfilCompletion } from "@/lib/profil/completion";
import { hasProgrammeAccess } from "@/lib/subscription/plan";
import { OneShotProgrammeButton } from "@/components/programme/one-shot-programme-button";
import { getSessionDuration, getWorkoutForDate, type WorkoutSession } from "@/lib/daily/session";

function today() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const date = today();
  const completion = computeProfilCompletion(user.profile);
  const [validated, latest, daily, insight] = await Promise.all([
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "ENTRAINEMENT", statut: "VALIDE" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "ENTRAINEMENT" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.dailySession.findUnique({ where: { userId_date: { userId: user.id, date } } }),
    getCoaiInsight(user.id),
  ]);

  const programme = validated ?? latest;
  const sourceSession = programme ? getWorkoutForDate(programme.contenu, date) : null;
  const pendingCoach = Boolean(!validated && latest?.statut === "EN_ATTENTE");
  const objective = sourceSession?.nom ? `Aujourd’hui, on travaille ${String(sourceSession.nom).toLowerCase()}.` : "Une journée utile, adaptée à ton rythme.";

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-2 border-b border-acier/25 pb-6">
        <SectionLabel>Aujourd&apos;hui</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
          {user.prenom ? `Bonjour ${user.prenom}.` : "Bonjour."}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-300">{objective}</p>
      </header>

      {!completion.essentielComplet ? (
        <section className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Profil incomplet</p>
          <h2 className="mt-2 text-2xl text-white">COAI a besoin de quelques repères essentiels.</h2>
          <p className="mt-2 text-sm leading-6 text-graphite-300">Il manque : {completion.champsEssentielsManquants.join(", ")}. Ces informations permettent de préparer une séance cohérente et prudente.</p>
          <Link href="/compte/profil?onboarding=1" className="mt-5 inline-flex rounded-full bg-laiton-400 px-6 py-3 text-sm font-semibold text-graphite-950">Compléter mon profil</Link>
        </section>
      ) : !programme ? (
        !hasProgrammeAccess(user, user.subscription) ? (
          <section className="flex flex-col items-start gap-4 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] p-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Programme pas encore débloqué</p>
              <h2 className="mt-2 text-2xl text-white">Ton profil est prêt — génère ton programme quand tu veux.</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-graphite-300">
                19€ en un seul paiement pour générer ton programme complet (entraînement, nutrition,
                récupération). Ou passe à Transformation (49€/mois) pour un suivi continu avec un
                coach diplômé d&apos;État.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <OneShotProgrammeButton />
              <Link href="/pricing" className="text-sm text-graphite-300 underline hover:text-white">Voir toutes les formules</Link>
            </div>
          </section>
        ) : (
          <section className="flex flex-col gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Programme à préparer</p>
              <h2 className="mt-2 text-2xl text-white">Ta première semaine peut être générée maintenant.</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-graphite-300">Pendant la génération, COAI affiche un état explicite puis revient vers ton programme — aucun chargement ne tourne indéfiniment.</p>
            </div>
            <GenererProgrammeOnboarding />
          </section>
        )
      ) : sourceSession ? (
        <DailyExperience
          sourceSession={sourceSession as WorkoutSession}
          initialDaily={daily}
          expectedMinutes={getSessionDuration(sourceSession, user.profile?.dureeSeanceMinutes ?? 45)}
          pendingCoach={pendingCoach}
          programmeVersion={programme.version}
        />
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.025] p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300">Journée de récupération</p>
          <h2 className="mt-3 font-editorial text-3xl text-white sm:text-4xl">Aujourd’hui, ton programme prévoit du repos.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300">La récupération fait partie du programme. Reste à l’écoute de ton corps ; une marche légère ou un peu de mobilité peuvent convenir seulement si tu te sens bien.</p>
          {pendingCoach && <p className="mt-4 text-sm text-amber-200">Programme V{programme.version} — à valider par ton coach.</p>}
          <Link href="/programme/recuperation" className="mt-5 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm text-white">Voir ma récupération</Link>
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <CoaiInsightCard insight={insight} />
        <ActiviteQuotidienneCard />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.07] pt-5 text-sm">
        <Link href="/programme" className="text-laiton-300 hover:underline">Voir le programme source →</Link>
        <Link href="/suivi/progression" className="text-graphite-300 hover:text-white">Voir mon suivi →</Link>
      </div>
    </div>
  );
}
