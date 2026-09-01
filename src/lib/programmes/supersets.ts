import { exerciceAvecMediasCoai } from "@/lib/exercices/media-coai";

function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘ʼ`]/g, "'");
}

type Famille = "pectoraux" | "dos" | "biceps" | "triceps" | "quadriceps" | "ischios" | "epaules";

function familles(nom: string): Famille[] {
  const n = normaliser(nom);
  const resultat: Famille[] = [];
  if (/developpe couche|pompe|dips(?! sur banc)|ecarte/.test(n)) resultat.push("pectoraux");
  if (/rowing|tirage|traction/.test(n)) resultat.push("dos");
  if (/curl/.test(n)) resultat.push("biceps");
  if (/extension triceps|dips sur banc/.test(n)) resultat.push("triceps");
  if (/squat|presse a cuisses|fente|quadri/.test(n)) resultat.push("quadriceps");
  if (/leg curl|ischio/.test(n)) resultat.push("ischios");
  if (/developpe militaire|developpe epaules|elevations|epaule/.test(n)) resultat.push("epaules");
  return resultat;
}

const PAIRES_ANTAGONISTES: ReadonlySet<string> = new Set([
  "dos|pectoraux",
  "biceps|triceps",
  "epaules|dos",
  "ischios|quadriceps",
]);

function clePaire(a: Famille, b: Famille): string {
  return [a, b].sort().join("|");
}

/** Retourne vrai uniquement pour une paire agoniste–antagoniste validée. */
export function sontSupersetAntagoniste(nomA: string, nomB: string): boolean {
  if (!exerciceAvecMediasCoai(nomA) || !exerciceAvecMediasCoai(nomB)) return false;
  if (normaliser(nomA) === normaliser(nomB)) return false;
  return familles(nomA).some((a) => familles(nomB).some((b) => PAIRES_ANTAGONISTES.has(clePaire(a, b))));
}

/**
 * Nettoie les programmes déjà enregistrés : un ancien “Superset contrôlé”
 * sans partenaire valide redevient une série classique au lieu d'afficher
 * une consigne trompeuse.
 */
export function nettoyerSupersets(exercices: unknown[]): Record<string, unknown>[] {
  return exercices.map((exercice, index) => {
    if (typeof exercice !== "object" || exercice === null || Array.isArray(exercice)) return exercice as Record<string, unknown>;
    const courant = exercice as Record<string, unknown>;
    const nom = typeof courant.nom === "string" ? courant.nom : "";
    const suivant = exercices[index + 1];
    const nomSuivant = typeof suivant === "object" && suivant !== null && !Array.isArray(suivant)
      ? (typeof (suivant as Record<string, unknown>).nom === "string" ? (suivant as Record<string, unknown>).nom as string : "")
      : "";
    const partenaireDeclare = typeof courant.supersetAvec === "string" ? courant.supersetAvec : "";
    // Le partenaire doit être l'exercice immédiatement suivant : un champ
    // supersetAvec qui pointe plus loin dans la séance ne décrit pas un
    // enchaînement réellement exécutable.
    const partenaire = nomSuivant && (!partenaireDeclare || normaliser(partenaireDeclare) === normaliser(nomSuivant))
      ? nomSuivant
      : "";
    const demandeSuperset = typeof courant.methode === "string" && /superset|bi[- ]?set/i.test(courant.methode);
    if (!demandeSuperset) return courant;
    if (!partenaire || !sontSupersetAntagoniste(nom, partenaire)) {
      return { ...courant, methode: "Série classique", supersetAvec: null };
    }
    return {
      ...courant,
      methode: `Superset agoniste–antagoniste · enchaîner avec ${partenaire}`,
      supersetAvec: partenaire,
    };
  });
}
