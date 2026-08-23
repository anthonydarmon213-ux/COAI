import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { SectionLabel } from "@/components/ui/section-label";
import { DailyExperience } from "@/components/daily/daily-experience";
import { ActiviteQuotidienneCard } from "@/components/dashboard/activite-quotidienne-card";
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
import { ScoreAgeCoaiCard } from "@/components/dashboard/score-age-coai-card";
import { calculerAgeCoai } from "@/lib/insight/age-coai";
import { RecuperationMusculaireCard } from "@/components/dashboard/recuperation-musculaire-card";
import { StreakBadgesCard } from "@/components/dashboard/streak-badges-card";
import { DeskResetCard } from "@/components/dashboard/desk-reset-card";
import { RoutineRecuperation } from "@/components/dashboard/routine-recuperation";
import { SeanceDuJourHero } from "@/components/programme/seance-du-jour-hero";
import { getGamification } from "@/lib/insight/gamification";
import { AnneauxMacros } from "@/components/programme/anneaux-macros";
import { ReadinessCard } from "@/components/dashboard/readiness-card";
import { MonitoringSanteCard } from "@/components/dashboard/monitoring-sante-card";
import { calculerReadiness } from "@/lib/insight/readiness";
import { AujourdhuiGuideCard, type MissionDuJour } from "@/components/dashboard/aujourdhui-guide-card";
import { RestDayCheckin } from "@/components/daily/rest-day-checkin";

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
  const [validated, latest, daily, insight, diesRecents, gamification, programmeNutrition] = await Promise.all([
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
    // Fenêtre de 90 jours pour le Score & Âge COAI (19/08/2026) — assez
    // large pour ne pas dépendre d'une série sans trou, sans remonter à
    // des habitudes trop anciennes pour rester représentatif.
    prisma.dailySession.findMany({
      where: { userId: user.id, date: { gte: new Date(date.getTime() - 90 * 24 * 60 * 60 * 1000) } },
      select: { sleep: true, energy: true, workoutRating: true, pain: true, completedAt: true },
    }),
    getGamification(user.id),
    // Programme nutrition (23/08/2026) — uniquement pour les anneaux de
    // macros du bloc 3. Le dashboard ne chargeait que l'entraînement.
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "NUTRITION" },
      orderBy: { generatedAt: "desc" },
      select: { contenu: true },
    }),
  ]);

  // objectifsJournaliers vit à la racine du contenu nutrition généré.
  // Absent (programme non encore généré, ancienne version) → AnneauxMacros
  // ne rend rien, plutôt que d'inventer des cibles.
  const objectifsMacros =
    programmeNutrition?.contenu && typeof programmeNutrition.contenu === "object" && !Array.isArray(programmeNutrition.contenu)
      ? (programmeNutrition.contenu as Record<string, unknown>).objectifsJournaliers
      : null;
  // Readiness du jour (22/08/2026) — calculé sur le check-in déjà chargé
  // ci-dessus + les données santé du profil quand elles existent. Aucune
  // requête supplémentaire.
  const readiness = calculerReadiness({
    sleep: daily?.sleep ?? null,
    energy: daily?.energy ?? null,
    chargeMentale: daily?.chargeMentale ?? null,
    pain: daily?.pain ?? null,
    hrv: user.profile?.hrv ?? null,
    frequenceCardiaqueRepos: user.profile?.frequenceCardiaqueRepos ?? null,
  });
  const ageCoai = calculerAgeCoai({ ageChronologique: user.profile?.age ?? null, dailies: diesRecents });

  const programme = validated ?? latest;
  const sourceSession = programme ? getWorkoutForDate(programme.contenu, date) : null;
  const week = getWeek(date, programme?.contenu);
  const weeklyWorkoutCount = week.filter((day) => day.workout).length;
  const pendingCoach = Boolean(!validated && latest?.statut === "EN_ATTENTE");
  const objective = sourceSession?.nom ? `Aujourd’hui, on travaille ${String(sourceSession.nom).toLowerCase()}.` : "Une journée utile, adaptée à ton rythme.";
  const besoins = filtrerBesoinsPertinents(detecterBesoins(user.profile), user, user.subscription);
  const hasAccess = hasProgrammeAccess(user, user.subscription);
  const serviceRecommande = besoins[0]?.service ?? "IMPULSION";

  // Une seule direction claire à chaque connexion (19/08/2026, demande
  // Anthony : "être pédagogue... indiquer ce que doit faire la personne").
  // Reflète exactement le même état que la section détaillée plus bas —
  // jamais une deuxième source de vérité, juste une entrée plus visible.
  const mission: MissionDuJour = !completion.essentielComplet
    ? {
        kicker: "Ta mission du jour",
        title: "Complète ton profil essentiel.",
        description: `Il manque : ${completion.champsEssentielsManquants.join(", ")}. C'est ce qui permet à COAI de préparer une séance cohérente et prudente.`,
        href: "/compte/profil?onboarding=1",
        cta: "Compléter mon profil →",
      }
    : !programme
      ? hasAccess
        ? {
            kicker: "Ta mission du jour",
            title: "Ta première semaine peut être générée maintenant.",
            description: "Ton profil est prêt. Il ne reste qu'un geste explicite de ta part pour lancer la génération.",
            href: "#programme-a-generer",
            cta: "Générer mon programme →",
          }
        : {
            kicker: "Ta mission du jour",
            title: "Choisis ton accompagnement pour démarrer.",
            description: "Découvre d'abord ce que COAI a compris de ton profil, puis choisis l'expérience qui te correspond.",
          }
      : sourceSession
        ? !daily?.sleep
          ? {
              kicker: "Ta mission du jour",
              title: "Fais ton check-in — 45 secondes.",
              description: "Sommeil, énergie, douleur éventuelle : ces réponses ajustent ta séance du jour avant que tu la commences.",
              href: "#check-in-du-jour",
              cta: "Faire mon check-in →",
            }
          : {
              kicker: "Ta mission du jour",
              title: sourceSession?.nom ? String(sourceSession.nom) : "Ta séance du jour t'attend.",
              description: "Ton check-in est fait, ta séance est prête et adaptée à ta forme du jour.",
              href: "#check-in-du-jour",
              cta: "Voir ma séance →",
            }
        : {
            kicker: "Ta mission du jour",
            title: "Aujourd'hui, jour de récupération.",
            description: "La récupération fait partie du programme. Marche légère ou mobilité seulement si tu te sens bien.",
            href: "/programme/recuperation",
            cta: "Voir ma récupération →",
          };

  return (
    /* Dashboard épuré en 3 blocs (23/08/2026, demande Anthony : "un
       dashboard premium doit être épuré", ~14 blocs auparavant).
       Retirés d'ici : Intelligence COAI, Activité quotidienne, Streak &
       badges, Monitoring santé, Score/Âge COAI, Récupération musculaire,
       Besoins identifiés, Ma semaine, Briefing du jour, Routine
       récupération, Diagnostic enrichi, Impulsion challenge.
       Aucun composant n'est supprimé du code : ils restent disponibles
       pour /progression ou /compte, seul le dashboard est allégé. */
    <div className="coai-dashboard flex flex-col gap-8">
      <DashboardIntroVideo />

      {/* BLOC 1 — Hero + Readiness du jour */}
      <header className="coai-dashboard-hero animate-reveal flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <DashboardAvatar score={completion.pourcentage} />
            <div>
              <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
                {user.prenom ? `Bonjour ${user.prenom}.` : "Bonjour."}
              </h1>
              <p className="mt-2 max-w-xl text-base leading-7 text-graphite-300">{objective}</p>
            </div>
          </div>
          <ReadinessCard readiness={readiness} compact />
        </div>
      </header>

      {/* BLOC 2 — L'action principale du jour, seule décision à prendre */}
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-laiton-400/[0.12] blur-2xl" />
        <div className="relative flex flex-col gap-5">
          {!completion.essentielComplet ? (
            <section className="coai-glass p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Profil incomplet</p>
              <h2 className="mt-2 text-2xl text-white">COAI a besoin de quelques repères essentiels.</h2>
              <p className="mt-2 text-sm leading-6 text-graphite-300">Il manque : {completion.champsEssentielsManquants.join(", ")}.</p>
              <Link href="/compte/profil?onboarding=1" className="mt-5 inline-flex rounded-full bg-laiton-400 px-6 py-3 text-sm font-semibold text-graphite-950">Compléter mon profil</Link>
            </section>
          ) : !programme ? (
            !hasAccess ? (
              <AujourdhuiGuideCard mission={mission} insight={insight} hasAccess={hasAccess} serviceRecommande={serviceRecommande} />
            ) : (
              <section id="programme-a-generer" className="coai-glass scroll-mt-6 flex flex-col gap-4 p-6">
                <div className="text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Programme à préparer</p>
                  <h2 className="mt-2 text-2xl text-white">Ta première semaine peut être générée maintenant.</h2>
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
                equipementProfil={user.profile?.equipementDisponible}
              />
            </div>
          ) : (
            <section id="check-in-du-jour" className="relative scroll-mt-6 overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-white/[0.025] p-6 sm:p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Journée de récupération</p>
              <h2 className="mt-3 font-editorial text-3xl text-white sm:text-4xl">Aujourd&rsquo;hui, ton programme prévoit du repos.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300">Reste à l&rsquo;écoute de ton corps ; une marche légère ou un peu de mobilité peuvent convenir seulement si tu te sens bien.</p>
              {pendingCoach && <p className="mt-4 text-sm font-semibold text-laiton-300">Programme V{programme.version} — à valider par ton coach.</p>}
              <RestDayCheckin initialDaily={daily} />
            </section>
          )}
        </div>
      </div>

      {/* BLOC 3 — Bilan rapide : macros à gauche, pause active à droite */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <AnneauxMacros objectifsJournaliers={objectifsMacros} />
        <DeskResetCard />
      </div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.07] pt-5 text-sm">
        <Link
          href="/programme"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-laiton-400/35 bg-white/[0.04] px-6 py-3 text-sm font-bold text-graphite-50 transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
        >
          Voir mon programme complet →
        </Link>
        <Link href="/suivi/progression" className="text-graphite-300 hover:text-white">Voir mon suivi →</Link>
      </div>
    </div>
  );
}
