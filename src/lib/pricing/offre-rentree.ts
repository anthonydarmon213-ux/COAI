// Offre de rentrée (02/09/2026, demande Anthony). Le tarif affiché n'est pas
// un prix barré : COAI n'a jamais été vendu 29 €, et présenter ce montant
// comme un ancien prix serait un prix de référence fictif. C'est donc annoncé
// pour ce que c'est — le tarif à venir — et le blocage à vie repose sur le
// mécanisme membre fondateur déjà en place.
export const OFFRE_RENTREE_FIN = new Date("2026-10-31T23:59:59+01:00");
export const PRIX_APRES_OFFRE = "29 €";

export function offreRentreeActive(maintenant: Date = new Date()): boolean {
  return maintenant < OFFRE_RENTREE_FIN;
}
