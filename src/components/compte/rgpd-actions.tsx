"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RgpdActions() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleExport() {
    const res = await fetch("/api/compte/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "anthony-darmon-coaching-augmente-mes-donnees.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete() {
    if (!confirm("Supprimer définitivement ton compte et toutes tes données ?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/compte/delete", { method: "POST" });
      if (!res.ok) throw new Error("La suppression a échoué.");
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Button onClick={handleExport}>Exporter mes données</Button>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm text-red-400 underline"
      >
        {deleting ? "Suppression…" : "Supprimer mon compte"}
      </button>
    </div>
  );
}
