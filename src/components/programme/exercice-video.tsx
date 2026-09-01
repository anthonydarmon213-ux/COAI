"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { urlPosterVideoCoai, urlVideoCoai, videoCoaiPourNom } from "@/lib/exercices/videos-coai";

export function ExerciceVideo({ nom, className = "" }: { nom: string; className?: string }) {
  const conteneurRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [procheEcran, setProcheEcran] = useState(false);
  // Safari (lecture auto désactivée, économie d'énergie) rejette play() : sans
  // repli l'utilisateur voit un cadre noir sans aucun moyen de le lancer.
  const [autoplayRefuse, setAutoplayRefuse] = useState(false);
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

  const lancer = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    element.play().then(
      () => setAutoplayRefuse(false),
      () => setAutoplayRefuse(true)
    );
  }, []);

  if (!video) return null;

  return (
    <figure ref={conteneurRef} className={`overflow-hidden rounded-lg border border-cyan-300/20 bg-black ${className}`}>
      <div className="relative">
        {procheEcran ? (
          <video
            ref={videoRef}
            className="h-44 w-full bg-black object-contain"
            src={urlVideoCoai(video.fichier)}
            poster={urlPosterVideoCoai(video.fichier)}
            preload="metadata"
            autoPlay
            muted
            loop
            playsInline
            onCanPlay={lancer}
            aria-label={`Démonstration réelle : ${video.description}`}
          />
        ) : (
          <img
            className="h-44 w-full bg-black object-contain"
            src={urlPosterVideoCoai(video.fichier)}
            alt={`Démonstration COAI : ${video.description}`}
            loading="lazy"
          />
        )}
        {autoplayRefuse ? (
          <button
            type="button"
            onClick={lancer}
            className="absolute inset-0 flex items-center justify-center bg-black/35 transition hover:bg-black/20"
            aria-label={`Lancer la démonstration : ${video.description}`}
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/60 bg-black/70 pl-1 text-cyan-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        ) : null}
      </div>
      <figcaption className="border-t border-white/[0.06] px-2.5 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-200/80">
        Démonstration COAI · {video.description}
      </figcaption>
    </figure>
  );
}
