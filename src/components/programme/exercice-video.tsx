"use client";

import { urlVideoCoai, videoCoaiPourNom } from "@/lib/exercices/videos-coai";

export function ExerciceVideo({ nom, className = "" }: { nom: string; className?: string }) {
  const video = videoCoaiPourNom(nom);
  if (!video) return null;

  return (
    <figure className={`overflow-hidden rounded-lg border border-cyan-300/20 bg-black ${className}`}>
      <video
        className="h-44 w-full bg-black object-contain"
        src={urlVideoCoai(video.fichier)}
        preload="metadata"
        autoPlay
        muted
        loop
        playsInline
        aria-label={`Démonstration réelle : ${video.description}`}
      />
      <figcaption className="border-t border-white/[0.06] px-2.5 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-200/80">
        Démonstration COAI · {video.description}
      </figcaption>
    </figure>
  );
}
