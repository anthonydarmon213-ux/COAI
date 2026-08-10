import { SectionLabel } from "@/components/ui/section-label";

// Première sélection de conseils courts, dans l'esprit de la méthode
// d'Anthony Darmon (17 ans de coaching) — à faire relire/ajuster par lui
// avant diffusion large, cf. demande du 11/08/2026 ("regrouper les
// meilleurs conseils"). Contenu statique volontairement : pas de vrai appel
// IA ni de CMS pour l'instant, juste une sélection curée.
const CONSEILS = [
  {
    pilier: "Entraînement",
    titre: "La progressivité bat l'intensité",
    texte:
      "Ajouter 2,5 kg ou une répétition par semaine construit plus de résultats sur un an qu'une séance épuisante suivie de deux semaines de courbatures.",
  },
  {
    pilier: "Entraînement",
    titre: "L'échauffement n'est pas optionnel",
    texte:
      "5 minutes d'échauffement articulaire réduisent le risque de blessure bien plus qu'elles ne « volent » de l'énergie à ta séance.",
  },
  {
    pilier: "Nutrition",
    titre: "Des protéines à chaque repas",
    texte:
      "Viser environ 1,6 à 2 g de protéines par kg de poids de corps par jour, réparties sur 3-4 repas, reste le levier le plus fiable pour préserver ou construire du muscle.",
  },
  {
    pilier: "Nutrition",
    titre: "L'hydratation avant la faim",
    texte:
      "Une sensation de faim en milieu de journée cache parfois une simple déshydratation — un verre d'eau avant de grignoter change souvent la donne.",
  },
  {
    pilier: "Récupération",
    titre: "Le sommeil est un entraînement",
    texte:
      "Une nuit sous 6h annule une partie des bénéfices de la séance de la veille — dormir n'est pas une pause, c'est là que le corps se répare.",
  },
  {
    pilier: "Récupération",
    titre: "Un jour de repos n'est pas un jour perdu",
    texte:
      "S'entraîner tous les jours sans récupération freine la progression plus qu'il ne l'accélère.",
  },
] as const;

export function ConseilsCoach() {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Conseils de coach</SectionLabel>
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {CONSEILS.map((c) => (
          <div
            key={c.titre}
            className="w-64 flex-none snap-start rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_24px_80px_-48px_rgba(0,0,0,0.9)]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-laiton-400">
              {c.pilier}
            </span>
            <p className="mt-2 font-display text-base font-semibold text-white">{c.titre}</p>
            <p className="mt-1.5 text-xs leading-5 text-graphite-400">{c.texte}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
