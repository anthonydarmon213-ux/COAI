"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Hero (16/08/2026, demande explicite d'Anthony : "hero avec cette photo")
// — le visuel diagnostic (déjà utilisé plus bas sur la page avant cette
// session) devient l'image principale du hero : il porte déjà son propre
// message ("Quel programme te correspond vraiment ?", "Diagnostic COAI
// offert"), donc pas de titre COAI dupliqué par-dessus — juste un vrai CTA
// cliquable (l'image dit "Lien dans la bio", qui ne mène nulle part ici) et
// les offres affichées tout de suite en dessous.
export function CoaiIntro() {
  return (
    <section className="coai-future-hero coai-landing-hero relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden px-6 pb-14 pt-28 text-center sm:pb-20 sm:pt-32">
      <div className="coai-future-architecture" aria-hidden="true" />
      <div className="coai-future-horizon" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-one animate-spin-slow" aria-hidden="true" />
      <div className="coai-future-ring coai-future-ring-two animate-spin-slow" aria-hidden="true" style={{ animationDirection: "reverse", animationDuration: "70s" }} />
      <div className="coai-hero-accent-glow" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/[0.1] shadow-2xl animate-reveal">
        <div className="relative aspect-square w-full">
          <Image
            src="/coai-diagnostic.JPEG"
            alt="Quel programme te correspond vraiment ? Diagnostic COAI offert."
            fill
            priority
            sizes="(min-width: 672px) 42rem, 100vw"
            className="object-cover"
          />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-3 animate-reveal" style={{ animationDelay: "120ms" }}>
        <Link href="/diagnostic" className="relative">
          <span
            className="animate-halo-blink pointer-events-none absolute -inset-3 -z-10 rounded-full bg-laiton-400 blur-2xl"
            aria-hidden="true"
          />
          <Button className="px-9 py-4 text-base font-bold uppercase tracking-[0.04em] shadow-[0_25px_70px_-18px_rgba(201,162,98,0.95)]">
            <span>Découvrir mon potentiel — Diagnostic offert</span>
          </Button>
        </Link>
        <span className="text-sm font-medium text-graphite-500">2 min · gratuit · sans engagement</span>
      </div>

      {/* Nos offres, directement visibles (demande explicite d'Anthony,
          référence Future : le prix n'est jamais caché derrière un clic). */}
      <div className="relative z-10 flex w-full max-w-4xl flex-col items-center gap-4 animate-reveal" style={{ animationDelay: "240ms" }}>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-graphite-500">
          Diagnostic offert <span className="text-laiton-300">→</span> choisis ton coach et ta formule
        </p>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/pricing#impulsion"
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-5 py-4 text-left backdrop-blur-md transition hover:border-white/20"
          >
            <p className="text-sm font-semibold text-white">Impulsion — 19€</p>
            <p className="mt-1 text-xs leading-5 text-graphite-400">
              Programme généré par l&apos;algorithme, en un seul paiement.
            </p>
          </Link>
          <Link
            href="/pricing#transformation"
            className="rounded-2xl border border-laiton-400/25 bg-laiton-400/[0.06] px-5 py-4 text-left backdrop-blur-md transition hover:border-laiton-400/50"
          >
            <p className="text-sm font-semibold text-laiton-200">Transformation — 49€/mois</p>
            <p className="mt-1 text-xs leading-5 text-graphite-400">
              L&apos;IA génère, un coach diplômé d&apos;État valide et te suit — hybride.
            </p>
          </Link>
          <Link
            href="/pricing#vip"
            className="rounded-2xl border border-acier/25 bg-acier/[0.06] px-5 py-4 text-left backdrop-blur-md transition hover:border-acier/50"
          >
            <p className="text-sm font-semibold text-[#a9c6d4]">VIP — sur réservation</p>
            <p className="mt-1 text-xs leading-5 text-graphite-400">
              Coaching 100% humain avec Anthony Darmon, présentiel ou visio.
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}
