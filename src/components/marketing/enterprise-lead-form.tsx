"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function EnterpriseLeadForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(formData: FormData) {
    setStatus("loading");
    const response = await fetch("/api/enterprise-lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData)),
    });
    setStatus(response.ok ? "success" : "error");
  }

  if (status === "success") {
    return (
      <div className="rounded-[1.75rem] border border-laiton-300/30 bg-laiton-300/[0.07] p-8 text-center">
        <h3 className="font-display text-2xl font-semibold text-white">Demande bien reçue.</h3>
        <p className="mt-3 text-sm leading-6 text-graphite-300">Anthony vous recontacte pour préparer un pilote adapté à votre organisation.</p>
      </div>
    );
  }

  const field = "mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none placeholder:text-graphite-600 focus:border-laiton-300/50";
  return (
    <form action={submit} className="rounded-[1.75rem] border border-white/[0.1] bg-white/[0.035] p-6 shadow-2xl backdrop-blur sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-graphite-200">Nom et prénom<input name="nom" required className={field} autoComplete="name" /></label>
        <label className="text-sm text-graphite-200">Entreprise<input name="entreprise" required className={field} autoComplete="organization" /></label>
      </div>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-graphite-200">Email professionnel<input name="email" required type="email" className={field} autoComplete="email" /></label>
        <label className="text-sm text-graphite-200">Téléphone<input name="telephone" required type="tel" className={field} autoComplete="tel" /></label>
      </div>
      <label className="mt-5 block text-sm text-graphite-200">Nombre de collaborateurs
        <select name="effectif" required className={field} defaultValue=""><option value="" disabled>Sélectionner</option><option>5–20</option><option>21–50</option><option>51–200</option><option>Plus de 200</option></select>
      </label>
      <label className="mt-5 block text-sm text-graphite-200">Votre priorité
        <select name="priorite" required className={field} defaultValue=""><option value="" disabled>Sélectionner</option><option>Énergie et performance</option><option>Prévention et santé</option><option>Cohésion et engagement</option><option>Accompagnement des dirigeants</option></select>
      </label>
      <Button type="submit" disabled={status === "loading"} className="mt-7 w-full py-4 text-sm font-bold uppercase tracking-[0.05em]">{status === "loading" ? "Envoi…" : "Demander une étude personnalisée"}</Button>
      {status === "error" ? <p className="mt-3 text-center text-sm text-red-300">L&apos;envoi n&apos;a pas abouti. Réessayez.</p> : null}
      <p className="mt-3 text-center text-xs text-graphite-500">Échange confidentiel · réponse personnalisée</p>
    </form>
  );
}
