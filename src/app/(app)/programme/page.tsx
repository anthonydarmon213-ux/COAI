import { getCurrentAppUser } from "@/lib/auth/server";
import { prisma } from "@/lib/db/client";
import { RegenerateButton } from "@/components/programme/regenerate-button";
import { JsonView } from "@/components/programme/json-view";
import { ProfilForm } from "@/components/compte/profil-form";
import { ProfilCompletion } from "@/components/compte/profil-completion";
import Link from "next/link";
import { CoachingVisioCta } from "@/components/suivi/coaching-visio-cta";
import { FicheMacros } from "@/components/programme/fiche-macros";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { computeProfilCompletion } from "@/lib/profil/completion";
import { getEffectivePlan } from "@/lib/subscription/plan";
import type { Pilier } from "@prisma/client";

const LABELS: Record<Pilier, string> = {
  ENTRAINEMENT: "Entraînement",
  NUTRITION: "Nutrition",
  RECUPERATION: "Récupération",
};

const TYPE_MEDIA: Partial<Record<Pilier, "exercice" | "repas">> = {
  ENTRAINEMENT: "exercice",
  NUTRITION: "repas",
};

export default async function ProgrammePage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const piliers: Pilier[] = ["ENTRAINEMENT", "NUTRITION", "RECUPERATION"];
  const [derniersValides, dernieresGenerations] = await Promise.all([
    Promise.all(
      piliers.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier, statut: "VALIDE" },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
    Promise.all(
      piliers.map((pilier) =>
        prisma.programmeGenerated.findFirst({
          where: { userId: user.id, pilier },
          orderBy: { generatedAt: "desc" },
        })
      )
    ),
  ]);

  const hasExisting = dernieresGenerations.some(Boolean);
  const { remplis, total } = computeProfilCompletion(user.profile);
  const plan = getEffectivePlan(user.subscription);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 border-b border-white/[0.07] pb-7">
        <SectionLabel>Coaching</SectionLabel>
        <h1 className="font-editorial text-4xl font-normal tracking-tight sm:text-5xl">Votre programme intelligent.</h1>
        <p className="max-w-2xl text-sm leading-6 text-graphite-400">Votre profil nourrit trois dimensions coordonnées par l’IA, relues et validées par votre coach.</p>
      </div>

      {/* Profil */}
      <div className="flex flex-col gap-3">
        <SectionLabel>Mon profil</SectionLabel>
        <Card className="flex flex-col gap-5 p-6 sm:p-8">
          <ProfilCompletion remplis={remplis} total={total} />
          <ProfilForm
            profil={{
              objectifs: user.profile?.objectifs,
              niveau: user.profile?.niveau,
              equipementDisponible: user.profile?.equipementDisponible,
              contraintesSante: user.profile?.contraintesSante,
              antecedentsMedicaux: user.profile?.antecedentsMedicaux,
              tailleCm: user.profile?.tailleCm,
              age: user.profile?.age,
              morphologie: user.profile?.morphologie,
              frequenceEntrainement: user.profile?.frequenceEntrainement,
              sportsPratiques: user.profile?.sportsPratiques,
              habitudesAlimentaires: user.profile?.habitudesAlimentaires,
              repasParJour: user.profile?.repasParJour,
              hydratation: user.profile?.hydratation,
              consommationCafe: user.profile?.consommationCafe,
              consommationAlcool: user.profile?.consommationAlcool,
              qualiteSommeil: user.profile?.qualiteSommeil,
            }}
          />
        </Card>
      </div>

      {/* Séparateur intuitif entre le formulaire et le résultat généré */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-graphite-800" />
        <span className="whitespace-nowrap font-mono text-xs uppercase tracking-widest text-laiton-400">
          ↓ Généré à partir de ce profil
        </span>
        <div className="h-px flex-1 bg-graphite-800" />
      </div>

      {/* Programme */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SectionLabel>Mon programme</SectionLabel>
          {plan !== "GRATUIT" && <RegenerateButton hasExisting={hasExisting} />}
        </div>

        {plan === "GRATUIT" ? (
          <Card className="flex flex-col items-start gap-3">
            <Badge tone="warning">Réservé aux offres Standard et Premium</Badge>
            <p className="text-sm text-graphite-300">
              Ton profil est prêt. Passe à l&apos;offre Standard (49€/mois) pour générer ton
              programme IA — entraînement, nutrition, récupération — relu et validé par Anthony
              Darmon.
            </p>
            <Link href="/pricing">
              <Button>Voir les offres</Button>
            </Link>
          </Card>
        ) : (
        <Card className="flex flex-col gap-8 p-6 sm:p-8">
          {piliers.map((pilier, i) => {
            const valide = derniersValides[i];
            const dernier = dernieresGenerations[i];
            const enAttente = dernier && dernier.statut === "EN_ATTENTE";

            return (
              <div key={pilier} className="flex flex-col gap-3 border-t border-graphite-800 pt-6 first:border-t-0 first:pt-0">
                <div className="flex items-center justify-between">
                  <SectionLabel>{LABELS[pilier]}</SectionLabel>
                  {valide && (
                    <Badge tone="success">Généré par l&apos;IA · Supervisé par Anthony Darmon</Badge>
                  )}
                  {!valide && enAttente && <Badge tone="warning">À valider par le coach</Badge>}
                </div>

                {enAttente && (
                  <p className="text-sm text-laiton-400">
                    Aperçu ci-dessous — Anthony n&apos;a pas encore relu/validé ce programme, les
                    détails peuvent encore être ajustés.
                  </p>
                )}

                {valide ? (
                  <JsonView data={valide.contenu} typeMedia={TYPE_MEDIA[pilier]} />
                ) : enAttente ? (
                  <JsonView data={dernier.contenu} typeMedia={TYPE_MEDIA[pilier]} />
                ) : (
                  <p className="text-sm text-graphite-400">Pas encore généré.</p>
                )}

                {pilier === "NUTRITION" && <FicheMacros />}
              </div>
            );
          })}
        </Card>
        )}
      </div>

      <CoachingVisioCta plan={plan} />
    </div>
  );
}
