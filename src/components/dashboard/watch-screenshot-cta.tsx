"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";

type Extraction = {
  pasMoyenParJour: number | null;
  frequenceCardiaqueRepos: number | null;
  sommeilMoyenHeures: number | null;
  vo2Max: number | null;
  caloriesMoyennesParJour: number | null;
  resumeMontre: string | null;
};

// Mise en avant de la fonction d'analyse de screenshot de montre connectée
// directement sur le dashboard — jusqu'ici la fonction n'était visible qu'en
// bas de la page profil, quasi invisible pour un nouvel utilisateur.
export function WatchScreenshotCta() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<Extraction | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);
    setResultat(null);
    try {
      const optimized = await compressProgressPhoto(file);
      const formData = new FormData();
      formData.append("file", optimized.file);
      const res = await fetch("/api/profil/montre", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Échec de l'analyse du screenshot.");
      setResultat({
        pasMoyenParJour: data.pasMoyenParJour ?? null,
        frequenceCardiaqueRepos: data.frequenceCardiaqueRepos ?? null,
        sommeilMoyenHeures: data.sommeilMoyenHeures ?? null,
        vo2Max: data.vo2Max ?? null,
        caloriesMoyennesParJour: data.caloriesMoyennesParJour ?? null,
        resumeMontre: data.resumeMontre ?? null,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group relative flex flex-col gap-2 overflow-hidden rounded-lg border border-laiton-400/30 bg-laiton-400/[0.06] p-5">
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-laiton-500/15 blur-2xl transition group-hover:bg-laiton-500/25" />
      <span className="font-mono text-xs uppercase tracking-widest text-laiton-400">
        Nouveau · Bracelet connecté
      </span>
      <p className="text-sm text-graphite-200">
        Envoie un screenshot de ton bracelet ou app santé (Apple Watch, Garmin, Fitbit, Samsung
        Health...) — l&apos;IA en extrait tes données (pas, fréquence cardiaque, sommeil, VO2 max)
        pour affiner ton programme, automatiquement.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        className="hidden"
        disabled={loading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-graphite-500">Jusqu’à 40 Mo · optimisation 4K automatique.</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="mt-1 inline-flex w-fit items-center gap-2 rounded-lg bg-laiton-400 px-4 py-2 text-sm font-medium text-graphite-950 transition hover:bg-laiton-300 disabled:opacity-60"
      >
        {loading ? "Analyse en cours…" : "Analyser un screenshot"}
      </button>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {resultat && (
        <div className="mt-1 flex flex-col gap-1 text-sm text-graphite-300">
          {resultat.pasMoyenParJour != null && (
            <p>Pas moyen/jour : {resultat.pasMoyenParJour.toLocaleString("fr-FR")}</p>
          )}
          {resultat.frequenceCardiaqueRepos != null && (
            <p>Fréquence cardiaque de repos : {resultat.frequenceCardiaqueRepos} bpm</p>
          )}
          {resultat.sommeilMoyenHeures != null && <p>Sommeil moyen : {resultat.sommeilMoyenHeures} h</p>}
          {resultat.vo2Max != null && <p>VO2 max : {resultat.vo2Max}</p>}
          {resultat.caloriesMoyennesParJour != null && (
            <p>Calories moyennes/jour : {resultat.caloriesMoyennesParJour}</p>
          )}
          {resultat.resumeMontre && <p className="italic text-graphite-400">{resultat.resumeMontre}</p>}
          <p className="mt-1 text-xs text-graphite-500">
            Enregistré dans ton profil — pris en compte à la prochaine génération de programme.
          </p>
        </div>
      )}
    </div>
  );
}
