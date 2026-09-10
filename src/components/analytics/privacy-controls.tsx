"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "./google-analytics";
import { MetaPixel } from "./meta-pixel";
import { CONSENT_EVENT, CONSENT_KEY, PrivacyChoices, REFUSE_ALL, readConsent, saveConsent } from "@/lib/analytics/consent";
import { captureUtmFromLocation, clearUtmCookie } from "@/lib/attribution/utm-cookie";
import { isProductionAnalyticsOrigin } from "@/lib/analytics/production-origin";

// No optional script during SSR or before a stored, unexpired choice is read.
// Clarity is deliberately not mounted: session replay needs a separate review
// of sensitive health screens; an audience choice is not sufficient for that.
export function PrivacyControls() {
  const pathname = usePathname();
  // Authentication must remain usable without answering an optional consent prompt.
  // The root layout renders this panel after the page, so normal flow never
  // covers the form, including on small screens or with enlarged text.
  const inline = ["/sign-in", "/sign-up", "/mot-de-passe-oublie", "/reinitialiser-mot-de-passe"].includes(pathname);
  const [choices, setChoices] = useState<PrivacyChoices | null>(null);
  const [draft, setDraft] = useState<PrivacyChoices>(REFUSE_ALL);
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState(false);
  const [error, setError] = useState(false);
  const active = useRef<PrivacyChoices | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const sync = () => {
      const next = readConsent();
      // Removing a script node does NOT stop its already running library.
      // Reload on withdrawal/expiry, including a change from another tab.
      const revoked = (active.current?.audience && !next?.audience) || (active.current?.marketing && !next?.marketing);
      if (!next?.marketing) clearUtmCookie();
      if (revoked) {
        window.location.reload();
        return;
      }
      if (initialized.current && JSON.stringify(active.current) === JSON.stringify(next)) return;
      initialized.current = true;
      active.current = next;
      setChoices(next);
      setDraft(next ?? REFUSE_ALL);
      setOpen(!next);
      if (next?.marketing) captureUtmFromLocation();
    };
    const storage = (event: StorageEvent) => { if (!event.key || event.key === CONSENT_KEY) sync(); };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    window.addEventListener("storage", storage);
    window.addEventListener("focus", sync);
    const timer = window.setInterval(sync, 60000);
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync);
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", sync);
      window.clearInterval(timer);
    };
  }, []);

  function choose(next: PrivacyChoices) {
    if (!saveConsent(next)) {
      setError(true);
      return;
    }
    setError(false);
    setOpen(false);
  }

  return <>
    {choices?.audience && isProductionAnalyticsOrigin() && <><GoogleAnalytics /><Analytics /></>}
    {choices?.marketing && isProductionAnalyticsOrigin() && <MetaPixel />}
    {open ? <section aria-label="Préférences de confidentialité" className={`${inline ? "relative mx-3 mb-6 sm:mx-auto" : "fixed inset-x-3 bottom-3 z-[100] mx-auto max-h-[75dvh] overflow-y-auto"} max-w-xl rounded-2xl border border-white/20 bg-[#101b23] p-5 text-white shadow-2xl`}>
      <h2 className="text-lg font-semibold">Tes choix de confidentialité</h2>
      <p className="mt-2 text-sm text-slate-300">Autoriser la mesure d’audience (Google, Vercel) et l’attribution publicitaire (Meta, COAI) ? Le bilan et les séances restent accessibles si tu refuses.</p>
      {details && <><label className="mt-3 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.audience} onChange={event => setDraft({ ...draft, audience: event.target.checked })} />Mesure d’audience — Google Analytics et Vercel</label>
      <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={draft.marketing} onChange={event => setDraft({ ...draft, marketing: event.target.checked })} />Publicité et attribution des campagnes — Meta et COAI</label>
      <p className="mt-2 text-xs text-slate-300">Les outils nécessaires à la connexion restent actifs. Retirer un accord recharge cette page pour arrêter les outils déjà chargés.</p></>}
      <p className="mt-2 text-xs text-slate-300">Choix conservé 6 mois, modifiable à tout moment.</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => choose(REFUSE_ALL)} className="min-h-11 rounded-xl border border-white/40 px-3 py-2 font-semibold">Tout refuser</button>
        <button type="button" onClick={() => choose({ audience: true, marketing: true })} className="min-h-11 rounded-xl border border-white/40 px-3 py-2 font-semibold">Tout accepter</button>
      </div>
      {details ? <button type="button" onClick={() => choose(draft)} className="mt-2 min-h-11 w-full rounded-xl bg-[#e0bd59] px-3 py-2 font-semibold text-black">Enregistrer mes choix</button> : <button type="button" onClick={() => setDetails(true)} className="mt-2 min-h-11 px-3 text-sm underline">Personnaliser</button>}
      <a href="/confidentialite" className="inline-block px-3 py-3 text-sm underline">En savoir plus</a>
      {error && <p role="alert" className="mt-2 text-sm">Ton navigateur bloque l’enregistrement. Tes choix précédents restent inchangés ; sans accord enregistré, aucun suivi facultatif ne démarre. <button type="button" className="underline" onClick={() => setOpen(false)}>Fermer</button></p>}
    </section> : <div className="px-3 pb-24 pt-3 text-center"><button type="button" onClick={() => { setDraft(readConsent() ?? REFUSE_ALL); setDetails(true); setOpen(true); }} className="min-h-11 rounded-full border border-white/20 bg-[#101b23] px-3 text-xs text-white">Confidentialité</button></div>}
  </>;
}
