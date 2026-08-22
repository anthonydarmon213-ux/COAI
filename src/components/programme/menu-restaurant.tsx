"use client";

import { useRef, useState } from "react";

// Restaurant Decoder (22/08/2026, demande Anthony) — photographie la carte,
// COAI propose les 2 meilleurs choix et l'ajustement à demander au serveur.
//
// Compression côté client AVANT l'envoi : une photo de menu prise au
// téléphone pèse 3 à 5 Mo, dont la quasi-totalité est inutile pour lire du
// texte. Réduire à 1400px de large en JPEG qualité 0.72 divise le poids par
// ~10 sans nuire à la lisibilité — moins de tokens d'image facturés, et un
// aller-retour bien plus rapide au restaurant, où la personne attend.
async function compresser(fichier: File): Promise<Blob> {
  const bitmap = await createImageBitmap(fichier);
  const LARGEUR_MAX = 1400;
  const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
  const largeur = Math.round(bitmap.width * ratio);
  const hauteur = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = largeur;
  canvas.height = hauteur;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fichier;
  ctx.drawImage(bitmap, 0, 0, largeur, hauteur);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.72)
  );
  // Si la compression échoue ou grossit l'image (petite photo déjà
  // optimisée), on envoie l'original plutôt qu'une version dégradée.
  return blob && blob.size < fichier.size ? blob : fichier;
}

type Resultat = {
  analysable: boolean;
  restaurant: string | null;
  choix: { plat: string; pourquoi: string; ajustement: string | null }[];
  resume: string | null;
};

export function MenuRestaurant() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function analyser(fichier: File) {
    setChargement(true);
    setErreur(null);
    setResultat(null);
    try {
      const compresse = await compresser(fichier);
      const form = new FormData();
      form.append("file", compresse, "menu.jpg");
      const res = await fetch("/api/nutrition/menu-restaurant", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErreur(typeof data?.error === "string" ? data.error : "Analyse impossible pour le moment.");
        return;
      }
      setResultat(data as Resultat);
    } catch {
      setErreur("Analyse impossible pour le moment.");
    } finally {
      setChargement(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Au restaurant</p>
      <h2 className="mt-1.5 text-lg font-semibold text-white">📜 Scanner un menu</h2>
      <p className="mt-1 text-xs leading-5 text-graphite-400">
        Photographie la carte : COAI te propose deux plats cohérents avec ton objectif, et quoi demander au serveur.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) analyser(f);
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={chargement}
        className="mt-3 w-full rounded-full border border-laiton-400/35 bg-laiton-400/10 py-2.5 text-xs font-semibold text-laiton-200 transition hover:bg-laiton-400/20 disabled:opacity-60"
      >
        {chargement ? "Lecture de la carte…" : "Photographier le menu →"}
      </button>

      {erreur && <p className="mt-3 text-xs text-red-400">{erreur}</p>}

      {resultat && !resultat.analysable && (
        <p className="mt-3 text-xs leading-5 text-graphite-400">
          {resultat.resume ?? "Cette photo n'a pas pu être analysée."}
        </p>
      )}

      {resultat?.analysable && (
        <div className="mt-4 flex flex-col gap-2.5">
          {resultat.restaurant && (
            <span className="self-start rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-graphite-300">
              {resultat.restaurant}
            </span>
          )}

          {resultat.choix.map((c, i) => (
            <div key={c.plat} className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
              <p className="text-sm font-semibold text-white">
                <span className="mr-1.5 font-mono text-[10px] text-laiton-300">{i === 0 ? "MEILLEUR CHOIX" : "SINON"}</span>
              </p>
              <p className="mt-1 text-sm font-semibold text-laiton-100">{c.plat}</p>
              <p className="mt-1 text-xs leading-5 text-graphite-400">{c.pourquoi}</p>
              {c.ajustement && (
                <p className="mt-2 rounded-lg border border-laiton-400/25 bg-laiton-400/[0.07] px-2.5 py-1.5 text-[11px] leading-4 text-laiton-200">
                  À demander : {c.ajustement}
                </p>
              )}
            </div>
          ))}

          {resultat.resume && <p className="text-[11px] italic leading-4 text-graphite-500">{resultat.resume}</p>}
        </div>
      )}
    </section>
  );
}
