import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/ui/section-label";
import type { ServiceRecommande } from "@/lib/dashboard/besoins-identifies";

// Offres présentées DANS l'interface (01/09/2026, demande Anthony : « et
// après on propose les accompagnements »). Auparavant l'inscription renvoyait
// directement vers /pricing : le prospect voyait un prix avant d'avoir vu
// le produit. Il découvre maintenant l'app, puis les accompagnements ici.
//
// Les noms affichés sont les noms COMMERCIAUX. En base, les plans portent
// des identifiants trompeurs — le plan « GRATUIT » correspond au COAI Essentiel
// facturé 19,99 €. Cette carte ne les expose jamais.
//
// Noms et prix mis à jour le 04/09/2026 : cette carte affichait encore
// "Pass IA / Coaching Hybride / Coaching VIP" avec l'ancien modèle par
// abonnement mensuel (99€/mois, 200€/séance) — jamais synchronisée avec le
// repositionnement en pack 3/6 mois fait sur les pages publiques le même
// jour, puis avec le renommage en COAI Essentiel / Premium Remote / VIP
// Présentiel. Prix repris de src/lib/pricing/tiers.ts.
const OFFRES = [
  {
    service: "IMPULSION" as const,
    nom: "COAI Essentiel",
    prix: "19,99 €",
    unite: "/mois",
    note: "ou 119 €/an, soit 9,99 €/mois",
    pour: "Tu veux un programme qui s'adapte tout seul",
    inclus: ["Programme généré et adapté chaque semaine", "Analyse de tes repas par photo", "Catalogue complet de programmes"],
    href: "/pricing#pass-ia",
  },
  {
    service: "TRANSFORMATION" as const,
    nom: "Premium Remote",
    prix: "960 €",
    unite: "/pack 3 mois min.",
    note: "Ta transformation physique sur 3 mois, accompagnée par Anthony",
    pour: "Tu veux transformer ton corps avec Anthony à tes côtés",
    inclus: ["Tout le COAI Essentiel", "Échanges avec Anthony", "Ajustements personnalisés"],
    href: "/pricing#full-remote",
  },
  {
    service: "VIP" as const,
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
    href: "/pricing#full-presentiel",
  },
];

export function OffresCard({ serviceRecommande }: { serviceRecommande: ServiceRecommande }) {
  const offre = OFFRES.find((item) => item.service === serviceRecommande) ?? OFFRES[0]!;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/[0.08] blur-[75px]" />
      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <SectionLabel>Recommandé selon ton bilan</SectionLabel>
          <div className="mt-3 flex items-center gap-2">
            <Sparkles size={15} className="text-laiton-300" aria-hidden="true" />
            <h2 className="font-display text-2xl font-bold text-[#fffdf8]">{offre.nom}</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite-300">{offre.pour}.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {offre.inclus.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs leading-5 text-graphite-200">
                <Check size={13} className="mt-1 shrink-0 text-emerald-300" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex min-w-0 flex-col rounded-2xl border border-laiton-300/35 bg-[linear-gradient(140deg,rgba(201,162,98,.12),rgba(255,255,255,.02))] p-5 lg:w-72">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-laiton-200">Ton meilleur point de départ</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-[#fffdf8]">
            {offre.prix}
            <span className="ml-1 text-xs font-semibold text-graphite-400">{offre.unite}</span>
          </p>
          <p className="mt-1 text-[11px] leading-4 text-graphite-400">{offre.note}</p>
          <Link
            href={offre.href}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-laiton-300 px-5 py-2.5 text-center text-sm font-bold text-[#101214] transition hover:bg-laiton-200"
          >
            Découvrir {offre.nom} →
          </Link>
          <Link href="/pricing" className="mt-3 text-center text-xs text-graphite-400 underline decoration-white/20 underline-offset-4 hover:text-white">
            Comparer les 3 options
          </Link>
          <p className="mt-3 text-center text-[11px] text-graphite-500">
            {serviceRecommande === "IMPULSION" ? "7 jours offerts · sans engagement" : "Accompagnement sur devis"}
          </p>
        </div>
      </div>
    </Card>
  );
}
