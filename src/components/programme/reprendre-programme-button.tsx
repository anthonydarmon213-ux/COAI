"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// "Mode voyage activé — jusqu'au ..." + "Reprendre ton programme habituel ?"
// (Phase 2, section 5 de la vision) — recrée une version à partir du
// contenu d'avant l'adaptation temporaire, sans rien supprimer de
// l'historique.
export function ReprendreProgrammeButton({ pilierSlug, finPrevue }: { pilierSlug: string; finPrevue: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/programmes/${pilierSlug}/reprendre`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  const finPrevueTexte = finPrevue
    ? new Date(finPrevue).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
    : null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] p-4">
      <p className="text-sm text-laiton-200">
        Mode voyage activé{finPrevueTexte ? ` — jusqu'au ${finPrevueTexte}` : ""}. Ton programme
        habituel est conservé et t&apos;attend.
      </p>
      <Button variant="secondary" onClick={handleClick} disabled={loading} className="self-start px-4 py-2 text-xs">
        {loading ? "Retour en cours…" : "Reprendre mon programme habituel"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
