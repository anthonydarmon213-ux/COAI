"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function PortalButton({ label = "Gérer mon abonnement" }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  async function handleClick() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST", signal: controller.signal });
      const data = await res.json().catch(() => null);
      if (!res.ok || typeof data?.url !== "string" || !data.url) {
        throw new Error(res.status === 401
          ? "Ta connexion a expiré. Reconnecte-toi à COAI pour gérer ton abonnement."
          : res.status === 404
            ? "Aucun abonnement géré par Stripe n’est associé à ce compte."
            : "La gestion de ton abonnement est momentanément indisponible. Réessaie dans un instant.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(controller.signal.aborted
        ? "L’ouverture prend trop de temps. Vérifie ta connexion puis réessaie."
        : err instanceof TypeError
          ? "Connexion interrompue. Vérifie ton réseau puis réessaie."
          : err instanceof Error ? err.message : "Ouverture impossible. Réessaie dans un instant.");
      setLoading(false);
      busy.current = false;
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={handleClick} disabled={loading}>
        {loading ? "Ouverture…" : label}
      </Button>
      {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
