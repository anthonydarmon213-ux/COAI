import Link from "next/link";
import Image from "next/image";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RegenerateButton } from "@/components/programme/regenerate-button";
import { AnalyserAdaptationButton } from "@/components/programme/analyser-adaptation-button";
import { ReprendreProgrammeButton } from "@/components/programme/reprendre-programme-button";
import { JsonView } from "@/components/programme/json-view";
import { EntrainementView } from "@/components/programme/entrainement-view";
import { NutritionView } from "@/components/programme/nutrition-view";
import { RecuperationView } from "@/components/programme/recuperation-view";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { FicheMacros } from "@/components/programme/fiche-macros";
import { AnalysePhotoRepas } from "@/components/programme/analyse-photo-repas";
import { MenuRestaurant } from "@/components/programme/menu-restaurant";
import { TrackConversion } from "@/components/analytics/track-conversion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { hasProgrammeAccess, getEffectivePlan } from "@/lib/subscription/plan";
import { calculerScoreSommeil } from "@/lib/insight/score-sommeil";
import { ScoreSommeilCard } from "@/components/programme/score-sommeil-card";
import { ProgrammeShareButton } from "@/components/programme/programme-share-button";
import { ProgrammePdfButton } from "@/components/programme/programme-pdf-button";
import { getStockPhotos } from "@/lib/media/pexels";
import type { Pilier, ProgrammeGenerated } from "@prisma/client";

// Traverse le JSON d'un programme généré (structure non garantie — contenu
// IA, différente par pilier) pour en extraire tous les "photoQuery" que
// l'IA a déjà générés à sa charge (un par exercice/repas, un par séance/
// jour via "photoQuerySeance"/"photoQueryJour" — cf. les prompts
// programme-*-session.ts / *-jour.ts) — jamais de requête inventée ici,
// uniquement celles déjà présentes dans le contenu généré, où qu'elles
// soient dans l'arborescence.
const CLES_PHOTO_QUERY = new Set(["photoQuery", "photoQuerySeance", "photoQueryJour"]);

function extractPhotoQueries(contenu: unknown): string[] {
  const queries = new Set<string>();
  function walk(node: unknown) {
    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }
    if (typeof node !== "object" || node === null) return;
    for (const [key, value] of Object.entries(node)) {
      if (CLES_PHOTO_QUERY.has(key) && typeof value === "string" && value.trim()) {
        queries.add(value);
      } else {
        walk(value);
      }
    }
  }
  walk(contenu);
  return Array.from(queries);
}

function estSocleCoai(contenu: unknown): boolean {
  return typeof contenu === "object" && contenu !== null && !Array.isArray(contenu) &&
    (contenu as Record<string, unknown>)._source === "SOCLE_COAI";
}

const LABELS: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Alimentation",
  RECUPERATION: "Récupération",
};

const TYPE_MEDIA: Partial<Record<Pilier, "exercice" | "repas">> = {
  ENTRAINEMENT: "exercice",
  NUTRITION: "repas",
};

const PILIERS: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];

const PDF_SLUG: Record<Pilier, string> = {
  ENTRAINEMENT: "entrainement",
  NUTRITION: "alimentation",
  RECUPERATION: "recuperation",
};

// Chaque pilier possède sa page dédiée. Le composant reste partagé pour
// conserver la même qualité visuelle, mais il ne rend que le contenu demandé
// par la route active : entraînement, alimentation ou récupération.
export async function PilierPage({ pilierActif }: { pilierActif: Pilier }) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [valides, derniers] = await Promise.all([
    Promise.all(
      PILIERS.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier, statut: "VALIDE" },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
    Promise.all(
      PILIERS.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
  ]);

  const plan = getEffectivePlan(user.subscription);
  const peutGenerer = hasProgrammeAccess(user, user.subscription);
  const indexPilierActif = PILIERS.indexOf(pilierActif);
  const aUnContenu = Boolean(valides[indexPilierActif] || derniers[indexPilierActif]);

  // Score sommeil (19/08/2026, demande Anthony) — requête limitée au pilier
  // Récupération, jamais chargée pour Entraînement/Nutrition.
  const scoreSommeil = pilierActif === "RECUPERATION"
    ? calculerScoreSommeil(
        await prisma.dailySession.findMany({
          where: { userId: user.id, date: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) } },
          select: { sleep: true, date: true },
        }),
        user.profile?.qualiteSommeil
      )
    : null;

  // Photos Pexels (19/08/2026, demande Anthony, étendu aux 3 piliers) :
  // résolues une seule fois ici (Server Component, clé jamais exposée au
  // client) à partir des "photoQuery"/"photoQuerySeance"/"photoQueryJour"
  // que l'IA génère elle-même dans le contenu (cf. extractPhotoQueries).
  const contenusAffiches = PILIERS.map((_, index) =>
    valides[index]?.contenu ??
    (derniers[index]?.statut === "EN_ATTENTE" || derniers[index]?.statut === "GENERE_IA"
      ? derniers[index]?.contenu
      : null)
  );
  const photosParPilier = await Promise.all(
    contenusAffiches.map((contenu, index) =>
      index === indexPilierActif && contenu && !estSocleCoai(contenu)
        ? getStockPhotos(extractPhotoQueries(contenu))
        : Promise.resolve(undefined)
    )
  );
  const recupHero = user.profile?.sexe?.toLowerCase() === "homme"
    ? "/recuperation/sauna-homme-blond-premium.jpg"
    : "/recuperation/sauna-femme-blonde-premium.jpg";
  const etapes = [
    { pilier: "ENTRAINEMENT" as Pilier, numero: "01", titre: "S'entraîner", sousTitre: "Ta séance guidée", image: "/exercices/back-squat-barre.jpg" },
    { pilier: "NUTRITION" as Pilier, numero: "02", titre: "Bien manger", sousTitre: "Tes repas et tes portions", image: "/repas/plat-saumon-quinoa-brocolis.jpg" },
    { pilier: "RECUPERATION" as Pilier, numero: "03", titre: "Récupérer", sousTitre: "Sommeil, mobilité et détente", image: recupHero },
  ];
  // pilierActif est typé par Prisma et ne peut être qu'une des trois valeurs
  // de PILIERS ; l'assertion évite de propager un faux cas undefined.
  const etapeActive = etapes[indexPilierActif]!;
  const heroParPilier: Record<Pilier, { titre: string; texte: string }> = {
    ENTRAINEMENT: {
      titre: "Ton entraînement.",
      texte: "Ta séance, tes exercices et ta progression — immédiatement accessibles.",
    },
    NUTRITION: {
      titre: "Ton alimentation.",
      texte: "Tes repas, tes portions et tes repères nutritionnels — simples à suivre.",
    },
    RECUPERATION: {
      titre: "Ta récupération.",
      texte: "Sommeil, mobilité et détente — seulement les actions utiles aujourd'hui.",
    },
  };

  const titresApercu = contenusAffiches.map((contenu, index) => {
    if (typeof contenu !== "object" || contenu === null || Array.isArray(contenu)) return etapes[index]?.sousTitre ?? "Programme prêt";
    const titre = (contenu as Record<string, unknown>).titre;
    return typeof titre === "string" && titre.trim() ? titre : etapes[index]?.sousTitre ?? "Programme prêt";
  });

  return (
    <div className="coai-programme-page flex flex-col gap-8">
      {derniers[0] && derniers[0].version === 1 && <TrackConversion name="first_programme_viewed" />}

      <div className="coai-programme-hero animate-reveal overflow-hidden px-5 py-6 sm:px-8 sm:py-9">
        <div className="flex flex-col gap-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="coai-diagnostic-kicker mb-4 w-fit">
                <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
                <span>{LABELS[pilierActif]}</span>
              </div>
              <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">{heroParPilier[pilierActif].titre}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-graphite-300 sm:text-base">
                {heroParPilier[pilierActif].texte}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ProgrammeShareButton cartes={[{
                numero: etapeActive.numero,
                label: LABELS[pilierActif].toUpperCase(),
                titre: titresApercu[indexPilierActif] ?? etapeActive.sousTitre,
                image: etapeActive.image,
              }]} />
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-cyan-300/20 bg-gradient-to-r from-cyan-300/[0.09] to-laiton-400/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200">À faire en premier · 45 secondes</p>
              <h2 className="mt-1.5 text-lg font-semibold text-white">Comment te sens-tu aujourd&apos;hui ?</h2>
              <p className="mt-1 text-xs leading-5 text-graphite-300">Forme, sommeil, douleur, temps et matériel : COAI prépare la bonne séance sans recréer tout ton programme.</p>
            </div>
            <Link href="/dashboard#check-in-du-jour" className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-graphite-950 transition hover:bg-cyan-50">
              Faire mon bilan →
            </Link>
          </div>

          <a
            href={`#pilier-${pilierActif.toLowerCase()}`}
            className="group relative min-h-56 overflow-hidden rounded-2xl border border-white/10 bg-black/30 sm:min-h-64"
          >
            <Image src={etapeActive.image} alt="" fill sizes="(max-width: 768px) 100vw, 900px" className="object-cover object-center opacity-60 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-75" />
            <span className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" aria-hidden="true" />
            <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
              <span>
                <span className="font-mono text-[10px] font-bold tracking-[0.18em] text-laiton-300">{LABELS[pilierActif].toUpperCase()}</span>
                <strong className="mt-1 block text-xl text-white">{etapeActive.titre}</strong>
                <span className="mt-1 block max-w-[36rem] text-sm leading-5 text-graphite-100">{titresApercu[indexPilierActif]}</span>
              </span>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${aUnContenu ? "bg-emerald-400/15 text-emerald-300" : "bg-white/10 text-graphite-400"}`}>
                {aUnContenu ? "Prêt" : "À créer"}
              </span>
            </span>
          </a>
        </div>
      </div>

      <details className="rounded-lg border border-graphite-800 bg-graphite-900/40 p-4 text-xs leading-5 text-graphite-400">
        <summary className="cursor-pointer font-semibold text-graphite-300">⚠️ Avant de commencer : sécurité et avis médical</summary>
        <p className="mt-3">
          Nous te recommandons de faire un bilan médical complet, en particulier en cas d&apos;antécédent ou de doute sur ta condition physique. Les programmes COAI sont des recommandations sportives, pas un avis médical : tu restes responsable de leur adéquation avec ton état de santé.
        </p>
      </details>

      {!peutGenerer && !aUnContenu && (
        <Card className="flex flex-col items-start gap-4 p-5 sm:p-8">
          <p className="text-sm font-semibold leading-6 text-graphite-200">
            Ton profil est prêt. Un seul programme, tout inclus — pas juste l&apos;entraînement.
          </p>
          <ul className="flex flex-col gap-1.5 text-sm leading-6 text-graphite-200">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-300">✓</span>
              <span>Ton entraînement personnalisé</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-300">✓</span>
              <span>
                <span className="font-semibold">Ton programme nutrition offert avec</span> — pas une
                option à part
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-laiton-300">✓</span>
              <span>
                <span className="font-semibold">Ta récupération optimisée</span> — sommeil, repos,
                gestion de la fatigue
              </span>
            </li>
          </ul>
          <Link href="/pricing" className="inline-flex w-fit items-center rounded-xl bg-laiton-400 px-6 py-3 text-sm font-extrabold text-graphite-950 shadow-sm transition hover:bg-laiton-300">
            Choisir mon accompagnement →
          </Link>
        </Card>
      )}

      {[pilierActif].map((pilier) => {
        const i = PILIERS.indexOf(pilier);
        const valide = valides[i];
        const dernier = derniers[i];
        const enAttente = dernier && dernier.statut === "EN_ATTENTE";
        const genereIA = dernier && dernier.statut === "GENERE_IA";
        const affiche: ProgrammeGenerated | null = valide ? valide : enAttente || genereIA ? dernier : null;

        if (!affiche && (!peutGenerer || !aUnContenu)) return null;

        return (
          <section id={`pilier-${pilier.toLowerCase()}`} key={pilier} className="scroll-mt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-laiton-400/35 bg-laiton-400/10 font-mono text-xs font-bold text-laiton-300">{i + 1}</span>
                <SectionLabel>{LABELS[pilier]}</SectionLabel>
              </div>
              <div className="flex items-center gap-2">
                {affiche && (
                  <ProgrammePdfButton slug={PDF_SLUG[pilier]} label="Aperçu 1 page" />
                )}
              </div>
            </div>

            <Card className="coai-programme-card flex flex-col gap-5 p-5 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {valide && (
                    <Badge tone="success">Généré par l&apos;IA · Supervisé par Anthony Darmon</Badge>
                  )}
                  {!valide && enAttente && <Badge tone="warning">À valider par le coach</Badge>}
                  {!valide && genereIA && estSocleCoai(affiche?.contenu) && (
                    <Badge tone="success">Programme COAI · conçu par Anthony Darmon</Badge>
                  )}
                  {!valide && genereIA && !estSocleCoai(affiche?.contenu) && (
                    <Badge tone="neutral">Généré par l&apos;IA — non relu par un coach</Badge>
                  )}
                </div>
                {affiche && <Badge tone="neutral">V{affiche.version}</Badge>}
              </div>

              {affiche && (
                <p className="text-xs text-graphite-500">
                  Généré le{" "}
                  {affiche.generatedAt.toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {affiche.version > 1 && (
                    <>
                      {" — "}
                      <Link href="/programme/evolution" className="underline hover:text-laiton-400">
                        voir comment ton programme a évolué
                      </Link>
                    </>
                  )}
                </p>
              )}

              {enAttente && (
                <p className="text-sm text-laiton-400">
                  Aperçu ci-dessous — Anthony n&apos;a pas encore relu/validé ce programme, les
                  détails peuvent encore être ajustés.
                </p>
              )}

              {genereIA && !estSocleCoai(affiche?.contenu) && (
                <p className="text-sm text-graphite-400">
                  Ton programme est piloté par ton coach personnel augmenté. Passe à l’accompagnement hybride (99 €/mois)
                  pour ajouter le regard et les ajustements d&apos;un coach humain.
                </p>
              )}

              {genereIA && estSocleCoai(affiche?.contenu) && (
                <p className="text-sm text-graphite-400">
                  Une méthode claire, progressive et illustrée avec la médiathèque exclusive COAI.
                  Tes bilans font ensuite évoluer la difficulté au fil de ta progression.
                </p>
              )}

              {pilier === "RECUPERATION" && scoreSommeil && <ScoreSommeilCard resultat={scoreSommeil} />}

              {/* Vision Nutri remonté en tête (22/08/2026, demande Anthony :
                  "ajoute un composant bien visible en haut de page") — il
                  vivait sous la liste des repas, donc invisible sans
                  scroller toute la semaine. */}
              {pilier === "NUTRITION" && <AnalysePhotoRepas />}
              {pilier === "NUTRITION" && <MenuRestaurant />}

              {(() => {
                const contenu = affiche?.contenu ?? null;
                if (!contenu) return <p className="text-sm text-graphite-400">Pas encore généré.</p>;
                if (pilier === "ENTRAINEMENT") return <EntrainementView data={contenu} photosParExercice={photosParPilier[i]} dureeProfil={user.profile?.dureeSeanceMinutes} />;
                if (pilier === "NUTRITION") return <NutritionView data={contenu} photosParExercice={photosParPilier[i]} />;
                if (pilier === "RECUPERATION") return <RecuperationView data={contenu} photosParExercice={photosParPilier[i]} sexe={user.profile?.sexe} />;
                return <JsonView data={contenu} typeMedia={TYPE_MEDIA[pilier]} />;
              })()}

              {pilier === "NUTRITION" && <FicheMacros />}
              {pilier === "NUTRITION" && (
                <Link href="/programme/recettes" className="self-start text-sm font-semibold text-laiton-400 underline">
                  Voir des idées de recettes →
                </Link>
              )}
              {pilier === "RECUPERATION" && (
                <Link href="/programme/programmes-prets" className="self-start text-sm font-semibold text-laiton-400 underline">
                  Sommeil, respiration, méditation, sauna & massage →
                </Link>
              )}
            </Card>

            {affiche?.temporaire && (
              <ReprendreProgrammeButton
                pilierSlug={PDF_SLUG[pilier]}
                finPrevue={affiche.finPrevue ? affiche.finPrevue.toISOString() : null}
              />
            )}

          </section>
        );
      })}

      {peutGenerer && (
        <details className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 text-sm">
          <summary className="cursor-pointer font-semibold text-graphite-300">Ajustements avancés du programme</summary>
          <div className="mt-3 flex flex-col items-start gap-3 border-t border-white/[0.07] pt-3">
            <p className="max-w-2xl text-xs leading-5 text-graphite-500">
              Ces actions peuvent utiliser l&apos;IA. Pour ta forme, ton temps ou ton matériel aujourd&apos;hui, utilise le bilan gratuit. Ne recrée les trois piliers qu&apos;après un vrai changement d&apos;objectif ou de situation.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[pilierActif].map((pilier) => {
                const index = PILIERS.indexOf(pilier);
                const affiche = valides[index] ?? derniers[index];
                return affiche ? (
                  <div key={pilier} className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-black/20 p-3">
                    <span className="text-xs font-semibold text-white">Analyser · {LABELS[pilier]}</span>
                    <AnalyserAdaptationButton pilierSlug={PDF_SLUG[pilier]} />
                  </div>
                ) : null;
              })}
            </div>
            <RegenerateButton hasExisting={Boolean(derniers.some(Boolean))} />
          </div>
        </details>
      )}

      <Link href="/compte/profil" className="text-sm text-laiton-400 underline">
        Modifier votre profil →
      </Link>

      <CoachingVisioCta plan={plan} />
    </div>
  );
}
