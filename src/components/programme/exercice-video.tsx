"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { urlPosterVideoCoai, urlVideoCoai, videoCoaiPourNom } from "@/lib/exercices/videos-coai";

export function ExerciceVideo({ nom, className = "" }: { nom: string; className?: string }) {
  const conteneurRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [procheEcran, setProcheEcran] = useState(false);
  // Safari peut refuser la lecture automatique sans jamais lever d'erreur ni
  // emettre canplay : on surveille donc l'avancee reelle de currentTime plutot
  // que de faire confiance aux evenements.
  const [bloquee, setBloquee] = useState(false);
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
    const promesse = element.play();
    if (promesse) promesse.then(() => setBloquee(false)).catch(() => setBloquee(true));
  }, []);

  // Chien de garde : si l'image n'a pas avance, la lecture n'a pas demarre.
  useEffect(() => {
    if (!procheEcran) return;
    lancer();
    const element = videoRef.current;
    if (!element) return;
    const depart = element.currentTime;
    const minuteur = window.setTimeout(() => {
      if (element.paused || element.currentTime === depart) setBloquee(true);
    }, 1200);
    return () => window.clearTimeout(minuteur);
  }, [procheEcran, lancer]);

  const basculer = useCallback(() => {
    const element = videoRef.current;
    if (!element) return;
    if (element.paused) lancer();
    else element.pause();
  }, [lancer]);

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
            preload="auto"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={lancer}
            onCanPlay={lancer}
            onPlaying={() => setBloquee(false)}
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
        <button
          type="button"
          onClick={basculer}
          className={`absolute inset-0 flex items-center justify-center transition ${
            bloquee ? "bg-black/35 hover:bg-black/20" : "bg-transparent"
          }`}
          aria-label={`Lire ou mettre en pause : ${video.description}`}
        >
          {bloquee ? (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-300/60 bg-black/70 pl-1 text-cyan-200">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          ) : null}
        </button>
      </div>
      <figcaption className="border-t border-white/[0.06] px-2.5 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-200/80">
        Démonstration COAI · {video.description}
      </figcaption>
    </figure>
  );
}
