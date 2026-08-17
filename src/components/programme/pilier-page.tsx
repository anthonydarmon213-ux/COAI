import Link from "next/link";
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
import { TrackConversion } from "@/components/analytics/track-conversion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { hasProgrammeAccess, getEffectivePlan } from "@/lib/subscription/plan";
import type { Pilier, ProgrammeGenerated } from "@prisma/client";

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

// Programme regroupé en une seule page (16/08/2026, demande Anthony — "je ne
// veux plus qu'on sépare les 3 piliers") : entraînement, nutrition et
// récupération s'affichent désormais empilés sur une même page au lieu de 3
// pages distinctes avec un sélecteur d'onglets. Les 3 anciennes routes
// (/programme/entrainement, /alimentation, /recuperation) restent en place
// et rendent toutes ce même composant — les liens existants ailleurs dans
// l'app (email coach, onboarding, dashboard...) continuent de fonctionner
// sans devoir être réécrits un par un.
export async function PilierPage({ pilierActif }: { pilierActif: Pilier }) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const piliersAffiches: Pilier[] = [pilierActif];
  const [valides, derniers] = await Promise.all([
    Promise.all(
      piliersAffiches.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier, statut: "VALIDE" },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
    Promise.all(
      piliersAffiches.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
  ]);

  const plan = getEffectivePlan(user.subscription);
  const peutGenerer = hasProgrammeAccess(user, user.subscription);
  const aUnContenu = valides.some(Boolean) || derniers.some(Boolean);

  return (
    <div className="coai-programme-page flex flex-col gap-8">
      {derniers[0] && derniers[0].version === 1 && <TrackConversion name="first_programme_viewed" />}

      <div className="coai-programme-hero animate-reveal flex flex-col gap-4 px-6 py-7 sm:px-8 sm:py-9">
        <div className="coai-diagnostic-kicker self-start">
          <span className="coai-diagnostic-kicker-status animate-status-pulse" aria-hidden="true" />
          <span>Programme personnalisé</span>
        </div>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Ton programme.</h1>
        <p className="max-w-2xl text-base leading-7 text-graphite-400">
          Entraînement, nutrition et récupération — un seul programme, coordonné.
        </p>
      </div>

      <p className="rounded-lg border border-graphite-800 bg-graphite-900/40 p-4 text-xs leading-5 text-graphite-400">
        ⚠️ Avant de démarrer un programme sur COAI, nous te recommandons fortement de faire un
        bilan médical complet auprès de ton médecin, en particulier en cas d&apos;antécédent ou de
        doute sur ta condition physique. Les programmes générés et validés sur COAI sont des
        recommandations sportives, pas un avis médical : tu restes seul responsable de ta pratique
        et de son adéquation avec ton état de santé, y compris en cas de blessure.
      </p>

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

      {piliersAffiches.map((pilier, i) => {
        const valide = valides[i];
        const dernier = derniers[i];
        const enAttente = dernier && dernier.statut === "EN_ATTENTE";
        const genereIA = dernier && dernier.statut === "GENERE_IA";
        const affiche: ProgrammeGenerated | null = valide ? valide : enAttente || genereIA ? dernier : null;

        if (!affiche && (!peutGenerer || !aUnContenu)) return null;

        return (
          <div key={pilier} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <SectionLabel>{LABELS[pilier]}</SectionLabel>
              <div className="flex items-center gap-2">
                {affiche && (
                  <a
                    href={`/api/programmes/${PDF_SLUG[pilier]}/pdf`}
                    className="rounded-full border border-graphite-800 px-4 py-2 text-sm text-graphite-300 transition hover:border-laiton-400/40 hover:text-white"
                  >
                    Télécharger en PDF
                  </a>
                )}
                {peutGenerer && <RegenerateButton hasExisting={Boolean(dernier)} />}
              </div>
            </div>

            <Card className="coai-programme-card flex flex-col gap-5 p-5 sm:p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {valide && (
                    <Badge tone="success">Généré par l&apos;IA · Supervisé par Anthony Darmon</Badge>
                  )}
                  {!valide && enAttente && <Badge tone="warning">À valider par le coach</Badge>}
                  {!valide && genereIA && (
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

              {genereIA && (
                <p className="text-sm text-graphite-400">
                  Ton programme est piloté par ton Personal Trainer IA. Passe à Transformation (89€/mois)
                  pour ajouter le regard et les ajustements d&apos;un coach humain.
                </p>
              )}

              {(() => {
                const contenu = affiche?.contenu ?? null;
                if (!contenu) return <p className="text-sm text-graphite-400">Pas encore généré.</p>;
                if (pilier === "ENTRAINEMENT") return <EntrainementView data={contenu} />;
                if (pilier === "NUTRITION") return <NutritionView data={contenu} />;
                if (pilier === "RECUPERATION") return <RecuperationView data={contenu} />;
                return <JsonView data={contenu} typeMedia={TYPE_MEDIA[pilier]} />;
              })()}

              {pilier === "NUTRITION" && <FicheMacros />}
            </Card>

            {affiche?.temporaire && (
              <ReprendreProgrammeButton
                pilierSlug={PDF_SLUG[pilier]}
                finPrevue={affiche.finPrevue ? affiche.finPrevue.toISOString() : null}
              />
            )}

            {affiche && peutGenerer && <AnalyserAdaptationButton pilierSlug={PDF_SLUG[pilier]} />}
          </div>
        );
      })}

      <Link href="/compte/profil" className="text-sm text-laiton-400 underline">
        Modifier votre profil →
      </Link>

      <CoachingVisioCta plan={plan} />
    </div>
  );
}
