"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";
import { CoachReviewLink } from "@/components/programme/coach-review-link";

// Confirmation manuelle après avoir complété les champs essentiels manquants
// depuis l'écran "COAI te connaît à X%" (Phase 5.1, correction structurante de
// l'onboarding, 11/08/2026) — jamais de génération automatique silencieuse,
// même une fois le profil suffisant : un geste explicite, cohérent avec le
// reste de l'app (moteur d'adaptation, régénération...) qui ne change jamais
// rien sans confirmation.
export function GenererProgrammeOnboarding() {
  const router = useRouter();
  const [etat, setEtat] = useState<"idle" | "loading" | "erreur">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function generer() {
    setEtat("loading");
    setMessage(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch("/api/programmes/generate?mode=onboarding", { method: "POST", signal: controller.signal });
      const result = await res.json();
      if (!res.ok) {
        setMessage(typeof result?.error === "string" ? result.error : null);
        throw new Error("generation");
      }
      if (result?.echecs > 0) throw new Error("generation partielle");
      trackFunnelEvent("first_programme_viewed");
      router.push("/programme/entrainement");
    } catch {
      setEtat("erreur");
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-6 py-6 text-center">
      <SectionLabel>Ton profil est suffisamment précis</SectionLabel>
      <p className="max-w-sm text-sm leading-6 text-graphite-300">
        COAI peut vérifier les programmes disponibles pour ton profil. Tu peux continuer
        à enrichir ton profil plus tard.
      </p>
      <Button onClick={generer} disabled={etat === "loading"} className="px-8 py-3">
        {etat === "loading" ? "Génération en cours…" : "Générer mon programme"}
      </Button>
      {etat === "erreur" && (
        <p className="text-sm text-red-400">
          {message ?? "Un souci est survenu — retrouve"}{" "}
          <a href="/programme/entrainement" className="underline">
            ton programme
          </a>
          .
        </p>
      )}
      <CoachReviewLink />
    </div>
  );
}
