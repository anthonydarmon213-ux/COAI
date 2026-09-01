"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";

type Resultat = {
  analysable: boolean;
  nomPlat: string | null;
  aliments: string[];
  caloriesEstimees: number | null;
  proteinesG: number | null;
  glucidesG: number | null;
  lipidesG: number | null;
  resume: string | null;
  conseilCoach?: string | null;
};

// Outil ponctuel (20/08/2026, demande Anthony) : prendre en photo son plat et
// obtenir une estimation macros/calories. Distinct du RepasLog existant
// (check-in repas prévu/écart) et du plan nutrition généré par l'IA — rien
// n'est enregistré ici, c'est une estimation à la demande, jamais une donnée
// de suivi durable (V1 volontairement simple).
export function AnalysePhotoRepas({ hasPaidAccess, membershipLabel }: { hasPaidAccess: boolean; membershipLabel: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  async function handleFile(file: File) {
    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setLoading(true);
    setError(null);
    setResultat(null);
    if (!hasPaidAccess) {
      setLoading(false);
      return;
    }
    try {
      const optimized = await compressProgressPhoto(file);
      const formData = new FormData();
      formData.append("file", optimized.file);
      const res = await fetch("/api/nutrition/photo-repas", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse de la photo.");
      setResultat(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-laiton-300">
          📷 Analyse ton plat
        </p>
        <span className={`rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.12em] ${hasPaidAccess ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-200" : "border-white/15 bg-white/[0.04] text-graphite-300"}`}>
          {hasPaidAccess ? membershipLabel : "COAI Free"}
        </span>
      </div>
      <p className="text-sm leading-6 text-graphite-300">
        Prends ton assiette en photo, COAI estime les calories et macros. Une estimation visuelle
        rapide, pas une mesure exacte de laboratoire.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="self-start rounded-full border border-laiton-400/40 bg-laiton-400/[0.1] px-5 py-2.5 text-sm font-semibold text-laiton-200 transition hover:bg-laiton-400/[0.16] disabled:opacity-50"
      >
        {loading ? "Analyse en cours…" : "Prendre une photo de mon plat"}
      </button>

      {previewUrl && (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-black/20 p-2.5" aria-live="polite">
          {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local d'un fichier choisi, impossible à passer par next/image */}
          <img src={previewUrl} alt="Aperçu du plat sélectionné" className="h-16 w-16 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">Aperçu de ton image</p>
            <p className="mt-0.5 text-xs text-graphite-400">
              {loading ? "Analyse en cours…" : error ? "Analyse impossible" : resultat ? "Analyse terminée" : !hasPaidAccess ? "Aperçu gratuit · analyse verrouillée" : "Image prête à analyser"}
            </p>
          </div>
        </div>
      )}

      {previewUrl && !hasPaidAccess && (
        <div className="rounded-xl border border-laiton-400/30 bg-laiton-400/[0.08] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-laiton-400/30 bg-laiton-400/10 text-laiton-200">
              <LockKeyhole size={15} aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">Analyse IA verrouillée</p>
              <p className="mt-1 text-xs leading-5 text-graphite-300">
                Ton aperçu est gratuit. L’estimation des calories, macros et le conseil COAI sont disponibles avec Premium et Elite.
              </p>
              <Link href="/pricing" className="mt-2 inline-flex text-xs font-semibold text-laiton-200 underline-offset-2 hover:underline">
                Débloquer l’analyse →
              </Link>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      {resultat && !resultat.analysable && (
        <p className="text-sm text-graphite-400">{resultat.resume ?? "Cette photo n'a pas pu être analysée."}</p>
      )}

      {resultat && resultat.analysable && (
        <div className="mt-2 flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-black/20 p-4">
          {resultat.nomPlat && <p className="text-base font-semibold text-white">{resultat.nomPlat}</p>}
          {resultat.aliments.length > 0 && (
            <p className="text-xs text-graphite-400">{resultat.aliments.join(", ")}</p>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {[
              ["Calories", resultat.caloriesEstimees, "kcal"],
              ["Protéines", resultat.proteinesG, "g"],
              ["Glucides", resultat.glucidesG, "g"],
              ["Lipides", resultat.lipidesG, "g"],
            ].map(([label, valeur, unite]) => (
              <div key={label as string} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-center">
                <strong className="block font-display text-lg text-white">{valeur ?? "—"}</strong>
                <span className="text-[10px] uppercase tracking-wide text-graphite-500">{label} {valeur !== null ? unite : ""}</span>
              </div>
            ))}
          </div>
          {resultat.conseilCoach && (
            <div className="rounded-xl border border-laiton-400/25 bg-laiton-400/[0.07] px-3.5 py-3">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-laiton-300">Le conseil du coach COAI</p>
              <p className="mt-1.5 text-xs leading-5 text-graphite-100">{resultat.conseilCoach}</p>
            </div>
          )}
          {resultat.resume && <p className="text-xs italic leading-5 text-graphite-500">{resultat.resume}</p>}
        </div>
      )}
    </div>
  );
}
