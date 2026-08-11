"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { clearDiagnosticAnswers, readDiagnosticAnswers } from "@/lib/diagnostic/storage";
import { readDiagnosticProgress } from "@/lib/diagnostic/progress-storage";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Rendu sur /bienvenue, juste après l'activation Stripe (essai ou paiement
// immédiat) — correction Anthony du 11/08/2026 : "l'utilisateur doit
// pouvoir utiliser réellement COAI pendant sa période d'essai", donc plus
// question d'attendre la fin des 7 jours pour voir son programme.
//
// Remplace l'ancien DiagnosticAutofill (pré-remplissage silencieux, aucune
// suite visible) par un vrai enchaînement :
// - diagnostic complet en attente (pont pré-inscription, storage.ts) →
//   applique au profil + génère le programme tout de suite → écran "Ton
//   programme est prêt".
// - diagnostic abandonné en cours de route (progress-storage.ts) →
//   "Continuer mon diagnostic".
// - aucun diagnostic → "Faire mon diagnostic" (jamais de programme
//   générique inventé sans données réelles).
const RETRIES_GENERATION = 3;
const DELAI_RETRY_MS = 1800;

type Etat = "verification" | "sans_diagnostic" | "reprise_possible" | "generation" | "pret" | "erreur";

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ActivationFlow() {
  const [etat, setEtat] = useState<Etat>("verification");

  useEffect(() => {
    const reponses = readDiagnosticAnswers();
    if (!reponses) {
      const progression = readDiagnosticProgress<Record<string, unknown>>();
      setEtat(progression ? "reprise_possible" : "sans_diagnostic");
      return;
    }

    let annule = false;
    setEtat("generation");

    (async () => {
      try {
        await fetch("/api/profil", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reponses),
        });
        clearDiagnosticAnswers();

        // Best-effort contre le décalage webhook Stripe : l'abonnement peut
        // ne pas être encore visible en base au moment exact où cette page
        // se charge (redirection Stripe quasi instantanée, webhook parfois
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
      } catch {
        if (!annule) setEtat("erreur");
      }
    })();

    return () => {
      annule = true;
    };
  }, []);

  if (etat === "verification") return null;

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
          Entraînement, nutrition, récupération — à partir de ton diagnostic. Quelques secondes.
        </p>
      </div>
    );
  }

  if (etat === "pret") {
    return (
      <div className="flex w-full flex-col items-center gap-4 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-9 text-center">
        <SectionLabel>Ton programme est prêt</SectionLabel>
        <p className="max-w-sm text-sm leading-6 text-graphite-300">
          Entraînement, nutrition et récupération, personnalisés à partir de ton diagnostic.
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
    </div>
  );
}
