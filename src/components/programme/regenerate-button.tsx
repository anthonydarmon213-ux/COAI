"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RegenerateButton({ hasExisting = true }: { hasExisting?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/programmes/generate", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        const detail = Array.isArray(data.details) ? data.details.join(" · ") : null;
        throw new Error(
          detail ? `${data.error ?? "Échec de la génération."} (${detail})` : data.error ?? "Échec de la génération."
        );
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
      <Button onClick={handleClick} disabled={loading}>
        {loading
          ? "Génération en cours…"
          : hasExisting
            ? "Régénérer mon programme"
            : "Générer mon programme"}
      </Button>
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
