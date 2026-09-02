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

// Offre de rentrée sur le trimestriel (02/09/2026) : 39 € au lieu de 49 €
// jusqu'au 30 septembre inclus. Distincte de l'annonce ci-dessus, qui porte
// sur le tarif mensuel à venir et court jusqu'au 31 octobre.
//
// Source unique de vérité : la page tarifs et la route de paiement lisent
// toutes deux ces valeurs. Un prix affiché différent du prix facturé serait
// une promesse rompue au moment le plus sensible du parcours.
export const PRIX_TRIMESTRE_NORMAL_CENTIMES = 4900;
export const PRIX_TRIMESTRE_RENTREE_CENTIMES = 3900;

const FIN_OFFRE_TRIMESTRE = new Date("2026-10-01T00:00:00+02:00");

export function offreTrimestreActive(maintenant: Date = new Date()): boolean {
  return maintenant < FIN_OFFRE_TRIMESTRE;
}

export function prixTrimestreCentimes(maintenant: Date = new Date()): number {
  return offreTrimestreActive(maintenant)
    ? PRIX_TRIMESTRE_RENTREE_CENTIMES
    : PRIX_TRIMESTRE_NORMAL_CENTIMES;
}

export const FIN_OFFRE_TRIMESTRE_LIBELLE = "30 septembre";
