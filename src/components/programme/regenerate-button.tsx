"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegenerateButton({ hasExisting = true }: { hasExisting?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  async function handleClick() {
    if (hasExisting && !confirmation) {
      setConfirmation(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/programmes/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        // Le détail technique renvoyé par l'API était concaténé au message
        // affiché (23/08/2026) : un abonné a vu l'erreur brute du
        // fournisseur IA, avec les identifiants de requête. L'API ne
        // renvoie plus ce détail, et le bouton n'affiche que le message
        // destiné à l'utilisateur.
        throw new Error(typeof data?.error === "string" ? data.error : "La génération n'a pas abouti.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
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
            Ça peut prendre jusqu&apos;à une minute — l&apos;IA génère les 3 piliers en
            parallèle.
          </p>
        </div>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
