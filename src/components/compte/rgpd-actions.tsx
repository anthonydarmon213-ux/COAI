"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RgpdActions() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);

  async function handleExport() {
    if (pending.current) return;
    pending.current = true;
    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/compte/export");
      if (!res.ok) throw new Error(res.status === 401 ? "session" : "export");
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      try {
        a.href = url;
        a.download = "coai-mes-donnees.json";
        document.body.appendChild(a);
        a.click();
      } finally {
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "session"
        ? "Ta connexion a expiré. Reconnecte-toi pour exporter tes données."
        : "L’export n’a pas abouti. Aucun fichier de données n’a pu être confirmé. Réessaie.");
    } finally {
      pending.current = false;
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (pending.current) return;
    if (!confirm("Supprimer définitivement ton compte et toutes tes données ?")) return;
    pending.current = true;
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/compte/delete", { method: "POST" });
      if (!res.ok) throw new Error(res.status === 401 ? "session" : "delete");
      const result: unknown = await res.json();
      if (!result || typeof result !== "object" || !("success" in result) || result.success !== true) {
        throw new Error("delete_unconfirmed");
      }
      router.replace("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "session"
        ? "Ta connexion a expiré. Reconnecte-toi avant de demander la suppression."
        : "La suppression n’a pas pu être confirmée. Réessaie ou contacte l’assistance si le problème persiste.");
      pending.current = false;
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      <Button type="button" onClick={handleExport} disabled={exporting || deleting} aria-busy={exporting}>
        {exporting ? "Préparation de l’export…" : "Exporter mes données"}
      </Button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting || exporting}
        aria-busy={deleting}
        className="min-h-11 text-sm text-red-400 underline disabled:opacity-50"
      >
        {deleting ? "Suppression…" : "Supprimer mon compte"}
      </button>
    </div>
  );
}
