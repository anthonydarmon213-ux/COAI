import { EXERCICES, buildFreeExerciseDbPhotoUrl } from "@/lib/exercices/catalogue";

// Photo d'un exercice GÉNÉRÉ par l'IA (23/08/2026, demande Anthony :
// "je veux voir ça dans entraînement, avec de belles photos").
//
// Le programme généré n'utilisait que Pexels, cherché par mots-clés — la
// source qui donnait des photos fausses (un tirage horizontal illustré par
// autre chose). Le catalogue, lui, associe déjà 42 exercices à Free
// Exercise DB, où la photo est liée à l'exercice exact par un humain.
//
// Ce module fait le pont : il rapproche le nom généré par l'IA d'un
// exercice du catalogue, et renvoie sa photo fiable. Sans correspondance
// nette, il renvoie null et l'appelant retombe sur Pexels — jamais une
// photo « à peu près », qui montrerait un autre mouvement.

function normaliser(nom: string): string {
  return nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Mots trop courants pour distinguer deux exercices entre eux. */
const MOTS_VIDES = new Set([
  "de", "du", "la", "le", "les", "a", "au", "aux", "en", "sur", "avec",
  "machine", "poulie", "barre", "halteres", "haltere", "elastique",
]);

function motsSignifiants(nom: string): string[] {
  return normaliser(nom)
    .split(" ")
    .filter((m) => m.length > 2 && !MOTS_VIDES.has(m));
}

/**
 * URL de photo fiable pour un exercice généré, ou null.
 *
 * Exige au moins 2 mots significatifs en commun, ou 1 seul s'il est très
 * spécifique (≥ 6 lettres, ex. « traction », « squat » exclu car trop
 * court et présent dans plusieurs variantes différentes).
 */
export function photoFiablePourNom(nomGenere: string): string | null {
  const motsGeneres = motsSignifiants(nomGenere);
  if (motsGeneres.length === 0) return null;

  let meilleur: { id: string; score: number } | null = null;

  for (const exercice of EXERCICES) {
    if (!exercice.freeExerciseDbId) continue;
    const motsCatalogue = motsSignifiants(exercice.nom);
    const communs = motsGeneres.filter((m) => motsCatalogue.includes(m));
    if (communs.length === 0) continue;

    const assezSpecifique =
      communs.length >= 2 || communs.some((m) => m.length >= 6);
    if (!assezSpecifique) continue;

    // Le score favorise les correspondances qui couvrent une large part du
    // nom catalogue : « développé couché » doit gagner sur « développé
    // militaire » quand l'IA écrit « développé couché haltères ».
    const score = communs.length / motsCatalogue.length + communs.length;
    if (!meilleur || score > meilleur.score) {
      meilleur = { id: exercice.freeExerciseDbId, score };
    }
  }

  return meilleur ? buildFreeExerciseDbPhotoUrl(meilleur.id) : null;
}
