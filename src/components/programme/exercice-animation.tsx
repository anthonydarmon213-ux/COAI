"use client";

// Les animations/mannequins ont été retirés du produit : ils pouvaient
// montrer une exécution ou des muscles inexacts. Le composant reste une
// compatibilité silencieuse pour d'anciens écrans, mais aucune animation
// n'est désormais rendue. Les programmes utilisent uniquement les médias
// COAI réels via ExerciceVideo.
export function ExerciceAnimation({
  nom,
  className = "",
}: {
  nom: string;
  className?: string;
}) {
  void nom;
  void className;
  return null;
}
