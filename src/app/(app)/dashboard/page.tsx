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
import { getSessionDuration, getWorkoutForDate, type WorkoutSession } from "@/lib/daily/session";
import { detecterBesoins, filtrerBesoinsPertinents } from "@/lib/dashboard/besoins-identifies";
import { BesoinsIdentifiesCard } from "@/components/dashboard/besoins-identifies-card";
import { WeeklyCheckinCard } from "@/components/dashboard/weekly-checkin-card";

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
  const besoins = filtrerBesoinsPertinents(detecterBesoins(user.profile), user, user.subscription);

  return (
    <div className="coai-dashboard flex flex-col gap-7">
      <header className="coai-dashboard-hero animate-reveal flex flex-col gap-5 px-6 py-7 sm:px-8 sm:py-9">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Personal training, reimagined</span>
          <span className="coai-diagnostic-kicker-separator" aria-hidden="true" />
          <span>Aujourd&apos;hui</span>
        </div>
        <div>
          <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
            {user.prenom ? `Bonjour ${user.prenom}.` : "Bonjour."}
          </h1>
          <p className="mt-3 text-xl font-bold text-graphite-50">Ton Personal Trainer, toujours avec toi.</p>
          <p className="mt-2 max-w-2xl text-base leading-7 text-graphite-300">{objective}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="coai-dashboard-status">Profil analysé</span>
          <span className="coai-dashboard-status">Programme adaptatif</span>
          <span className="coai-dashboard-status">Suivi centralisé</span>
        </div>
        {programme && sourceSession && !daily?.sleep && (
          <a href="#check-in-du-jour" className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#20211e] px-7 py-3.5 text-base font-bold text-white shadow-[0_20px_55px_-28px_rgba(32,33,30,.8)] transition hover:-translate-y-0.5 hover:bg-[#343630] sm:w-fit">
            Faire mon check-in · 45 sec →
          </a>
        )}
      </header>

      <BesoinsIdentifiesCard besoins={besoins} />

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
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Ton Personal Trainer est prêt</p>
              <h2 className="mt-2 text-2xl text-white">Choisis maintenant ton niveau d&apos;accompagnement.</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-graphite-300">
                Découvre d&apos;abord ce que COAI a compris de ton profil. Lorsque tu seras prêt, tu
                pourras choisir une expérience autonome, hybride ou VIP, toutes conçues pour
                évoluer avec ton emploi du temps, ta forme et tes objectifs.
              </p>
            </div>
            <Link href="/pricing" className="coai-rainbow-cta inline-flex rounded-xl px-6 py-3 text-sm font-extrabold text-white">Choisir mon accompagnement →</Link>
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
        <div id="check-in-du-jour" className="scroll-mt-6">
          <DailyExperience
            sourceSession={sourceSession as WorkoutSession}
            initialDaily={daily}
            expectedMinutes={getSessionDuration(sourceSession, user.profile?.dureeSeanceMinutes ?? 45)}
            pendingCoach={pendingCoach}
            programmeVersion={programme.version}
          />
        </div>
      ) : (
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.025] p-6 sm:p-8">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#28715c]">Journée de récupération</p>
          <h2 className="mt-3 font-editorial text-3xl text-white sm:text-4xl">Aujourd’hui, ton programme prévoit du repos.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300">La récupération fait partie du programme. Reste à l’écoute de ton corps ; une marche légère ou un peu de mobilité peuvent convenir seulement si tu te sens bien.</p>
          {pendingCoach && <p className="mt-4 text-sm font-semibold text-[#76531f]">Programme V{programme.version} — à valider par ton coach.</p>}
          <Link href="/programme/recuperation" className="mt-5 inline-flex rounded-full border border-[#343730] bg-[#252724] px-5 py-2.5 text-sm font-bold text-[#fffdf8] shadow-sm transition hover:bg-[#343730]">Voir ma récupération</Link>
        </section>
      )}

      {programme && <WeeklyCheckinCard />}

      <section className="rounded-3xl border border-[#c9d7d4] bg-[linear-gradient(135deg,#f8f4eb,#edf5f4)] p-6 text-[#1c211f] shadow-[0_24px_70px_-50px_rgba(25,52,46,.5)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#28715c]">Diagnostic enrichi · Optionnel</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">COAI peut encore mieux te connaître.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#58635f]">Envoie une capture de ton bracelet connecté ou une photo en tenue de sport. L’IA enrichit ton profil pour affiner les prochaines adaptations.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#355f52]">
              <span className="rounded-full border border-[#b8d8cb] bg-white/70 px-3 py-1.5">✓ Sommeil, pas, fréquence cardiaque</span>
              <span className="rounded-full border border-[#b8d8cb] bg-white/70 px-3 py-1.5">✓ Morphologie et posture</span>
              <span className="rounded-full border border-[#b8d8cb] bg-white/70 px-3 py-1.5">✓ Photo non conservée</span>
            </div>
          </div>
          <Link href="/compte/profil#diagnostic-high-tech" className="coai-diagnostic-enrich-cta inline-flex min-h-12 shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold transition">Affiner mon diagnostic →</Link>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <CoaiInsightCard insight={insight} />
        <ActiviteQuotidienneCard />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.07] pt-5 text-sm">
        <Link
          href="/programme"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#a87831]/35 bg-white/75 px-6 py-3 text-sm font-bold text-[#4d3516] shadow-[0_14px_34px_-24px_rgba(72,48,18,.7)] transition hover:-translate-y-0.5 hover:bg-white"
        >
          Voir mon programme complet →
        </Link>
        <Link href="/suivi/progression" className="text-graphite-300 hover:text-white">Voir mon suivi →</Link>
      </div>
    </div>
  );
}
