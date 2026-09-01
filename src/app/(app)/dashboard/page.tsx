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
import { DashboardAvatar } from "@/components/dashboard/dashboard-avatar";
import { ImpulsionChallenge } from "@/components/dashboard/impulsion-challenge";
import { DashboardIntroVideo } from "@/components/dashboard/dashboard-intro-video";

const MANTRAS = [
  "La régularité transforme ce que la motivation commence.",
  "Aujourd’hui, cherche le mouvement juste — pas le mouvement parfait.",
  "Une séance adaptée vaut mieux qu’une séance abandonnée.",
  "La récupération n’interrompt pas la progression. Elle la construit.",
  "Ton prochain niveau se construit dans les détails d’aujourd’hui.",
  "Avance avec intention. Le résultat suivra la répétition.",
  "Écoute ton corps, respecte le plan, célèbre le progrès.",
];

const JOURS_COURTS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay() || 7;
  result.setDate(result.getDate() - day + 1);
  return result;
}

function getWeek(date: Date, contenu: unknown) {
  const monday = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return {
      date: current,
      workout: getWorkoutForDate(contenu, current),
      today: current.toDateString() === date.toDateString(),
    };
  });
}

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
  const week = getWeek(date, programme?.contenu);
  const weeklyWorkoutCount = week.filter((day) => day.workout).length;
  const pendingCoach = Boolean(!validated && latest?.statut === "EN_ATTENTE");
  const objective = sourceSession?.nom ? `Aujourd’hui, on travaille ${String(sourceSession.nom).toLowerCase()}.` : "Une journée utile, adaptée à ton rythme.";
  const besoins = filtrerBesoinsPertinents(detecterBesoins(user.profile), user, user.subscription);

  return (
    <div className="coai-dashboard flex flex-col gap-7">
      <DashboardIntroVideo />
      <header className="coai-dashboard-hero animate-reveal flex flex-col gap-5 px-6 py-7 sm:px-8 sm:py-9">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Personal training, reimagined</span>
          <span className="coai-diagnostic-kicker-separator" aria-hidden="true" />
          <span>Aujourd&apos;hui</span>
        </div>
        <div className="flex items-center gap-5 sm:gap-7">
          <DashboardAvatar score={completion.pourcentage} />
          <div>
            <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
              {user.prenom ? `Bonjour ${user.prenom}.` : "Bonjour."}
            </h1>
            <p className="mt-3 text-xl font-bold text-graphite-50">Ton Personal Trainer, toujours avec toi.</p>
            <p className="mt-2 max-w-2xl text-base leading-7 text-graphite-300">{objective}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <span className="coai-dashboard-status">Profil analysé</span>
          <span className="coai-dashboard-status">Programme adaptatif</span>
          <span className="coai-dashboard-status">Suivi centralisé</span>
        </div>
        {programme && sourceSession && !daily?.sleep && (
          <a href="#check-in-du-jour" className="coai-dashboard-primary inline-flex min-h-14 w-full items-center justify-center rounded-full px-7 py-3.5 text-base font-bold shadow-[0_20px_55px_-28px_rgba(32,33,30,.8)] transition hover:-translate-y-0.5 sm:w-fit">
            Faire mon check-in · 45 sec →
          </a>
        )}
      </header>

      <section className="coai-intelligence-panel relative overflow-hidden rounded-[1.75rem] border border-[#4cc9f0]/35 px-6 py-6 text-white shadow-[0_28px_80px_-44px_rgba(76,201,240,.65)] sm:px-8" aria-labelledby="coai-intelligence-title">
        <div className="relative grid gap-6 lg:grid-cols-[1.25fr_.75fr] lg:items-center">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#4cc9f0]">Intelligence COAI · Pas une IA généraliste</p>
            <h2 id="coai-intelligence-title" className="mt-2 font-display text-2xl sm:text-3xl">L&apos;expérience terrain devient ton avantage.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#b8c0c4]">
              Le moteur COAI structure plus de 17 ans de coaching réel : progression, dosage de l&apos;effort, récupération et prudence face aux douleurs. Il croise ces règles avec ton profil, tes séances et tes retours pour décider quoi ajuster — pas simplement pour produire une réponse plausible.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold">
              <span className="rounded-full border border-[#ff8a3d]/25 bg-[#ff8a3d]/10 px-3 py-1.5 text-[#ffb17d]">17 ans de terrain</span>
              <span className="rounded-full border border-[#39e67b]/25 bg-[#39e67b]/10 px-3 py-1.5 text-[#76eea3]">Tes données réelles</span>
              <span className="rounded-full border border-[#c56cff]/25 bg-[#c56cff]/10 px-3 py-1.5 text-[#dca2ff]">Décisions explicables</span>
            </div>
          </div>
          <blockquote className="rounded-2xl border border-white/10 bg-white/[0.045] px-5 py-5 text-center font-editorial text-xl leading-8 text-[#fffdf8] sm:text-2xl">
            “{MANTRAS[date.getDay()]}”
            <footer className="mt-3 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f9aa0]">Ton impulsion du jour</footer>
          </blockquote>
        </div>
      </section>

      {!user.subscription && <ImpulsionChallenge createdAt={user.createdAt.toISOString()} userId={user.id} />}

      <section className="coai-week-overview" aria-labelledby="week-title">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="coai-eyebrow">Ma semaine</p>
            <h2 id="week-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {programme ? `${weeklyWorkoutCount} entraînement${weeklyWorkoutCount > 1 ? "s" : ""} planifié${weeklyWorkoutCount > 1 ? "s" : ""}` : "Ta semaine va prendre forme ici"}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#60645e]">
            {programme
              ? "Un rythme lisible, avec la récupération intégrée au plan. COAI l’ajuste si ton quotidien change."
              : "Après ton bilan, COAI construit un rythme réaliste selon ton niveau, tes disponibilités et ta récupération."}
          </p>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2" aria-label="Planning de la semaine">
          {week.map(({ date: day, workout, today: isToday }) => (
            <div key={day.toISOString()} className={`coai-week-day ${isToday ? "is-today" : ""} ${workout ? "has-workout" : ""}`}>
              <span>{JOURS_COURTS[day.getDay()]}</span>
              <strong>{day.getDate()}</strong>
              <i aria-hidden="true" />
              <small>{workout ? "Séance" : "Récup."}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="coai-today-briefing" aria-labelledby="today-title">
        <div className="coai-today-heading">
          <div>
            <p className="coai-eyebrow">Aujourd’hui</p>
            <h2 id="today-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Ton briefing en trois décisions.</h2>
          </div>
          <span className="rounded-full border border-[#c56cff]/20 bg-[#c56cff]/[0.07] px-4 py-2 text-xs font-bold text-[#8d4cba]">3 décisions utiles aujourd&apos;hui</span>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <Link href={sourceSession ? "#check-in-du-jour" : "/programme/entrainement"} className="coai-brief-card coai-brief-training">
            <span>01 · Bouger</span>
            <strong>{sourceSession?.nom ? String(sourceSession.nom) : "Récupération active"}</strong>
            <p>{sourceSession ? `${getSessionDuration(sourceSession, user.profile?.dureeSeanceMinutes ?? 45)} min · adaptée après ton check-in.` : "Marche légère, mobilité et respiration sans douleur."}</p>
            <em>{sourceSession ? "Préparer ma séance →" : "Voir ma récupération →"}</em>
          </Link>
          <Link href="/programme/alimentation" className="coai-brief-card">
            <span>02 · Nourrir</span>
            <strong>Énergie stable</strong>
            <p>Hydrate-toi régulièrement et répartis tes protéines sur la journée.</p>
            <em>Voir ma nutrition →</em>
          </Link>
          <Link href="/programme/recuperation" className="coai-brief-card">
            <span>03 · Récupérer</span>
            <strong>Préparer demain</strong>
            <p>5 minutes de respiration calme ce soir, puis une heure de coucher régulière.</p>
            <em>Optimiser ma récupération →</em>
          </Link>
        </div>
      </section>

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
        <div id="activite-quotidienne" className="scroll-mt-6"><ActiviteQuotidienneCard /></div>
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
