"use client";

import { useState } from "react";
import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

// Actions de la fiche de séance (23/08/2026) — téléchargement PDF et
// partage.
//
// Le PDF passe par l'impression du navigateur plutôt qu'une librairie
// JavaScript : jsPDF ou html2canvas auraient ajouté ~200 Ko au bundle pour
// un rendu moins fidèle (polices approximatives, images recompressées),
// alors que l'impression native produit un vrai PDF vectoriel avec le
// texte sélectionnable. La feuille de style d'impression est dans
// globals.css.
//
// Le partage réutilise le mécanisme déjà en place ailleurs : partage natif
// quand il existe, sinon ouverture dans un nouvel onglet — jamais un
// <a download> sur un blob:, qui éjectait l'utilisateur de la page sur
// Safari iOS (bug corrigé le 21/08).
export function FicheActions({ nomSeance }: { nomSeance: string }) {
  const [message, setMessage] = useState<string | null>(null);

  async function partager() {
    setMessage(null);
    const url = window.location.href;
    const texte = `Ma séance COAI du jour : ${nomSeance}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: texte, text: texte, url });
        trackFunnelEvent("progress_shared", { support: "fiche_seance" });
        return;
      }
      await navigator.clipboard.writeText(`${texte}\n${url}`);
      setMessage("Lien copié ✓");
      trackFunnelEvent("progress_shared", { support: "fiche_seance_copie" });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setMessage("Partage impossible pour le moment.");
    }
  }

  return (
    <div className="fiche-actions flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-laiton-400 px-5 py-2.5 text-sm font-bold text-[#0D0E12] transition hover:bg-laiton-300"
      >
        Enregistrer en PDF
      </button>
      <button
        type="button"
        onClick={partager}
        className="rounded-full border border-laiton-400/35 bg-laiton-400/10 px-5 py-2.5 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
      >
        Partager ma séance
      </button>
      {message && <span className="text-xs text-graphite-400">{message}</span>}
    </div>
  );
}
