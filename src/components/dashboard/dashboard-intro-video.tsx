"use client";

import { useState } from "react";

// Compatibility with onboarding callers: no automatic overlay or storage.
export function markDashboardIntroPending() {}

export function DashboardIntroVideo() {
  const [open, setOpen] = useState(false);
  return <details className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"
    onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="min-h-11 cursor-pointer text-sm font-semibold text-graphite-200">Découvrir COAI en vidéo</summary>
    {open && <video className="mt-3 max-h-[65vh] w-full rounded-xl bg-black"
      src="/videos/coai-post-diagnostic.mp4" controls playsInline preload="none"
      aria-label="Présentation de COAI" />}
  </details>;
}
