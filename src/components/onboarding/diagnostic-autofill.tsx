"use client";

import { useEffect, useState } from "react";
import { clearDiagnosticAnswers, readDiagnosticAnswers } from "@/lib/diagnostic/storage";

// Rendu sur /bienvenue (juste après paiement) : reprend les réponses
// laissées par le quiz public /diagnostic (visiteur anonyme, avant
// inscription) pour pré-remplir le profil réel sans faire tout ressaisir —
// "on la fait goûter, et après on vend" implique que le goût survit à la
// vente. Best-effort : n'affiche rien si aucune réponse en attente, et ne
// bloque jamais le flux d'inscription si l'appel échoue.
export function DiagnosticAutofill() {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "none">("idle");

  useEffect(() => {
    const answers = readDiagnosticAnswers();
    if (!answers) {
      setStatus("none");
      return;
    }
    setStatus("saving");
    fetch("/api/profil", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    })
      .then(() => setStatus("done"))
      .catch(() => setStatus("done"))
      .finally(() => clearDiagnosticAnswers());
  }, []);

  if (status !== "done") return null;

  return (
    <p className="flex items-center gap-2 rounded-lg border border-laiton-400/25 bg-laiton-400/[0.06] px-3 py-2 text-xs text-laiton-300">
      <span aria-hidden="true">✓</span>
      Profil pré-rempli depuis ton diagnostic — modifiable à tout moment.
    </p>
  );
}
