"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FormCheckReponse({ id }: { id: string }) {
  const router = useRouter();
  const [reponse, setReponse] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function envoyer() {
    if (!reponse.trim()) return;
    setEnvoi(true);
    setErreur(null);
    const r = await fetch("/api/admin/form-check", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reponse }),
    });
    setEnvoi(false);
    if (!r.ok) {
      setErreur("L'enregistrement a échoué.");
      return;
    }
    setReponse("");
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      <textarea
        value={reponse}
        onChange={(e) => setReponse(e.target.value)}
        rows={4}
        placeholder="Ton ajustement : ce qui va, ce qui coince, quoi corriger en priorité."
        className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-graphite-500"
      />
      {erreur ? <p className="text-sm text-rose-300">{erreur}</p> : null}
      <button
        type="button"
        onClick={envoyer}
        disabled={!reponse.trim() || envoi}
        className="self-start rounded-full bg-cyan-300 px-6 py-2.5 text-sm font-bold text-[#04121a] disabled:opacity-40"
      >
        {envoi ? "Envoi…" : "Envoyer ma réponse"}
      </button>
    </div>
  );
}
