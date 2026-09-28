"use client";

import { useId } from "react";
import type { AIImageScope } from "@/lib/ai/image-consent";

const descriptions: Record<AIImageScope, string> = {
  morphologie: "Tes photos en tenue de sport et l’angle choisi sont transmis à Anthropic pour proposer des observations de posture. Les observations sont enregistrées dans ton profil COAI.",
  montre: "Tes captures, y compris les informations de santé visibles, sont transmises à Anthropic pour lire tes mesures. Les valeurs extraites sont enregistrées dans ton profil COAI.",
  mouvement: "Ta photo et le nom de l’exercice sont transmis à Anthropic pour proposer un retour sur la position visible.",
  repas: "La photo de ton repas est transmise à Anthropic pour estimer les aliments et leurs valeurs nutritionnelles. Tu choisis ensuite si tu ajoutes le résultat à ton journal.",
  menu: "La photo du menu et ton objectif enregistré dans COAI sont transmis à Anthropic pour suggérer des plats.",
};

export function AIImageConsent({ scope, agreed, onChange, disabled = false }: {
  scope: AIImageScope; agreed: boolean; onChange: (agreed: boolean) => void; disabled?: boolean;
}) {
  const descriptionId = useId();
  return (
    <div className="my-3 rounded-xl border border-white/15 bg-black/15 p-3 text-left">
      <p id={descriptionId} className="text-xs leading-5 text-graphite-200">{descriptions[scope]}</p>
      <label className="mt-2 flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-5 text-white">
        <input type="checkbox" checked={agreed} disabled={disabled}
          aria-describedby={descriptionId} onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[#D4AF37]" />
        <span>J’autorise l’envoi à Anthropic des images que je choisis pour cet outil.</span>
      </label>
      <p className="text-xs leading-5 text-graphite-300">
        Facultatif. Après cet accord, choisir une image lance son analyse. Cet accord concerne uniquement cet outil ; décoche pour les prochains envois. {" "}
        <a href="/confidentialite" className="underline underline-offset-2">Confidentialité</a>
      </p>
    </div>
  );
}
