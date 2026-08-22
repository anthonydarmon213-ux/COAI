"use client";

import { useRef, useState } from "react";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";

// Scan Morpho & Posture (22/08/2026, demande Anthony) — module dédié,
// extrait du formulaire de profil où il était enfoui parmi les champs.
//
// Deux vues plutôt qu'une seule photo : de face et de profil ne révèlent pas
// les mêmes choses (équilibre gauche/droite d'un côté, alignement vertical
// de l'autre). La vue est transmise à l'analyse pour qu'elle ne commente pas
// un alignement invisible sous cet angle.
//
// Les photos ne sont jamais stockées : traitées en mémoire par l'API puis
// jetées, seules les observations textuelles sont conservées dans le profil.
type Vue = "face" | "profil";

type Resultat = {
  vue: Vue;
  morphologieDetectee: string | null;
  observationsPosture: string | null;
  resume: string | null;
};

const CONSIGNES: Record<Vue, { titre: string; points: string[] }> = {
  face: {
    titre: "Photo de face",
    points: ["Debout, bras le long du corps", "Corps entier dans le cadre", "Téléphone à hauteur de hanche"],
  },
  profil: {
    titre: "Photo de profil",
    points: ["De côté, position naturelle", "Corps entier dans le cadre", "Regard droit devant"],
  },
};

export function ScanMorphoPosture({
  morphologieInitiale,
  observationsInitiales,
}: {
  morphologieInitiale?: string | null;
  observationsInitiales?: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const vueEnCoursRef = useRef<Vue>("face");
  const [chargement, setChargement] = useState<Vue | null>(null);
  const [resultats, setResultats] = useState<Resultat[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [refus, setRefus] = useState<string | null>(null);

  async function analyser(fichier: File, vue: Vue) {
    setChargement(vue);
    setErreur(null);
    setRefus(null);
    try {
      const optimise = await compressProgressPhoto(fichier);
      const form = new FormData();
      form.append("file", optimise.file);
      form.append("vue", vue);
      const res = await fetch("/api/profil/photo-morphologie", { method: "POST", body: form });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setErreur(typeof data?.error === "string" ? data.error : "Analyse impossible pour le moment.");
        return;
      }
      if (!data.analysable) {
        setRefus(data.resume ?? "Cette photo n'a pas pu être analysée.");
        return;
      }
      setResultats((prev) => [
        ...prev.filter((r) => r.vue !== vue),
        {
          vue,
          morphologieDetectee: data.morphologieDetectee ?? null,
          observationsPosture: data.observationsPosture ?? null,
          resume: data.resume ?? null,
        },
      ]);
    } catch {
      setErreur("Analyse impossible pour le moment.");
    } finally {
      setChargement(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const dejaConnu = morphologieInitiale || observationsInitiales;

  return (
    <section id="scan-morpho" className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">Diagnostic enrichi · Optionnel</p>
      <h2 className="mt-1.5 text-lg font-semibold text-white">📸 Scan morpho &amp; posture</h2>
      <p className="mt-1 text-xs leading-5 text-graphite-400">
        Deux photos en tenue de sport permettent d&apos;équilibrer ton programme selon ta posture réelle.
        Elles sont analysées puis supprimées — <strong className="font-semibold text-graphite-300">jamais conservées</strong>.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) analyser(f, vueEnCoursRef.current);
        }}
      />

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {(["face", "profil"] as Vue[]).map((vue) => {
          const fait = resultats.some((r) => r.vue === vue);
          return (
            <div
              key={vue}
              className={`rounded-xl border px-3.5 py-3 transition ${
                fait ? "border-emerald-500/30 bg-emerald-500/[0.07]" : "border-white/10 bg-white/[0.02]"
              }`}
            >
              <p className="text-sm font-semibold text-white">
                {fait ? "✓ " : ""}
                {CONSIGNES[vue].titre}
              </p>
              <ul className="mt-1.5 flex flex-col gap-0.5 text-[11px] leading-4 text-graphite-400">
                {CONSIGNES[vue].points.map((pt) => (
                  <li key={pt}>• {pt}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  vueEnCoursRef.current = vue;
                  inputRef.current?.click();
                }}
                disabled={chargement !== null}
                className="mt-2.5 w-full rounded-full border border-laiton-400/35 bg-laiton-400/10 py-2 text-[11px] font-semibold text-laiton-200 transition hover:bg-laiton-400/20 disabled:opacity-60"
              >
                {chargement === vue ? "Analyse…" : fait ? "Reprendre" : "Prendre la photo"}
              </button>
            </div>
          );
        })}
      </div>

      {erreur && <p className="mt-3 text-xs text-red-400">{erreur}</p>}
      {refus && (
        <div className="mt-3 rounded-xl border border-[#ff8a3d]/25 bg-[#ff8a3d]/[0.07] px-3.5 py-3">
          <p className="text-xs leading-5 text-[#ffb17d]">{refus}</p>
        </div>
      )}

      {resultats.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {resultats.map((r) => (
            <div key={r.vue} className="rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-laiton-300">
                {CONSIGNES[r.vue].titre}
              </p>
              {r.morphologieDetectee && (
                <p className="mt-1.5 text-xs text-graphite-200">
                  Morphologie estimée : <span className="font-semibold text-white">{r.morphologieDetectee}</span>
                </p>
              )}
              {r.observationsPosture && (
                <p className="mt-1 text-xs leading-5 text-graphite-300">{r.observationsPosture}</p>
              )}
            </div>
          ))}
          <p className="text-[10px] leading-4 text-graphite-500">
            Observations posturales utiles à ton programme — ce n&apos;est ni un diagnostic ni un avis médical.
          </p>
        </div>
      )}

      {resultats.length === 0 && dejaConnu && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-graphite-500">Analyse précédente</p>
          {morphologieInitiale && (
            <p className="mt-1.5 text-xs text-graphite-200">
              Morphologie estimée : <span className="font-semibold text-white">{morphologieInitiale}</span>
            </p>
          )}
          {observationsInitiales && (
            <p className="mt-1 text-xs leading-5 text-graphite-300">{observationsInitiales}</p>
          )}
        </div>
      )}
    </section>
  );
}
