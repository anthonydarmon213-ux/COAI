"use client";

import { useEffect, useState } from "react";
import type { StorySeance } from "@/lib/programmes/story-seance";
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
export function FicheActions({ nomSeance, story }: { nomSeance: string; story?: StorySeance }) {
  const [message, setMessage] = useState<string | null>(null);
  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => images.forEach(image => URL.revokeObjectURL(image.url)), [images]);

  async function preparerStory() {
    if (!story || busy) return;
    setBusy(true); setMessage(null);
    const generated: { file: File; url: string }[] = [];
    try {
      const { renderStory } = await import("@/lib/programmes/story-seance");
      for (let page = 0; page < Math.max(1, Math.ceil(story.exercices.length / 3)); page++) {
        const blob = await renderStory(story, page);
        generated.push({ file: new File([blob], `coai-seance-story-${page + 1}.png`, { type: "image/png" }), url: URL.createObjectURL(blob) });
      }
      setImages(generated);
    } catch {
      generated.forEach(image => URL.revokeObjectURL(image.url));
      setMessage("L’image n’a pas pu être préparée. Réessaie ou utilise le PDF.");
    } finally { setBusy(false); }
  }

  async function partagerImage(file: File) {
    try {
      if (!navigator.canShare?.({ files: [file] })) {
        setMessage("Ouvre l’image ci-dessous, enregistre-la dans Photos puis importe-la dans Instagram ou TikTok.");
        return;
      }
      await navigator.share({ files: [file] });
      trackFunnelEvent("progress_shared", { support: "fiche_story" });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Utilise « Ouvrir l’image » puis enregistre-la pour la publier depuis Instagram ou TikTok.");
    }
  }

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
        onClick={story ? preparerStory : partager}
        disabled={busy}
        className="rounded-full border border-laiton-400/35 bg-laiton-400/10 px-5 py-2.5 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/20"
      >
        {busy ? "Préparation…" : story ? "Partager en Story" : "Partager ma séance"}
      </button>
      {message && <span role="status" className="text-sm text-graphite-300">{message}</span>}
      {images.length > 0 && (
        <section aria-label="Aperçu des Stories" className="w-full rounded-2xl border border-laiton-400/30 bg-graphite-950 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-white">Ta fiche au format Story</h2>
            <button type="button" onClick={() => setImages([])} className="min-h-11 px-3 text-sm text-laiton-200">Fermer l’aperçu</button>
          </div>
          <p className="my-3 text-sm text-graphite-300">1080 × 1920 · Instagram / TikTok. Vérifie le contenu avant de partager. Aucun nom de client, poids utilisé, ressenti ou donnée de santé n’est ajouté. Rien n’est publié automatiquement.</p>
          <div className="grid gap-5 sm:grid-cols-2">
            {images.map((image, i) => (
              <div key={image.url} className="flex flex-col items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- locally generated blob preview */}
                <img src={image.url} alt={`Aperçu COAI, page ${i + 1} de la séance`} width={1080} height={1920} className="w-full max-w-72 rounded-xl" />
                <button type="button" onClick={() => partagerImage(image.file)} className="min-h-11 rounded-full bg-laiton-400 px-5 text-sm font-bold text-graphite-950">Partager la page {i + 1}</button>
                <a href={image.url} target="_blank" rel="noopener noreferrer" className="min-h-11 py-2 text-sm text-laiton-200 underline">Ouvrir l’image {i + 1} pour l’enregistrer</a>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-graphite-300">Si Instagram ou TikTok n’apparaît pas dans le partage : enregistre l’image, puis ajoute-la depuis Photos dans l’application choisie.</p>
        </section>
      )}
    </div>
  );
}
