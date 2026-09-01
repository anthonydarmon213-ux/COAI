"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { trackFunnelEvent } from "@/lib/analytics/funnel-events";

type LeadCtaLinkProps = {
  placement: string;
  children: ReactNode;
  className?: string;
};

export function LeadCtaLink({ placement, children, className }: LeadCtaLinkProps) {
  return (
    <Link
      href="/diagnostic"
      onClick={() => trackFunnelEvent("landing_cta_clicked", { placement })}
      className={`inline-flex min-h-12 items-center justify-center rounded-full bg-laiton-400 px-6 py-3 text-sm font-bold uppercase tracking-[0.055em] text-graphite-950 transition hover:bg-laiton-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${className ?? ""}`}
    >
      {children}
    </Link>
  );
}

export function MobileLeadBar() {
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-graphite-950/95 px-4 py-3 shadow-[0_-20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">Ton bilan personnalisé offert</p>
          <p className="text-xs text-white/55">5 min · sans carte bancaire</p>
        </div>
        <LeadCtaLink placement="mobile_sticky" className="min-h-11 shrink-0 px-5 py-2.5 text-xs">
          Commencer
        </LeadCtaLink>
      </div>
    </div>
  );
}
