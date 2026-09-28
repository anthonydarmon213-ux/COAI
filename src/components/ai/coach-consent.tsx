"use client";

import { useId } from "react";

export function AICoachConsent({ agreed, onChange, disabled = false, voice = false }: {
  agreed: boolean; onChange: (agreed: boolean) => void; disabled?: boolean; voice?: boolean;
}) {
  const descriptionId = useId();
  return (
    <div className="my-3 rounded-xl border border-white/15 bg-black/15 p-3 text-left">
      <p id={descriptionId} className="text-xs leading-5 text-graphite-200">
        Pour personnaliser sa réponse, le coach IA transmet à Anthropic ta question,
        tes objectifs, ton niveau, ton âge, tes contraintes et antécédents de santé
        renseignés, ainsi que les observations et tendances de ton suivi COAI.
        Pendant une séance, son contexte et ton bilan du jour peuvent aussi être transmis.
      </p>
      {voice && <p className="mt-2 text-xs leading-5 text-graphite-200">
        La dictée utilise le service vocal de ton appareil ou navigateur et peut lui
        transmettre ta voix. Le texte reconnu est ensuite envoyé au coach IA.
      </p>}
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-5 text-white">
        <input type="checkbox" checked={agreed} disabled={disabled} aria-describedby={descriptionId}
          onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[#D4AF37]" />
        <span>{voice ? "J’autorise la dictée et le partage de ce contexte avec Anthropic." : "J’autorise le partage de ma question et de ce contexte avec Anthropic."}</span>
      </label>
      <p className="text-xs leading-5 text-graphite-300">
        Facultatif. Décoche pour empêcher les prochains envois. Ta séance reste accessible sans le coach IA. {" "}
        <a href="/confidentialite" className="underline underline-offset-2">Confidentialité</a>
      </p>
    </div>
  );
}
