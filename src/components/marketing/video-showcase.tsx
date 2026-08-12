"use client";

import { useState } from "react";

const VIDEOS = [
  { src: "/coai-presentation-7.mp4", type: "video/mp4", label: "Ton évolution commence ici" },
  { src: "/coai-presentation-2.mp4", type: "video/mp4", label: "Une autre facette de COAI" },
  { src: "/coai-presentation-8.mp4", type: "video/mp4", label: "Découvre l'expérience COAI" },
] as const;

export function VideoShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeVideo = VIDEOS[activeIndex] ?? VIDEOS[0];

  const selectVideo = (index: number) => {
    setActiveIndex(index);
  };

  const showPrevious = () => {
    setActiveIndex((current) => (current === 0 ? VIDEOS.length - 1 : current - 1));
  };

  const showNext = () => {
    setActiveIndex((current) => (current === VIDEOS.length - 1 ? 0 : current + 1));
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="overflow-hidden rounded-3xl border border-laiton-400/20 bg-black shadow-[0_30px_90px_-45px_rgba(201,162,98,0.5)]">
        <video
          key={activeVideo.src}
          controls
          playsInline
          preload="metadata"
          className="aspect-video w-full bg-black object-contain"
          aria-label={`${activeVideo.label}, vidéo ${activeIndex + 1} sur ${VIDEOS.length}`}
        >
          <source src={activeVideo.src} type={activeVideo.type} />
          Ton navigateur ne peut pas lire cette vidéo. Découvre COAI avec le diagnostic offert.
        </video>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={showPrevious}
          className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-laiton-400/50 hover:text-laiton-200"
          aria-label="Vidéo précédente"
        >
          ←
        </button>

        <div className="min-w-0 text-center">
          <p className="truncate text-sm font-semibold text-white">{activeVideo.label}</p>
          <p className="mt-1 text-xs text-graphite-400">Vidéo {activeIndex + 1} sur {VIDEOS.length}</p>
        </div>

        <button
          type="button"
          onClick={showNext}
          className="shrink-0 rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-laiton-400/50 hover:text-laiton-200"
          aria-label="Vidéo suivante"
        >
          →
        </button>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Choisir une vidéo">
        {VIDEOS.map((video, index) => (
          <button
            key={video.src}
            type="button"
            onClick={() => selectVideo(index)}
            aria-label={`Afficher la vidéo ${index + 1} : ${video.label}`}
            aria-pressed={index === activeIndex}
            className={`h-2.5 rounded-full transition-all ${
              index === activeIndex
                ? "w-8 bg-laiton-400"
                : "w-2.5 bg-white/25 hover:bg-white/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
