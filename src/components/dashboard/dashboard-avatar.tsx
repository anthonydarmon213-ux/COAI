"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { compressProgressPhoto } from "@/lib/images/compress-progress-photo";

export function DashboardAvatar({ initialUrl, prenom }: { initialUrl: string | null; prenom: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file?: File) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const optimized = await compressProgressPhoto(file);
      const formData = new FormData();
      formData.append("file", optimized.file);
      const response = await fetch("/api/profil/avatar", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error ?? "Impossible d’ajouter la photo.");
      setUrl(data.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Impossible d’ajouter la photo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-2">
      <button type="button" onClick={() => inputRef.current?.click()} className="group relative grid h-24 w-24 place-items-center overflow-hidden rounded-full border border-laiton-300/35 bg-white/70 shadow-[0_20px_45px_-28px_rgba(85,57,20,.75)]" aria-label={url ? "Modifier ma photo" : "Ajouter ma photo"}>
        {url ? <Image src={url} alt={`Photo de ${prenom ?? "profil"}`} fill sizes="96px" className="object-cover" /> : <span className="font-display text-3xl font-semibold text-[#7c5b25]">{prenom?.slice(0, 1).toUpperCase() ?? "C"}</span>}
        <span className="absolute inset-x-0 bottom-0 bg-black/65 py-1.5 text-[9px] font-bold uppercase tracking-wider text-white opacity-0 transition group-hover:opacity-100">{loading ? "Envoi…" : "Ma photo"}</span>
      </button>
      <input ref={inputRef} type="file" accept="image/*,.heic,.heif" className="hidden" onChange={(event) => upload(event.target.files?.[0])} />
      {!url && <button type="button" onClick={() => inputRef.current?.click()} className="text-[10px] font-bold text-[#76531f] underline underline-offset-4">Ajouter ma photo</button>}
      <p className="max-w-36 text-center text-[10px] leading-4 text-[#6f746f]">Jusqu’à 40 Mo · optimisée automatiquement</p>
      {error && <p className="max-w-32 text-center text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
