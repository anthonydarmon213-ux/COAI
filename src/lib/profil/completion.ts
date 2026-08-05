type ProfilChampsPourCompletion = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
  antecedentsMedicaux?: string | null;
  tailleCm?: number | null;
  age?: number | null;
  morphologie?: string | null;
  frequenceEntrainement?: string | null;
  sportsPratiques?: string | null;
  habitudesAlimentaires?: string | null;
  repasParJour?: string | null;
  hydratation?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
};

// Le programme généré par l'IA est d'autant plus précis que le profil est
// complet. Sert à afficher un indicateur d'avancement plutôt que de forcer
// des champs obligatoires (certains n'ont légitimement rien à déclarer, ex:
// aucun antécédent médical, ce qui reste une réponse valide à fournir).
export function computeProfilCompletion(profil?: ProfilChampsPourCompletion | null): {
  remplis: number;
  total: number;
} {
  const champs: (keyof ProfilChampsPourCompletion)[] = [
    "objectifs",
    "niveau",
    "equipementDisponible",
    "contraintesSante",
    "antecedentsMedicaux",
    "tailleCm",
    "age",
    "morphologie",
    "frequenceEntrainement",
    "sportsPratiques",
    "habitudesAlimentaires",
    "repasParJour",
    "hydratation",
    "consommationCafe",
    "consommationAlcool",
    "qualiteSommeil",
  ];

  const remplis = champs.filter((champ) => {
    const valeur = profil?.[champ];
    return valeur !== null && valeur !== undefined && valeur !== "";
  }).length;

  return { remplis, total: champs.length };
}
