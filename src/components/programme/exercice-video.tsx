"use client";

import { useEffect, useRef, useState } from "react";
import { urlVideoCoai, videoCoaiPourNom } from "@/lib/exercices/videos-coai";

export function ExerciceVideo({ nom, className = "" }: { nom: string; className?: string }) {
  const conteneurRef = useRef<HTMLElement>(null);
  const [procheEcran, setProcheEcran] = useState(false);
  const video = videoCoaiPourNom(nom);

  useEffect(() => {
    const element = conteneurRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entree]) => {
        if (entree?.isIntersecting) {
          setProcheEcran(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (!video) return null;

  return (
    <figure ref={conteneurRef} className={`overflow-hidden rounded-lg border border-cyan-300/20 bg-black ${className}`}>
      {procheEcran ? (
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
      ) : (
        <div className="flex h-44 items-center justify-center bg-[radial-gradient(circle_at_center,rgba(34,211,238,.12),transparent_58%),#050607] font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-200/60">
          Démonstration COAI
        </div>
      )}
      <figcaption className="border-t border-white/[0.06] px-2.5 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-200/80">
        Démonstration COAI · {video.description}
      </figcaption>
    </figure>
  );
}
