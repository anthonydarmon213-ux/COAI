"use client";

import { useRef, useState } from "react";
import { urlPosterVideoCoai, urlVideoCoai, videoCoaiPourNom } from "@/lib/exercices/videos-coai";

export function ExerciceVideo({ nom, className = "" }: { nom: string; className?: string }) {
  const video = videoCoaiPourNom(nom);
  if (!video) return null;
  return <LecteurVideo key={video.fichier} video={video} className={className} />;
}

function LecteurVideo({ video, className }: {
  video: NonNullable<ReturnType<typeof videoCoaiPourNom>>;
  className: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [erreur, setErreur] = useState(false);

  function reessayer() {
    const element = videoRef.current;
    if (!element) return;
    setErreur(false);
    element.load();
    // Keep play() inside the user gesture required by WKWebView.
    void element.play().catch(() => setErreur(true));
  }

  return (
    <figure className={`overflow-hidden rounded-lg border border-cyan-300/20 bg-black ${className}`}>
      {/* Native controls work without IntersectionObserver or hydration.
          No overlay intercepts taps; the catalogue does not autoplay videos. */}
          <video
            ref={videoRef}
            className="h-44 w-full bg-black object-contain"
            src={urlVideoCoai(video.fichier)}
            poster={urlPosterVideoCoai(video.fichier)}
            preload="none"
            controls
            playsInline
            onError={() => setErreur(true)}
            onPlaying={() => setErreur(false)}
            aria-label={`Démonstration réelle : ${video.description}`}
          >
            <a href={urlVideoCoai(video.fichier)}>Ouvrir la vidéo de démonstration</a>
          </video>
      {erreur && (
        <div role="status" className="space-y-2 px-3 py-3 text-sm text-graphite-200">
          <p>La vidéo n’a pas pu démarrer. Vérifie ta connexion puis réessaie.</p>
          <button type="button" onClick={reessayer} className="rounded-lg border border-cyan-300/40 px-3 py-2 text-cyan-200">
            Réessayer la vidéo
          </button>
        </div>
      )}
      <figcaption className="border-t border-white/[0.06] px-2.5 py-1.5 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-cyan-200/80">
        Démonstration COAI · {video.description}
        <span className="mt-1 block normal-case tracking-normal">Appuie sur lecture pour voir le mouvement.</span>
      </figcaption>
    </figure>
  );
}
