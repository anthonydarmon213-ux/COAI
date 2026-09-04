import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";

// Offres présentées DANS l'interface (01/09/2026, demande Anthony : « et
// après on propose les accompagnements »). Auparavant l'inscription renvoyait
// directement vers /pricing : le prospect voyait un prix avant d'avoir vu
// le produit. Il découvre maintenant l'app, puis les accompagnements ici.
//
// Les noms affichés sont les noms COMMERCIAUX. En base, les plans portent
// des identifiants trompeurs — le plan « GRATUIT » correspond au Standard IA
// facturé 19,99 €. Cette carte ne les expose jamais.
//
// Noms et prix mis à jour le 04/09/2026 : cette carte affichait encore
// "Pass IA / Coaching Hybride / Coaching VIP" avec l'ancien modèle par
// abonnement mensuel (99€/mois, 200€/séance) — jamais synchronisée avec le
// repositionnement en pack 3/6 mois fait sur les pages publiques le même
// jour, puis avec le renommage en Standard IA / Premium Remote / VIP
// Présentiel. Prix repris de src/lib/pricing/tiers.ts.
const OFFRES = [
  {
    nom: "Standard IA",
    prix: "19,99 €",
    unite: "/mois",
    note: "ou 119 €/an, soit 9,99 €/mois",
    pour: "Tu veux un programme qui s'adapte tout seul",
    inclus: ["Programme généré et adapté chaque semaine", "Analyse de tes repas par photo", "Catalogue complet de programmes"],
    href: "/pricing",
    accent: false,
  },
  {
    nom: "Premium Remote",
    prix: "960 €",
    unite: "/pack 3 mois min.",
    note: "soit 80 €/séance, sur devis via WhatsApp",
    pour: "Tu veux un humain qui suit ta progression",
    inclus: ["Tout le Standard IA", "Échanges avec Anthony", "Ajustements personnalisés"],
    href: "/pricing",
    accent: true,
  },
  {
    nom: "VIP Présentiel",
    prix: "1 200 €",
    unite: "/pack 3 mois min.",
    note: "soit 100 €/séance, sur devis via WhatsApp",
    pour: "Tu veux Anthony en personne",
    inclus: [
      "À domicile, en entreprise, en club ou à distance",
      "Pack de séances suivies sur 3 ou 6 mois",
      "Facture déductible en frais d'entreprise",
    ],
    href: "/pricing",
    accent: false,
  },
];

export function OffresCard() {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <SectionLabel>Passer à la vitesse supérieure</SectionLabel>
        <p className="mt-2 text-sm leading-6 text-graphite-300">
          Tu gardes gratuitement ton carnet de séances, tes mesures, la bibliothèque
          d&apos;exercices et 3 recettes. Les accompagnements ajoutent l&apos;intelligence qui
          construit et adapte ton programme.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {OFFRES.map((o) => (
          <div
            key={o.nom}
            className={`flex flex-col gap-2.5 rounded-2xl border p-4 ${
              o.accent
                ? "border-laiton-300/40 bg-[linear-gradient(140deg,rgba(201,162,98,.12),rgba(255,255,255,.02))]"
                : "border-white/10 bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-1.5">
              {o.accent && <Sparkles size={13} className="text-laiton-300" aria-hidden="true" />}
              <p className="font-display text-base font-bold text-[#fffdf8]">{o.nom}</p>
            </div>
            <p className="font-display text-2xl font-extrabold text-[#fffdf8]">
              {o.prix}
              <span className="text-sm font-semibold text-graphite-400">{o.unite}</span>
            </p>
            <p className="text-[11px] leading-4 text-graphite-400">{o.note}</p>
            <p className="text-xs font-semibold text-laiton-200">{o.pour}</p>
            <ul className="mt-0.5 flex flex-col gap-1.5">
              {o.inclus.map((i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] leading-4 text-graphite-300">
                  <Check size={12} className="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
                  {i}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/pricing"
          className="rounded-full bg-laiton-300 px-5 py-2.5 text-sm font-bold text-[#101214] transition hover:bg-laiton-200"
        >
          Comparer les accompagnements →
        </Link>
        <p className="text-[11px] text-graphite-400">7 jours offerts · sans engagement</p>
      </div>
    </Card>
  );
}
