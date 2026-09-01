// Silhouette musculaire masculine — internalisée depuis
// react-muscle-highlighter v1.2.0 (MIT), voir ./LICENSE.
//
// Pourquoi ce fichier existe : le paquet importe sans condition les
// silhouettes des deux sexes et choisit à l'exécution via une prop `gender`.
// COAI n'a jamais affiché que la version masculine, mais livrait quand même
// 29,5 Ko gzip de tracés féminins à chaque utilisateur — sur 58,7 Ko au
// total. Ni le tree-shaking (imports statiques) ni un import profond (champ
// "exports" restreint à ".") ne pouvaient l'éviter.
//
// Seule la partie réellement utilisée est reprise : rendu masculin, choix de
// couleur par intensité, contours. Les fonctions inutilisées du paquet
// (clics sur une zone, parties désactivées ou masquées, silhouette féminine)
// ne le sont pas — les réintroduire serait du code mort.

import { bodyFront } from "./body-front";
import { bodyBack } from "./body-back";
import { CONTOUR_AVANT, CONTOUR_ARRIERE } from "./contours";
import type { PartieActive, PartieCorps } from "./types";

export type { PartieActive, PartieCorps, SlugCorps } from "./types";

export function SilhouetteMusculaire({
  data,
  couleurs = ["#D4AF37"],
  vue = "front",
  echelle = 1,
  remplissageDefaut = "#0D0E12",
  contourDefaut = "#2A2D35",
  epaisseurDefaut = 1,
  contour = "none",
}: {
  data: ReadonlyArray<PartieActive>;
  couleurs?: ReadonlyArray<string>;
  vue?: "front" | "back";
  echelle?: number;
  remplissageDefaut?: string;
  contourDefaut?: string;
  epaisseurDefaut?: number;
  contour?: string | "none";
}) {
  const parties: PartieCorps[] = vue === "front" ? bodyFront : bodyBack;
  const viewBox = vue === "front" ? "0 0 724 1448" : "724 0 724 1448";

  // La librairie d'origine faisait varier la COULEUR selon l'intensité, en
  // piochant dans la palette. COAI ne passe qu'une seule couleur (l'or de la
  // marque) : le dégradé était donc invisible, toutes les zones actives
  // ressortaient identiques. On traduit l'intensité en OPACITÉ, ce qui rend
  // le volume lisible sans introduire une seconde teinte.
  //
  // Le `fill` reste exactement la couleur de marque : la pulsation CSS cible
  // path[fill="#D4AF37"], la changer casserait l'animation.
  const etatPour = (partie: PartieCorps): { fill: string; opacite: number } | null => {
    const active = data.find((d) => d.slug === partie.slug);
    if (!active) return null;
    const i = active.intensity ?? 1;
    const index = Math.min(couleurs.length - 1, Math.max(0, Math.round((1 - i) * (couleurs.length - 1))));
    // Plancher à 0.35 : en dessous, une zone travaillée devient
    // indiscernable du fond et se lit comme « jamais entraînée ».
    return { fill: couleurs[index] ?? couleurs[0] ?? "#D4AF37", opacite: 0.35 + 0.65 * Math.min(1, Math.max(0, i)) };
  };

  return (
    <svg
      viewBox={viewBox}
      height={400 * echelle}
      width={200 * echelle}
      role="img"
      aria-label={`silhouette-${vue}`}
      style={{ display: "block" }}
    >
      {contour !== "none" && (
        <g strokeWidth={2} fill="none" strokeLinecap="butt">
          <path
            stroke={contour}
            style={{ vectorEffect: "non-scaling-stroke" }}
            d={vue === "front" ? CONTOUR_AVANT : CONTOUR_ARRIERE}
            aria-label={`contour-${vue}`}
          />
        </g>
      )}
      {parties.flatMap((partie) => {
        const etat = etatPour(partie);
        const tous = [
          ...(partie.path?.common ?? []),
          ...(partie.path?.left ?? []),
          ...(partie.path?.right ?? []),
        ];
        return tous.map((d, i) => (
          <path
            key={`${partie.slug}-${i}`}
            id={partie.slug}
            d={d}
            fill={etat?.fill ?? remplissageDefaut}
            fillOpacity={etat?.opacite ?? 1}
            stroke={contourDefaut}
            strokeWidth={epaisseurDefaut}
          />
        ));
      })}
    </svg>
  );
}
