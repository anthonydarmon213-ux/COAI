"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { clearDiagnosticAnswers, readDiagnosticAnswers } from "@/lib/diagnostic/storage";
import { readDiagnosticProgress } from "@/lib/diagnostic/progress-storage";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import { computeProfilCompletion, type CompletionProfil } from "@/lib/profil/completion";
import { ProfilCompletion } from "@/components/compte/profil-completion";

// Rendu sur /bienvenue, juste après l'activation Stripe (essai ou paiement
// immédiat).
//
// Phase 5.1 (11/08/2026, correction structurante de l'onboarding) : le
// diagnostic ne suffit plus à lui seul à justifier une génération immédiate
// — seul le profil ESSENTIEL (champs à choix contraint, jamais légitimement
// vides, cf. src/lib/profil/completion.ts) conditionne la génération. Dans
// la pratique, le diagnostic couvre déjà tous les champs essentiels : un
// utilisateur qui l'a fait garde donc l'accès immédiat déjà promis
// (correction du 11/08/2026, "l'essai doit donner un accès réel"). Seuls les
// profils réellement incomplets (abonnement direct sans diagnostic, ou
// diagnostic abandonné avant les questions essentielles) voient l'écran
// "COAI te connaît à X%" plutôt qu'une génération automatique.
const RETRIES_GENERATION = 3;
const DELAI_RETRY_MS = 1800;

type Etat =
  | "verification"
  | "sans_diagnostic"
  | "reprise_possible"
  | "completion"
  | "generation"
  | "pret"
  | "erreur";

type ProfilLike = Parameters<typeof computeProfilCompletion>[0];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ActivationFlow({
  plan,
  profilInitial,
}: {
  plan: "GRATUIT" | "STANDARD";
  profilInitial: ProfilLike | null;
}) {
  const [etat, setEtat] = useState<Etat>("verification");
  const [completion, setCompletion] = useState<CompletionProfil | null>(null);

  useEffect(() => {
    let annule = false;

    async function lancerGeneration() {
      setEtat("generation");
      // Best-effort contre le décalage webhook Stripe : l'abonnement peut ne
      // pas être encore visible en base au moment exact où cette page se
      // charge (redirection Stripe quasi instantanée, webhook parfois
      // quelques secondes derrière) — quelques tentatives espacées avant
      // d'abandonner, plutôt qu'un échec immédiat.
      let ok = false;
      for (let tentative = 0; tentative < RETRIES_GENERATION && !ok; tentative++) {
        if (tentative > 0) await sleep(DELAI_RETRY_MS);
        const res = await fetch("/api/programmes/generate", { method: "POST" });
        ok = res.ok;
      }
      if (annule) return;
      if (!ok) throw new Error("generation");
      trackFunnelEvent("first_programme_viewed");
      setEtat("pret");
    }

    (async () => {
      try {
        const reponses = readDiagnosticAnswers();
        let profilCourant: ProfilLike | null = profilInitial;

        if (reponses) {
          const res = await fetch("/api/profil", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reponses),
          });
          clearDiagnosticAnswers();
          if (res.ok) profilCourant = await res.json();
        }

        const calc = computeProfilCompletion(profilCourant);
        if (annule) return;

        if (calc.essentielComplet) {
          await lancerGeneration();
          return;
        }

        // Profil déjà entamé (diagnostic tout juste appliqué, ou profil
        // partiellement rempli d'une session précédente) mais essentiel
        // incomplet : écran de complétion plutôt que le choix "faire le
        // diagnostic", qui n'a plus lieu d'être une fois des données déjà là.
        if (calc.remplis > 0) {
          setCompletion(calc);
          setEtat("completion");
          return;
        }

        const progression = readDiagnosticProgress<Record<string, unknown>>();
        setEtat(progression ? "reprise_possible" : "sans_diagnostic");
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();

    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (etat === "verification") return null;

  if (etat === "completion" && completion) {
    return (
      <div className="flex w-full flex-col items-center gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-9 text-center">
        <div className="w-full max-w-sm">
          <ProfilCompletion completion={completion} />
        </div>
        <p className="max-w-sm text-sm leading-6 text-graphite-400">
          Ton diagnostic nous a donné les bases. Complète maintenant les quelques informations qui
          permettront à COAI de construire un programme vraiment précis.
        </p>
        <Link href="/compte/profil?onboarding=1">
          <Button className="px-8 py-3">Compléter mon profil</Button>
        </Link>
      </div>
    );
  }

  if (etat === "generation") {
    return (
      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-9 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg
            width="64"
            height="64"
            viewBox="0 0 120 120"
            fill="none"
            className="absolute inset-0 animate-spin"
            style={{ animationDuration: "1.4s" }}
            aria-hidden="true"
          >
            <circle cx="60" cy="60" r="44" stroke="#26282d" strokeWidth="7" />
            <circle
              cx="60"
              cy="60"
              r="44"
              stroke="#c9a262"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="90 190"
            />
          </svg>
        </div>
        <p className="font-mono text-xs uppercase tracking-widest text-laiton-400">
          COAI prépare ton programme
        </p>
        <p className="max-w-sm text-sm leading-6 text-graphite-400">
          Entraînement, nutrition, récupération — à partir de ton profil. Quelques secondes.
        </p>
      </div>
    );
  }

  if (etat === "pret") {
    // Transformation : la V1 générée reste en attente de relecture par le
    // coach (statut EN_ATTENTE existant, cf. StatutProgramme) — jamais
    // présentée comme définitive avant sa validation. Impulsion : 100% IA,
    // disponible immédiatement, rien à valider.
    if (plan === "STANDARD") {
      return (
        <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-9 text-center">
          <SectionLabel>À valider par ton coach</SectionLabel>
          <p className="max-w-sm text-sm leading-6 text-graphite-300">
            Ton programme V1 est prêt — entraînement, nutrition et récupération. Anthony (ou un
            coach qu&apos;il a formé) le relit avant qu&apos;il devienne définitif.
          </p>
          <Link href="/programme/entrainement">
            <Button className="px-8 py-3">Découvrir mon programme</Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-9 text-center">
        <SectionLabel>Ton programme est prêt</SectionLabel>
        <p className="max-w-sm text-sm leading-6 text-graphite-300">
          Entraînement, nutrition et récupération, personnalisés à partir de ton profil.
        </p>
        <Link href="/programme/entrainement">
          <Button className="px-8 py-3">Commencer ma première séance</Button>
        </Link>
      </div>
    );
  }

  if (etat === "erreur") {
    return (
      <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-8 text-center">
        <p className="text-sm text-graphite-400">
          Ton profil est enregistré, mais la génération de ton programme a rencontré un souci.
        </p>
        <Link href="/programme/entrainement" className="text-sm text-laiton-400 underline">
          Réessayer depuis ton programme →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-9 text-center">
      <p className="font-display text-xl font-semibold text-white">
        Personnalisons maintenant ton coaching.
      </p>
      <p className="max-w-sm text-sm leading-6 text-graphite-400">
        Quelques questions rapides pour que ton programme te ressemble vraiment.
      </p>
      <Link href="/diagnostic">
        <Button className="px-8 py-3">
          {etat === "reprise_possible" ? "Continuer mon diagnostic" : "Faire mon diagnostic"}
        </Button>
      </Link>
      {etat === "sans_diagnostic" && (
        <Link href="/compte/profil?onboarding=1" className="text-xs text-graphite-500 underline hover:text-laiton-400">
          Ou compléter mon profil directement
        </Link>
      )}
    </div>
  );
}
