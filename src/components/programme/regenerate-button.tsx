"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CoachReviewLink } from "@/components/programme/coach-review-link";
import { withRequestDeadline } from "@/lib/suivi/request-deadline";

export function RegenerateButton({ hasExisting = true }: { hasExisting?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const requestPending = useRef(false);

  async function handleClick() {
    if (requestPending.current) return;
    if (hasExisting && !confirmation) {
      setConfirmation(true);
      return;
    }
    requestPending.current = true;
    setLoading(true);
    setError(null);
    try {
      // First creation is resumable: a lost response must not create another version.
      const { res, data } = await withRequestDeadline(async signal => {
        const res = await fetch(hasExisting ? "/api/programmes/generate" : "/api/programmes/generate?mode=onboarding", { method: "POST", signal });
        return { res, data: await res.json() };
      });
      if (!res.ok) {
        // Le détail technique renvoyé par l'API était concaténé au message
        // affiché (23/08/2026) : un abonné a vu l'erreur brute du
        // fournisseur IA, avec les identifiants de requête. L'API ne
        // renvoie plus ce détail, et le bouton n'affiche que le message
        // destiné à l'utilisateur.
        setError(typeof data?.error === "string" ? data.error : "La préparation n'a pas abouti. Réessaie dans un instant.");
        return;
      }
      if (data?.echecs > 0) {
        setError("Une partie du programme n’a pas pu être enregistrée. Retrouve les piliers déjà disponibles dans ton espace.");
        return;
      }
      const programmes = data?.programmes;
      if (data?.echecs !== 0 || !Array.isArray(programmes) || programmes.length !== 3 ||
          !["ENTRAINEMENT", "NUTRITION", "RECUPERATION"].every(pilier => programmes.filter(
            p => p && p.pilier === pilier && typeof p.id === "string" && p.id.length > 0 &&
              ["GENERE_IA", "VALIDE", "EN_ATTENTE"].includes(p.statut)
          ).length === 1) || new Set(programmes.map(p => p.id)).size !== 3) {
        setError("La création n’a pas pu être confirmée. Consulte ton programme avant de réessayer.");
        return;
      }
      setConfirmation(false);
      if (!hasExisting) {
        // Explicitly show session one, even when today is a rest day. This does
        // not alter the user's weekly schedule or imply a completed workout.
        router.replace("/programme/entrainement?onboarding=1#seance-du-jour");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error && err.name === "AbortError"
        ? "La réponse met trop de temps. Ton programme peut déjà être enregistré. Consulte ton espace avant de réessayer."
        : "La connexion a été interrompue ou la réponse est illisible. Consulte ton programme avant de réessayer.");
    } finally {
      requestPending.current = false;
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {confirmation && !loading ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3">
          <p className="max-w-md text-xs leading-5 text-amber-100">Confirmer la création d&apos;une nouvelle version complète : entraînement, alimentation et récupération.</p>
          <div className="flex gap-2">
            <Button onClick={handleClick}>Oui, recréer les 3 piliers</Button>
            <button type="button" onClick={() => setConfirmation(false)} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-graphite-300">Annuler</button>
          </div>
        </div>
      ) : (
        <Button onClick={handleClick} disabled={loading}>
          {loading
            ? "Création en cours…"
            : hasExisting
              ? "Recréer mes 3 piliers"
              : "Créer mon programme complet"}
        </Button>
      )}
      {loading && (
        <div className="flex w-56 flex-col gap-1.5">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-graphite-800">
            <div className="animate-progress-indeterminate absolute top-0 h-full w-1/3 rounded-full bg-laiton-400" />
          </div>
          <p className="text-xs text-graphite-400">
            COAI prépare tes trois piliers à partir de sa bibliothèque.
          </p>
        </div>
      )}
      {error && (
        <>
          <p role="alert" className="text-sm text-red-400">{error}</p>
          <button type="button" onClick={() => {
            router.replace("/programme/entrainement?onboarding=1#seance-du-jour");
            router.refresh();
          }} className="min-h-11 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-graphite-200">
            Vérifier mon programme
          </button>
        </>
      )}
      <CoachReviewLink />
    </div>
  );
}
