import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { DailyExperience } from "@/components/daily/daily-experience";
import { GenererProgrammeOnboarding } from "@/components/compte/generer-programme-onboarding";
import { getCoaiInsight } from "@/lib/insight/coai-insight";
import { computeProfilCompletion } from "@/lib/profil/completion";
import { hasProgrammeAccess, hasPaidSubscription } from "@/lib/subscription/plan";
import { OffresCard } from "@/components/dashboard/offres-card";
import { getSessionDuration, getWorkoutForDate, type WorkoutSession } from "@/lib/daily/session";
import { recommanderServiceDepuisProfil } from "@/lib/dashboard/besoins-identifies";
import { DashboardAvatar } from "@/components/dashboard/dashboard-avatar";
import { DashboardIntroVideo } from "@/components/dashboard/dashboard-intro-video";
import { calculerAgeCoai } from "@/lib/insight/age-coai";
import { DeskResetCard } from "@/components/dashboard/desk-reset-card";
import { AnneauxMacros } from "@/components/programme/anneaux-macros";
import { ReadinessCard } from "@/components/dashboard/readiness-card";
import { calculerReadiness } from "@/lib/insight/readiness";
import { AujourdhuiGuideCard, type MissionDuJour } from "@/components/dashboard/aujourdhui-guide-card";
import { RestDayCheckin } from "@/components/daily/rest-day-checkin";
import { ReperesDuJour } from "@/components/dashboard/reperes-du-jour";
import { ObjectifCheminCard } from "@/components/dashboard/objectif-chemin-card";
import { DashboardCommandRail } from "@/components/dashboard/dashboard-command-rail";
import { CapitalPhysiqueCard } from "@/components/dashboard/capital-physique-card";
import { construireCapitalPhysique } from "@/lib/insight/capital-physique";

function nomSeanceCourt(nom: string) {
  const normalise = nom.toLowerCase();
  if (normalise.includes("full body") || normalise.includes("corps entier")) {
    if (normalise.includes("force")) return "Corps entier — Force";
    if (normalise.includes("hypertroph")) return "Corps entier — Muscle";
    if (normalise.includes("métabol")) return "Corps entier — Dynamique";
    return "Corps entier";
  }
  return nom.length > 42 ? `${nom.slice(0, 39).trim()}…` : nom;
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
  const [validated, latest, daily, diesRecents, programmeNutrition, programmeRecuperation, seancesDuMoisCount, testsPhysiques] = await Promise.all([
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "ENTRAINEMENT", statut: "VALIDE" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "ENTRAINEMENT" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.dailySession.findUnique({ where: { userId_date: { userId: user.id, date } } }),
    prisma.dailySession.findMany({
      where: { userId: user.id, date: { gte: new Date(date.getTime() - 90 * 24 * 60 * 60 * 1000) } },
      select: { sleep: true, energy: true, workoutRating: true, pain: true, completedAt: true },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "NUTRITION", statut: { in: ["VALIDE", "GENERE_IA"] } },
      orderBy: { generatedAt: "desc" },
      select: { contenu: true },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier: "RECUPERATION", statut: { in: ["VALIDE", "GENERE_IA"] } },
      orderBy: { generatedAt: "desc" },
      select: { id: true },
    }),
    prisma.seanceLog.count({
      where: { userId: user.id, date: { gte: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.testMaxi.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      select: { exercice: true, valeur: true, unite: true, date: true },
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
  const capitalPhysique = construireCapitalPhysique(testsPhysiques, user.profile);

  // Un programme EN_ATTENTE reste invisible tant qu'Anthony ne l'a pas
  // validé. GENERE_IA est le seul statut non validé publiable.
  const programme = validated ?? (latest?.statut === "GENERE_IA" ? latest : null);
  const sourceSession = programme ? getWorkoutForDate(programme.contenu, date) : null;
  const pendingCoach = Boolean(!validated && latest?.statut === "EN_ATTENTE");
  const nomSeance = sourceSession?.nom ? nomSeanceCourt(String(sourceSession.nom)) : null;
  const objective = nomSeance ? `Aujourd’hui : ${nomSeance}.` : "Une journée utile, adaptée à ton rythme.";
  const hasAccess = hasProgrammeAccess(user, user.subscription);
  const serviceRecommande = recommanderServiceDepuisProfil(user.profile);
  // Un ancien déblocage à vie conserve son programme, mais ne doit jamais
  // se voir revendre COAI Essentiel. S'il souhaite davantage d'accompagnement,
  // Premium Remote est le premier niveau supplémentaire cohérent.
  const serviceAProposer = hasAccess && serviceRecommande === "IMPULSION" ? "TRANSFORMATION" : serviceRecommande;
  const insight = !programme && !hasAccess ? await getCoaiInsight(user.id) : null;

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
    : pendingCoach
      ? {
          kicker: "Validation en cours",
          title: "Ton coach relit ton programme.",
          description: "Ton programme reste privé jusqu'à sa validation. Tu seras guidé dès qu'il sera prêt.",
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
            title: "Pose ton premier repère gratuitement.",
            description: "Choisis un exercice, note une série et découvre comment COAI construit ta courbe de progression. Aucun abonnement nécessaire pour essayer.",
            href: "/suivi/repcount?onboarding=1",
            cta: "Tester RepCount gratuitement →",
          }
      : sourceSession
        ? !daily?.sleep
          ? {
              kicker: "Ta mission du jour",
              title: "Fais ton bilan du jour — 30 secondes.",
              description: "Forme, sommeil, douleur, temps et matériel : COAI ajuste ta séance avant que tu la commences.",
              href: "#check-in-du-jour",
              cta: "Faire mon bilan →",
            }
          : {
              kicker: "Ta mission du jour",
              title: sourceSession?.nom ? String(sourceSession.nom) : "Ta séance du jour t'attend.",
              description: "Ton bilan est fait, ta séance est prête et adaptée à ta forme du jour.",
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

      {/* BLOC 1 — Accueil personnel */}
      <header className="coai-dashboard-hero animate-reveal flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-9">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(56,189,248,.9)]" />
          COAI Live · ton plan du jour
        </div>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-5">
            <DashboardAvatar resultat={ageCoai} />
            <div>
              <h1 className="break-words font-editorial text-4xl font-normal tracking-tight sm:text-5xl">
                {user.prenom ? `Bonjour ${user.prenom}.` : "Bonjour."}
              </h1>
              <p className="mt-2 max-w-xl text-base leading-7 text-graphite-300">{objective}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/suivi/repcount?onboarding=1" className="inline-flex min-h-12 items-center rounded-full bg-cyan-200 px-5 py-3 text-sm font-bold text-[#111216]">
            Enregistrer une série →
          </Link>
          <Link href="/fonctionnalites" className="text-sm font-semibold text-white underline underline-offset-4">Découvrir mes fonctions gratuites</Link>
          <p className="w-full text-sm text-graphite-300">Note tes répétitions et ta charge. Retrouve ton repère à la prochaine séance.</p>
        </div>
        <DashboardCommandRail
          profil={completion.pourcentage}
          readiness={readiness.disponible ? readiness.score : null}
          seances={seancesDuMoisCount}
        />
      </header>

      {/* BLOC 2 — L'action principale vient immédiatement après l'accueil.
          Le chemin de progression reste utile, mais ne doit jamais repousser
          la séance sous plusieurs écrans. */}
      <div className="relative">
        <div aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-[2rem] bg-[radial-gradient(circle_at_75%_20%,rgba(56,189,248,.16),rgba(212,175,55,.08),transparent_70%)] blur-2xl" />
        <div className="relative flex flex-col gap-5">
          {!completion.essentielComplet ? (
            <section className="coai-glass p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Profil incomplet</p>
              <h2 className="mt-2 text-2xl text-white">COAI a besoin de quelques repères essentiels.</h2>
              <p className="mt-2 text-sm leading-6 text-graphite-300">Il manque : {completion.champsEssentielsManquants.join(", ")}.</p>
              <Link href="/compte/profil?onboarding=1" className="mt-5 inline-flex rounded-full bg-laiton-400 px-6 py-3 text-sm font-semibold text-graphite-950">Compléter mon profil</Link>
            </section>
          ) : pendingCoach ? (
            <section className="coai-glass flex flex-col gap-3 p-6 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-laiton-400">Validation en cours</p>
              <h2 className="text-2xl text-white">Ton coach relit ton programme.</h2>
              <p className="text-sm leading-6 text-graphite-300">Son contenu reste privé jusqu&apos;à sa validation.</p>
            </section>
          ) : !programme ? (
            !hasAccess ? (
              <AujourdhuiGuideCard mission={mission} insight={insight!} hasAccess={hasAccess} serviceRecommande={serviceRecommande} />
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

      {(readiness.disponible || (completion.essentielComplet && sourceSession && !pendingCoach)) && (
        <ReadinessCard readiness={readiness} />
      )}

      <CapitalPhysiqueCard {...capitalPhysique} />

      {/* Progression secondaire : visible après l'action du jour, pas avant. */}
      <ObjectifCheminCard
        objectifs={user.profile?.objectifs}
        completion={completion}
        hasProgramme={Boolean(programme)}
        hasNutrition={Boolean(programmeNutrition)}
        hasRecovery={Boolean(programmeRecuperation)}
        hasAccess={hasAccess}
        premiereSeanceFaite={seancesDuMoisCount > 0}
        seancesDuMois={seancesDuMoisCount}
      />

      {/* BLOC 3 — Bilan rapide : macros à gauche, pause active à droite */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <AnneauxMacros objectifsJournaliers={objectifsMacros} />
        <DeskResetCard />
      </div>

      <ReperesDuJour habitudeHydratation={user.profile?.hydratation} />

      {/* Les formules ne sont proposées qu'ici, une fois le produit vu
          (01/09/2026) : l'inscription renvoyait auparavant vers /pricing,
          soit un prix avant même la première séance. Masquée dès qu'un
          abonnement est actif — inutile de vendre à qui a déjà acheté. */}
      {!hasPaidSubscription(user.subscription) && <OffresCard serviceRecommande={serviceAProposer} />}

      <div className="flex flex-wrap gap-3 border-t border-white/[0.07] pt-5 text-sm">
        <Link
          href="/programme"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-cyan-300/30 bg-cyan-300/[0.06] px-6 py-3 text-sm font-bold text-graphite-50 transition hover:-translate-y-0.5 hover:bg-cyan-300/[0.12]"
        >
          Voir mon programme complet →
        </Link>
        <Link href="/suivi/progression" className="text-graphite-300 hover:text-white">Voir mon suivi →</Link>
      </div>
    </div>
  );
}
