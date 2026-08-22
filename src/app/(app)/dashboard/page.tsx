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
  const [validated, latest, daily, insight, diesRecents] = await Promise.all([
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
  ]);
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
      </header>

      {/* Cockpit en grille (21/08/2026, demande Anthony : "vrai cockpit
          ultra-professionnel... éliminer le scroll vertical infini") —
          colonne principale (action du jour + check-in/séance, 2/3 sur
          desktop) à côté d'une colonne d'indicateurs (Score/Âge COAI,
          récupération musculaire, ce qui reste à faire), plutôt que tout
          empiler en une seule colonne. Contenu et logique de chaque bloc
          inchangés — seule la disposition change. */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 lg:items-start">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Lueur légère (point 5, demande Anthony) réservée à la carte
              d'action principale — pas ailleurs, pour ne pas diluer l'effet. */}
          <div className="relative">
            <div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-laiton-400/[0.12] blur-2xl" />
            <div className="relative">
              {/* Doublon retiré (20/08/2026, retour Anthony : "un petit
                  doublon... sur deux carrés à la suite") — le bouton de
                  check-in du header répétait exactement le même message
                  que cette carte, qui a déjà son propre CTA. Une seule
                  source pour cette mission. */}
              <AujourdhuiGuideCard mission={mission} insight={insight} hasAccess={hasAccess} serviceRecommande={serviceRecommande} />
            </div>
          </div>

          {!completion.essentielComplet ? (
            <section className="rounded-2xl border border-white/10 bg-laiton-400/[0.06] p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Profil incomplet</p>
              <h2 className="mt-2 text-2xl text-white">COAI a besoin de quelques repères essentiels.</h2>
              <p className="mt-2 text-sm leading-6 text-graphite-300">Il manque : {completion.champsEssentielsManquants.join(", ")}. Ces informations permettent de préparer une séance cohérente et prudente.</p>
              <Link href="/compte/profil?onboarding=1" className="mt-5 inline-flex rounded-full bg-laiton-400 px-6 py-3 text-sm font-semibold text-graphite-950">Compléter mon profil</Link>
            </section>
          ) : !programme ? (
            !hasAccess ? null : (
              <section id="programme-a-generer" className="scroll-mt-6 flex flex-col gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-center">
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
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">Journée de récupération</p>
              <h2 className="mt-3 font-editorial text-3xl text-white sm:text-4xl">Aujourd’hui, ton programme prévoit du repos.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300">La récupération fait partie du programme. Reste à l’écoute de ton corps ; une marche légère ou un peu de mobilité peuvent convenir seulement si tu te sens bien.</p>
              {pendingCoach && <p className="mt-4 text-sm font-semibold text-laiton-300">Programme V{programme.version} — à valider par ton coach.</p>}
              <Link href="/programme/recuperation" className="mt-5 inline-flex rounded-full border border-[#343730] bg-[#252724] px-5 py-2.5 text-sm font-bold text-[#fffdf8] shadow-sm transition hover:bg-[#343730]">Voir ma récupération</Link>
              <RestDayCheckin initialDaily={daily} />
            </section>
          )}

          <section className="coai-week-overview" aria-labelledby="week-title">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="coai-eyebrow">Ma semaine</p>
                <h2 id="week-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  {programme ? `${weeklyWorkoutCount} entraînement${weeklyWorkoutCount > 1 ? "s" : ""} planifié${weeklyWorkoutCount > 1 ? "s" : ""}` : "Ta semaine va prendre forme ici"}
                </h2>
              </div>
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
              <p className="coai-eyebrow">Aujourd’hui</p>
              <h2 id="today-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Ton briefing en trois décisions.</h2>
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
        </div>

        {/* Colonne d'indicateurs — condensée exprès (point 2, demande
            Anthony : "transforme les blocs de texte en badges/jauges").
            Récupération musculaire remontée ici, à côté de la semaine,
            au lieu d'être tout en bas de page comme avant. */}
        <div className="flex flex-col gap-5">
          <ScoreAgeCoaiCard resultat={ageCoai} />
          <RecuperationMusculaireCard />
          {!user.subscription && <ImpulsionChallenge createdAt={user.createdAt.toISOString()} userId={user.id} />}
          <BesoinsIdentifiesCard besoins={besoins} />
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5" aria-labelledby="coai-intelligence-title">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#4cc9f0]">Intelligence COAI</p>
            <h2 id="coai-intelligence-title" className="mt-1.5 text-sm font-semibold text-white">17 ans de coaching réel, pas une IA généraliste.</h2>
            <div className="mt-3 flex flex-wrap gap-1.5 text-[10px] font-semibold">
              <span className="rounded-full border border-[#ff8a3d]/25 bg-[#ff8a3d]/10 px-2.5 py-1 text-[#ffb17d]">17 ans de terrain</span>
              <span className="rounded-full border border-[#39e67b]/25 bg-[#39e67b]/10 px-2.5 py-1 text-[#76eea3]">Tes données réelles</span>
              <span className="rounded-full border border-[#c56cff]/25 bg-[#c56cff]/10 px-2.5 py-1 text-[#dca2ff]">Décisions explicables</span>
            </div>
            <blockquote className="mt-4 border-t border-white/10 pt-3 text-xs italic leading-5 text-graphite-300">
              “{MANTRAS[date.getDay()]}”
            </blockquote>
          </section>
        </div>
      </div>

      {programme && <WeeklyCheckinCard />}

      <section className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 text-graphite-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Diagnostic enrichi · Optionnel</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">COAI peut encore mieux te connaître.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-300">Envoie une capture de ton bracelet connecté ou une photo en tenue de sport. L’IA enrichit ton profil pour affiner les prochaines adaptations.</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-emerald-200">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5">✓ Sommeil, pas, fréquence cardiaque</span>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5">✓ Morphologie et posture</span>
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1.5">✓ Photo non conservée</span>
            </div>
          </div>
          <Link href="/compte/profil#diagnostic-high-tech" className="coai-diagnostic-enrich-cta inline-flex min-h-12 shrink-0 items-center justify-center rounded-full px-6 text-sm font-bold transition">Affiner mon diagnostic →</Link>
        </div>
      </section>

      {/* RecuperationMusculaireCard vit maintenant dans la colonne
          d'indicateurs plus haut (à côté de "Ma semaine") — retiré d'ici
          pour ne pas l'afficher deux fois. */}
      <div id="activite-quotidienne" className="scroll-mt-6"><ActiviteQuotidienneCard /></div>

      <div className="flex flex-wrap gap-3 border-t border-white/[0.07] pt-5 text-sm">
        <Link
          href="/programme"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-laiton-400/35 bg-white/[0.04] px-6 py-3 text-sm font-bold text-graphite-50 shadow-[0_14px_34px_-24px_rgba(0,0,0,.7)] transition hover:-translate-y-0.5 hover:bg-white/[0.08]"
        >
          Voir mon programme complet →
        </Link>
        <Link href="/suivi/progression" className="text-graphite-300 hover:text-white">Voir mon suivi →</Link>
      </div>
    </div>
  );
}
