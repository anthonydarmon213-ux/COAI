// Âge COAI déclaratif (01/09/2026, demande Anthony : une accroche virale
// « Découvre ton Âge COAI » disponible dès la fin du bilan).
//
// À NE PAS CONFONDRE avec deux autres notions déjà présentes :
//   - `calculerAgeCoai` (src/lib/insight/age-coai.ts) : COMPORTEMENTAL,
//     recalculé sur 7 jours d'usage réel. Plus fiable, mais indisponible
//     pour un visiteur qui découvre COAI.
//   - l'âge métabolique des balances à impédance : dérivé du métabolisme de
//     base et de la masse maigre, donc d'une MESURE physiologique. COAI n'en
//     dispose pas et ne doit jamais prétendre le calculer.
//
// Ce qui est calculé ici est une traduction en années de l'Indice COAI, lui
// même issu des réponses déclarées (fréquence, sommeil, nutrition,
// sédentarité, contraintes). C'est un repère de forme relative, honnête tant
// qu'il est présenté comme tel — d'où le disclaimer exporté ci-dessous, à
// afficher partout où le chiffre apparaît.

export const AGE_COAI_DECLARATIF_DISCLAIMER =
  "Estimation de forme relative calculée à partir de tes réponses — pas une mesure médicale, ni un âge métabolique mesuré par impédancemétrie.";

// Repère de « bon terrain de départ » retenu dans calculerIndiceCoai :
// 70-78 correspond à un profil solide. On centre l'écart sur 72.
const SCORE_REFERENCE = 72;
// Un point d'indice vaut un quart d'année : sur l'amplitude réelle du score
// (38 à 84), l'écart reste dans une fourchette crédible, jamais anxiogène.
const ANNEES_PAR_POINT = 0.25;
const ECART_MAX = 12;

export type AgeCoaiDeclaratif = {
  ageChronologique: number;
  ageCoai: number;
  ecartAnnees: number;
  sens: "plus_jeune" | "plus_age" | "egal";
};

export function ageCoaiDeclaratif(
  ageChronologique: number | null | undefined,
  scoreIndice: number
): AgeCoaiDeclaratif | null {
  // Sans âge déclaré, aucun écart n'a de sens : on n'affiche rien plutôt que
  // d'inventer un âge de référence.
  if (!ageChronologique || !Number.isFinite(ageChronologique) || ageChronologique < 14) return null;

  const brut = (SCORE_REFERENCE - scoreIndice) * ANNEES_PAR_POINT;
  const ecart = Math.round(Math.max(-ECART_MAX, Math.min(ECART_MAX, brut)));
  // Plancher à 18 ans : un écart favorable ne doit pas produire un âge
  // d'adolescent pour un adulte de 30 ans.
  const ageCoai = Math.max(18, ageChronologique + ecart);

  return {
    ageChronologique,
    ageCoai,
    ecartAnnees: Math.abs(ageCoai - ageChronologique),
    sens: ageCoai < ageChronologique ? "plus_jeune" : ageCoai > ageChronologique ? "plus_age" : "egal",
  };
}
