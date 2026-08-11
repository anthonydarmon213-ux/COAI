// Champs réellement consommés par le moteur de génération (src/lib/programmes/
// generer.ts + src/lib/ai/prompts/*), audités un par un plutôt que de reprendre
// aveuglément une liste supposée (Phase 5.1, correction structurante de
// l'onboarding, 11/08/2026). Deux catégories :
//
// ESSENTIELS — champs à choix contraint (select/nombre), jamais légitimement
// vides une fois la question posée : bloquent la génération tant qu'ils
// manquent. Tous déjà collectés par le diagnostic public (cf.
// src/lib/diagnostic/storage.ts) — un utilisateur qui a fait le diagnostic
// les a donc déjà tous, jamais redemandés.
//
// Volontairement PAS dans les essentiels malgré leur usage réel par le
// moteur : contraintesSante, allergiesAlimentaires. Ce sont des champs texte
// libre où "vide" est une réponse valide et fréquente ("aucune contrainte",
// "aucune allergie") — les rendre bloquants pénaliserait injustement une
// personne en bonne santé qui n'a simplement rien à déclarer. Le moteur gère
// déjà leur absence proprement (fallback "aucune connue" dans les prompts).
// Comptés en enrichissement à la place : leur présence améliore le score,
// leur absence ne bloque jamais rien.
//
// ENRICHISSEMENT — améliore la précision mais ne bloque jamais la génération.
// Le bracelet connecté et la photo morphologique comptent chacun pour UNE
// seule unité (une action utilisateur = un point), pas un point par champ
// auto-extrait, pour ne pas surpondérer artificiellement ces deux actions.
type ProfilChampsPourCompletion = {
  // Essentiels (7)
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
  dureeSeanceMinutes?: number | null;
  equipementDisponible?: string | null;
  age?: number | null;
  sexe?: string | null;
  // Enrichissement (16 unités)
  lieuEntrainement?: string | null;
  contraintesSante?: string | null;
  antecedentsMedicaux?: string | null;
  allergiesAlimentaires?: string | null;
  tailleCm?: number | null;
  poidsKg?: number | null;
  morphologie?: string | null;
  sportsPratiques?: string | null;
  habitudesAlimentaires?: string | null;
  repasParJour?: string | null;
  hydratation?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
  derniereAnalyseMontre?: Date | null;
  derniereAnalysePhoto?: Date | null;
};

const CHAMPS_ESSENTIELS = [
  "objectifs",
  "niveau",
  "frequenceEntrainement",
  "dureeSeanceMinutes",
  "equipementDisponible",
  "age",
  "sexe",
] as const satisfies readonly (keyof ProfilChampsPourCompletion)[];

const CHAMPS_ENRICHISSEMENT = [
  "lieuEntrainement",
  "contraintesSante",
  "antecedentsMedicaux",
  "allergiesAlimentaires",
  "tailleCm",
  "poidsKg",
  "morphologie",
  "sportsPratiques",
  "habitudesAlimentaires",
  "repasParJour",
  "hydratation",
  "consommationCafe",
  "consommationAlcool",
  "qualiteSommeil",
  "derniereAnalyseMontre",
  "derniereAnalysePhoto",
] as const satisfies readonly (keyof ProfilChampsPourCompletion)[];

export const LABEL_CHAMP_ESSENTIEL: Record<(typeof CHAMPS_ESSENTIELS)[number], string> = {
  objectifs: "Objectif",
  niveau: "Niveau",
  frequenceEntrainement: "Fréquence d'entraînement",
  dureeSeanceMinutes: "Durée de séance",
  equipementDisponible: "Équipement disponible",
  age: "Âge",
  sexe: "Sexe",
};

function estRempli(valeur: unknown): boolean {
  return valeur !== null && valeur !== undefined && valeur !== "";
}

// Poids 60% essentiels / 40% enrichissement : le pourcentage doit déjà être
// élevé dès que l'essentiel est là (c'est la partie qui compte vraiment pour
// générer), l'enrichissement affine sans jamais être bloquant.
const POIDS_ESSENTIEL = 60;
const POIDS_ENRICHISSEMENT = 40;

export type CompletionProfil = {
  pourcentage: number;
  essentielComplet: boolean;
  essentiel: { rempli: number; total: number };
  enrichissement: { rempli: number; total: number };
  champsEssentielsManquants: string[];
  // Rétrocompatibilité avec l'ancien affichage "X/Y champs" (avant la
  // scission essentiel/enrichissement) — total = essentiels + enrichissement.
  remplis: number;
  total: number;
};

export function computeProfilCompletion(profil?: ProfilChampsPourCompletion | null): CompletionProfil {
  const essentielsRemplis = CHAMPS_ESSENTIELS.filter((champ) => estRempli(profil?.[champ]));
  const enrichissementRempli = CHAMPS_ENRICHISSEMENT.filter((champ) => estRempli(profil?.[champ]));

  const pourcentageEssentiel = (essentielsRemplis.length / CHAMPS_ESSENTIELS.length) * POIDS_ESSENTIEL;
  const pourcentageEnrichissement =
    (enrichissementRempli.length / CHAMPS_ENRICHISSEMENT.length) * POIDS_ENRICHISSEMENT;

  const champsEssentielsManquants = CHAMPS_ESSENTIELS.filter(
    (champ) => !estRempli(profil?.[champ])
  ).map((champ) => LABEL_CHAMP_ESSENTIEL[champ]);

  return {
    pourcentage: Math.round(pourcentageEssentiel + pourcentageEnrichissement),
    essentielComplet: essentielsRemplis.length === CHAMPS_ESSENTIELS.length,
    essentiel: { rempli: essentielsRemplis.length, total: CHAMPS_ESSENTIELS.length },
    enrichissement: { rempli: enrichissementRempli.length, total: CHAMPS_ENRICHISSEMENT.length },
    champsEssentielsManquants,
    remplis: essentielsRemplis.length + enrichissementRempli.length,
    total: CHAMPS_ESSENTIELS.length + CHAMPS_ENRICHISSEMENT.length,
  };
}
