"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "success" | "error";

export function VipApplicationForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function submit(formData: FormData) {
    setStatus("loading");
    const response = await fetch("/api/vip-application", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    setStatus(response.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="rounded-[1.75rem] border border-laiton-300/30 bg-laiton-300/[0.07] px-7 py-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-laiton-300/35 text-laiton-200">✓</span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-white">Ta candidature est bien reçue.</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-graphite-300">
          Anthony étudie ton objectif et te contacte personnellement si l&apos;accompagnement est adapté.
        </p>
      </div>
    );
  }

  const inputClass = "mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-graphite-600 focus:border-laiton-300/50 focus:bg-white/[0.065]";

  return (
    <form action={submit} className="rounded-[1.75rem] border border-white/[0.1] bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-graphite-200">
          Prénom
          <input name="prenom" required maxLength={80} autoComplete="given-name" className={inputClass} placeholder="Ton prénom" />
        </label>
        <label className="text-sm font-medium text-graphite-200">
          Téléphone
          <input name="telephone" required type="tel" autoComplete="tel" className={inputClass} placeholder="+33 6 00 00 00 00" />
        </label>
      </div>
      <label className="mt-5 block text-sm font-medium text-graphite-200">
        Email
        <input name="email" required type="email" autoComplete="email" className={inputClass} placeholder="toi@exemple.fr" />
      </label>
      <label className="mt-5 block text-sm font-medium text-graphite-200">
        Quel résultat veux-tu obtenir dans les 90 prochains jours ?
        <textarea name="objectif" required minLength={20} maxLength={1000} rows={4} className={`${inputClass} resize-none`} placeholder="Décris ton objectif et ce qui t'empêche de l'atteindre aujourd'hui…" />
      </label>
      <label className="mt-5 block text-sm font-medium text-graphite-200">
        Quel niveau d&apos;investissement envisages-tu pour être accompagné ?
        <select name="budget" required className={inputClass} defaultValue="">
          <option value="" disabled>Sélectionner</option>
          <option value="2500-4000">2 500 à 4 000 €</option>
          <option value="4000-7000">4 000 à 7 000 €</option>
          <option value="7000+">Plus de 7 000 €</option>
          <option value="a-definir">Je souhaite d&apos;abord en parler</option>
        </select>
      </label>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-graphite-400">
        <input name="consent" type="checkbox" required className="mt-1 accent-[#c9a262]" />
        <span>J&apos;accepte d&apos;être contacté au sujet de ma demande. Mes informations ne sont jamais revendues.</span>
      </label>
      <Button type="submit" disabled={status === "loading"} className="mt-7 w-full py-4 text-sm font-bold uppercase tracking-[0.05em]">
        {status === "loading" ? "Envoi en cours…" : "Déposer ma candidature privée"}
      </Button>
      {status === "error" ? <p className="mt-3 text-center text-sm text-red-300">L&apos;envoi n&apos;a pas abouti. Vérifie les informations et réessaie.</p> : null}
      <p className="mt-3 text-center text-xs text-graphite-500">Candidature sans engagement · réponse personnelle</p>
    </form>
  );
}
