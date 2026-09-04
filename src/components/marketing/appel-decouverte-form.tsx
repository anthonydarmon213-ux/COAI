"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "loading" | "success" | "error";

// Formulaire de demande d'appel decouverte (04/09/2026, demande Anthony :
// « fais le formulaire ou le WhatsApp »). Modele charlesdenis.fr : telephone,
// prenom, nom, puis un creneau — aucun prix affiche avant l'appel.
//
// Champs limites au strict necessaire pour rappeler quelqu'un : chaque champ
// ajoute fait abandonner une partie des visiteurs, et un prospect froid n'a
// aucune raison de remplir un questionnaire. La fourchette de budget du
// formulaire VIP est volontairement absente ici — la demander avant d'avoir
// montre le moindre tarif serait le meilleur moyen de ne recevoir personne.
export function AppelDecouverteForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function submit(formData: FormData) {
    setStatus("loading");
    try {
      const response = await fetch("/api/appel-decouverte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-[1.75rem] border border-laiton-300/30 bg-laiton-300/[0.07] px-7 py-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-laiton-300/35 text-laiton-200">
          ✓
        </span>
        <h2 className="mt-5 font-display text-2xl font-semibold text-white">
          C&apos;est noté, ta demande est bien arrivée.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-graphite-300">
          Anthony te rappelle personnellement pour fixer le créneau. En attendant, tu peux
          déjà faire ton bilan forme offert — il servira de base à votre échange.
        </p>
        <a
          href="/diagnostic"
          className="mt-6 inline-flex rounded-full border border-laiton-300/40 px-6 py-3 text-sm font-semibold text-laiton-100 transition hover:bg-laiton-300/[0.08]"
        >
          Faire mon bilan forme offert →
        </a>
      </div>
    );
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/[0.1] bg-white/[0.045] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-graphite-600 focus:border-laiton-300/50 focus:bg-white/[0.065]";

  return (
    <form
      action={submit}
      className="rounded-[1.75rem] border border-white/[0.1] bg-white/[0.035] p-6 shadow-2xl backdrop-blur-xl sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-graphite-200">
          Prénom
          <input name="prenom" required maxLength={80} autoComplete="given-name" className={inputClass} placeholder="Ton prénom" />
        </label>
        <label className="text-sm font-medium text-graphite-200">
          Nom
          <input name="nom" required maxLength={80} autoComplete="family-name" className={inputClass} placeholder="Ton nom" />
        </label>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-medium text-graphite-200">
          Téléphone
          <input name="telephone" required type="tel" autoComplete="tel" className={inputClass} placeholder="+33 6 00 00 00 00" />
        </label>
        <label className="text-sm font-medium text-graphite-200">
          Email
          <input name="email" required type="email" autoComplete="email" className={inputClass} placeholder="toi@exemple.fr" />
        </label>
      </div>

      <label className="mt-5 block text-sm font-medium text-graphite-200">
        Où tu en es, et ce que tu veux changer
        <textarea
          name="objectif"
          required
          minLength={10}
          maxLength={1000}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder="Ton objectif, ton temps disponible, ce qui bloque aujourd'hui…"
        />
      </label>

      <label className="mt-5 block text-sm font-medium text-graphite-200">
        Quand es-tu joignable ?
        <select name="disponibilite" required className={inputClass} defaultValue="">
          <option value="" disabled>
            Sélectionner
          </option>
          <option value="matin">Le matin</option>
          <option value="midi">Sur la pause déjeuner</option>
          <option value="soir">En fin de journée</option>
          <option value="peu-importe">Peu importe, appelle-moi</option>
        </select>
      </label>

      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-graphite-400">
        <input name="consent" type="checkbox" required className="mt-1 accent-[#c9a262]" />
        <span>
          J&apos;accepte d&apos;être contacté au sujet de ma demande. Mes informations ne sont jamais
          revendues.
        </span>
      </label>

      <Button type="submit" disabled={status === "loading"} className="mt-7 w-full py-4 text-sm font-bold uppercase tracking-[0.05em]">
        {status === "loading" ? "Envoi en cours…" : "Demander mon appel découverte →"}
      </Button>

      {status === "error" && (
        <p className="mt-3 text-center text-sm text-red-300">
          L&apos;envoi n&apos;a pas abouti. Vérifie tes informations et réessaie.
        </p>
      )}

      <p className="mt-3 text-center text-xs text-graphite-500">
        Sans engagement · rappel personnel par Anthony
      </p>
    </form>
  );
}
