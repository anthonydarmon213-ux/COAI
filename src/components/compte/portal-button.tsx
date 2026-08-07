"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function PortalButton({ label = "Gérer mon abonnement" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error ?? "Impossible d'ouvrir le portail.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Ouverture…" : label}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
