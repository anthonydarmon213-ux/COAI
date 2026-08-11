import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RegenerateButton } from "@/components/programme/regenerate-button";
import { AnalyserAdaptationButton } from "@/components/programme/analyser-adaptation-button";
import { JsonView } from "@/components/programme/json-view";
import { EntrainementView } from "@/components/programme/entrainement-view";
import { NutritionView } from "@/components/programme/nutrition-view";
import { RecuperationView } from "@/components/programme/recuperation-view";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { FicheMacros } from "@/components/programme/fiche-macros";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/ui/section-label";
import { canGenerateProgramme, getEffectivePlan, isInTrial } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

const LABELS: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Alimentation",
  RECUPERATION: "Récupération",
};

const DESCRIPTIONS: Record<Pilier, string> = {
  ENTRAINEMENT: "Ton programme d’entraînement, adapté à ton niveau et tes objectifs.",
  NUTRITION: "Ton plan alimentaire, coordonné avec ton entraînement.",
  RECUPERATION: "Mobilité, sommeil, récupération — pour progresser sans te blesser.",
};

const TYPE_MEDIA: Partial<Record<Pilier, "exercice" | "repas">> = {
  ENTRAINEMENT: "exercice",
  NUTRITION: "repas",
};

const AUTRES_PILIERS: { pilier: Pilier; href: string }[] = [
  { pilier: "ENTRAINEMENT", href: "/programme/entrainement" },
  { pilier: "NUTRITION", href: "/programme/alimentation" },
  { pilier: "RECUPERATION", href: "/programme/recuperation" },
];

const PDF_SLUG: Record<Pilier, string> = {
  ENTRAINEMENT: "entrainement",
  NUTRITION: "alimentation",
  RECUPERATION: "recuperation",
};

export async function PilierPage({ pilier }: { pilier: Pilier }) {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const [valide, dernier] = await Promise.all([
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier, statut: "VALIDE" },
      orderBy: { generatedAt: "desc" },
    }),
    prisma.programmeGenerated.findFirst({
      where: { userId: user.id, pilier },
      orderBy: { generatedAt: "desc" },
    }),
  ]);

  const enAttente = dernier && dernier.statut === "EN_ATTENTE";
  const genereIA = dernier && dernier.statut === "GENERE_IA";
  const affiche = valide ? valide : enAttente || genereIA ? dernier : null;
  const plan = getEffectivePlan(user.subscription);
  const enEssai = isInTrial(user.subscription);
  const peutGenerer = canGenerateProgramme(user.subscription);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 border-b border-acier/25 pb-7">
        <SectionLabel>Votre programme</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">{LABELS[pilier]}.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">{DESCRIPTIONS[pilier]}</p>
      </div>

      <p className="rounded-lg border border-graphite-800 bg-graphite-900/40 p-4 text-xs leading-5 text-graphite-400">
        ⚠️ Avant de démarrer un programme sur COAI, nous te recommandons fortement de faire un
        bilan médical complet auprès de ton médecin, en particulier en cas d&apos;antécédent ou de
        doute sur ta condition physique. Les programmes générés et validés sur COAI sont des
        recommandations sportives, pas un avis médical : tu restes seul responsable de ta pratique
        et de son adéquation avec ton état de santé, y compris en cas de blessure.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {AUTRES_PILIERS.map((p) => (
          <Link
            key={p.pilier}
            href={p.href}
            className={`rounded-lg border px-3 py-1.5 text-sm transition ${
              p.pilier === pilier
                ? "border-laiton-400/20 bg-laiton-400/[0.08] text-laiton-300"
                : "border-graphite-800 text-graphite-400 hover:text-white"
            }`}
          >
            {LABELS[p.pilier]}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
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

        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {valide && (
                <Badge tone="success">Généré par l&apos;IA · Supervisé par Anthony Darmon</Badge>
              )}
              {!valide && enAttente && <Badge tone="warning">À valider par le coach</Badge>}
              {!valide && genereIA && <Badge tone="neutral">Généré par l&apos;IA — non relu par un coach</Badge>}
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
              Programme généré à 100% par IA, sans relecture humaine. Passe à l&apos;offre
              Transformation (49€/mois) pour qu&apos;un coach diplômé d&apos;État le relise et
              l&apos;ajuste.
            </p>
          )}

          {(() => {
            const contenu = affiche?.contenu ?? null;
            if (!contenu) {
              if (enEssai) {
                return (
                  <p className="text-sm text-graphite-400">
                    Ton programme sera généré dès la fin de ton essai offert — tu peux en attendant
                    te balader sur l&apos;application et découvrir ce que propose COAI.
                  </p>
                );
              }
              if (!peutGenerer) {
                return (
                  <p className="text-sm text-graphite-400">
                    Un abonnement actif est nécessaire pour générer ton programme.{" "}
                    <Link href="/pricing" className="text-laiton-400 underline">
                      Voir les formules
                    </Link>
                    .
                  </p>
                );
              }
              return <p className="text-sm text-graphite-400">Pas encore généré.</p>;
            }
            if (pilier === "ENTRAINEMENT") return <EntrainementView data={contenu} />;
            if (pilier === "NUTRITION") return <NutritionView data={contenu} />;
            if (pilier === "RECUPERATION") return <RecuperationView data={contenu} />;
            return <JsonView data={contenu} typeMedia={TYPE_MEDIA[pilier]} />;
          })()}

          {pilier === "NUTRITION" && <FicheMacros />}
        </Card>

        {affiche && peutGenerer && <AnalyserAdaptationButton pilierSlug={PDF_SLUG[pilier]} />}

        <Link href="/compte/profil" className="text-sm text-laiton-400 underline">
          Modifier votre profil →
        </Link>
      </div>

      <CoachingVisioCta plan={plan} />
    </div>
  );
}
