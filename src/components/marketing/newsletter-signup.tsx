"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionLabel } from "@/components/ui/section-label";
import { readUtmCookie } from "@/lib/attribution/utm-cookie";

const THEMES = [
  "Entraînement",
  "Nutrition",
  "Récupération",
  "Routines courtes",
  "Progression coachée",
  "Motivation long terme",
];

const OFFRES = [
  "Pass IA",
  "Coaching Hybride",
  "VIP",
  "Programmes personnalisés",
  "Plans nutrition / récupération",
];

type Status = "idle" | "loading" | "success" | "error";

type NewsletterPayload = {
  prenom?: string;
  email: string;
  objectif: string;
  themes: string[];
  offresInteressees: string[];
  consentMarketing: true;
};

const consentError = "Tu dois accepter de recevoir nos conseils pour valider ton inscription.";

export function NewsletterSignupSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setStatus("loading");
    setMessage("");

    const themes = formData.getAll("themes").map((item) => String(item));
    const offresInteressees = formData
      .getAll("offresInteressees")
      .map((item) => String(item));

    if (themes.length < 1) {
      setStatus("error");
      setMessage("Choisis au moins 1 thème qui t'intéresse.");
      return;
    }

    const consentMarketing = formData.get("consentMarketing") === "on";
    if (!consentMarketing) {
      setStatus("error");
      setMessage(consentError);
      return;
    }

    const payload: NewsletterPayload = {
      prenom: String(formData.get("prenom") || "").trim() || undefined,
      email: String(formData.get("email") || ""),
      objectif: String(formData.get("objectif") || "").trim() || "",
      themes,
      offresInteressees,
      consentMarketing: true,
    };

    const utm = readUtmCookie();

    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        ...utm,
      }),
    });

    setStatus(response.ok ? "success" : "error");
    if (!response.ok) {
      setMessage("Je n'ai pas réussi à enregistrer ton inscription. Réessaie en 1 minute.");
    } else {
      setMessage("");
    }
  }

  if (status === "success") {
    return (
      <section id="newsletter" className="mx-auto mt-16 w-full max-w-6xl px-6 pb-16 sm:px-10">
        <div className="coai-newsletter-panel coai-newsletter-panel-success rounded-[2rem] border border-laiton-300/30 bg-laiton-300/[0.07] p-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-laiton-300">Newsletter COAI</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold text-white sm:text-4xl">C&apos;est confirmé.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-graphite-200">
            Merci ! Tu reçois ta première ressource dès maintenant et la suite te montre exactement comment progresser sans te perdre.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/pricing" className="inline-flex rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:border-laiton-300/60 hover:text-laiton-200">
              Découvrir les accompagnements
            </Link>
            <Link href="/diagnostic" className="inline-flex rounded-full bg-laiton-400 px-6 py-3 text-sm font-semibold text-graphite-950 transition hover:bg-laiton-300">
              Faire un bilan gratuit
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-graphite-50 placeholder:text-graphite-500 outline-none transition focus:border-laiton-300/50 focus:bg-white/[0.08]";

  return (
    <section id="newsletter" className="mx-auto mt-16 w-full max-w-6xl px-6 pb-16 sm:px-10">
      <div className="coai-newsletter-panel rounded-[2rem] border border-white/[0.12] bg-white/[0.035] p-6 shadow-2xl sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <SectionLabel>Newsletter COAI</SectionLabel>
            <h2 className="mt-5 font-display text-3xl font-semibold leading-tight tracking-[-0.035em] text-white sm:text-4xl">
              De la vraie valeur, chaque semaine.
            </h2>
            <p className="mt-4 text-sm leading-7 text-graphite-300">
              Des conseils pratiques pour progresser immédiatement (entraînement, nutrition, récupération), et 1 page dédiée par mois sur
              nos services : Pass IA, Coaching Hybride, VIP.
            </p>
            <ul className="mt-8 grid gap-3 text-sm text-graphite-200">
              <li><strong className="text-white">Bilan offert :</strong> ton point de départ COAI avant ton premier plan.</li>
              <li><strong className="text-white">Programmes :</strong> routines de 30/45 min, progressions et variantes.</li>
              <li><strong className="text-white">Services :</strong> nutrition, coaching & reprise de rythme.</li>
            </ul>
            <p className="mt-6 text-sm text-graphite-400">
              Objectif : avancer plus vite avec moins de bruit, et savoir exactement quand passer à l&apos;action.
            </p>
          </div>

          <form action={submit} className="rounded-[1.5rem] border border-white/12 bg-[#0f1012]/80 p-5 sm:p-6">
            <label className="block text-sm text-graphite-200">
              Prénom (facultatif)
              <Input name="prenom" className={fieldClass} maxLength={80} autoComplete="given-name" placeholder="Ton prénom" />
            </label>
            <label className="mt-4 block text-sm text-graphite-200">
              Email
              <Input name="email" required type="email" className={fieldClass} autoComplete="email" placeholder="toi@exemple.fr" />
            </label>
            <label className="mt-4 block text-sm text-graphite-200">
              Quel est ton objectif du moment ? (facultatif)
              <Input name="objectif" maxLength={180} className={fieldClass} placeholder="Perdre du gras, gagner en force…" />
            </label>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-graphite-200">Ce que tu veux améliorer (au moins 1)</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {THEMES.map((theme) => (
                  <label key={theme} className="flex items-center gap-2 text-xs text-graphite-300">
                    <input name="themes" value={theme} type="checkbox" className="h-4 w-4 accent-laiton-300" />
                    <span>{theme}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="mt-5">
              <legend className="text-sm font-semibold text-graphite-200">Tu veux des infos sur :</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {OFFRES.map((offre) => (
                  <label key={offre} className="flex items-center gap-2 text-xs text-graphite-300">
                    <input
                      name="offresInteressees"
                      value={offre}
                      type="checkbox"
                      className="h-4 w-4 accent-laiton-300"
                    />
                    <span>{offre}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-graphite-300">
              <input name="consentMarketing" required type="checkbox" className="mt-1 accent-laiton-300" />
              <span>
                J&apos;accepte de recevoir des conseils coaching, des conseils nutrition & récupération ainsi que des info-produits COAI.
                Je peux me désinscrire à tout moment.
              </span>
            </label>

            <Button type="submit" disabled={status === "loading"} className="mt-6 w-full py-4 text-sm font-semibold uppercase tracking-[0.05em]">
              {status === "loading" ? "Je reçois..." : "Recevoir la newsletter"}
            </Button>

            {status === "error" && (
              <p className="mt-3 text-center text-sm text-red-300">{message || "Une erreur est survenue. Réessaie."}</p>
            )}

            <p className="mt-3 text-center text-xs text-graphite-500">
              Recommandée : 1 fois / semaine · utile · sans spam.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
