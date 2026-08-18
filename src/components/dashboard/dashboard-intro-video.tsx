"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const INTRO_PENDING_KEY = "coai_dashboard_intro_pending";

export function markDashboardIntroPending() {
  window.localStorage.setItem(INTRO_PENDING_KEY, "1");
}

export function DashboardIntroVideo() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    window.localStorage.removeItem(INTRO_PENDING_KEY);
    setVisible(false);
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem(INTRO_PENDING_KEY) !== "1") return;
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [dismiss, visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-graphite-950"
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenue dans ton espace COAI"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/videos/coai-post-diagnostic.mp4"
        autoPlay
        muted={muted}
        playsInline
        preload="auto"
        onEnded={dismiss}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />

      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-between p-5 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <p className="rounded-full border border-white/25 bg-black/25 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
            L&apos;effet COAI commence maintenant
          </p>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => { setMuted(false); void videoRef.current?.play(); }} className="rounded-full bg-white px-4 py-2.5 text-sm font-bold text-graphite-950 shadow-lg">
              {muted ? "🔊 Activer le son" : "Son activé"}
            </button>
            <button ref={closeButtonRef} type="button" onClick={dismiss} className="rounded-full border border-white/35 bg-black/55 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white hover:text-graphite-950 focus:outline-none focus:ring-2 focus:ring-white">Passer</button>
          </div>
        </div>

        <div className="mx-auto mb-3 max-w-3xl text-center text-white sm:mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/80">Diagnostic terminé</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Bienvenue dans ton espace COAI.</h2>
          <p className="mt-3 text-sm text-white/85 sm:text-base">Tes données deviennent un plan d&apos;action personnalisé.</p>
          <button
            type="button"
            onClick={dismiss}
            className="pointer-events-auto mt-6 rounded-full bg-white px-7 py-3 text-sm font-semibold text-graphite-950 shadow-xl transition hover:scale-[1.02]"
          >
            Découvrir mon dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
