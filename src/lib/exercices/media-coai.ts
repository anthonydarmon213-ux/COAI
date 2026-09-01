import { EXERCICES, type Exercice } from "@/lib/exercices/catalogue";
import { photoCoaiPourNom } from "@/lib/exercices/photos-coai";
import { videoCoaiPourNom } from "@/lib/exercices/videos-coai";

function normaliserNom(nom: string): string {
  return nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const NOMS_BIBLIOTHEQUE = new Map(EXERCICES.map((exercice) => [normaliserNom(exercice.nom), exercice]));

// Alias uniquement lorsqu'il s'agit exactement du même mouvement. Les
// variantes de matériel ou de trajectoire ne sont jamais rapprochées ici.
const ALIAS_NOMS: Record<string, string> = {
  "back squat barre": "Squat barre",
  "crunch au sol": "Crunch",
  "superman au sol": "Superman",
  "deadlift trap bar": "Soulevé de terre trap bar",
  "elevations laterales halteres": "Élévations latérales",
};

export function exerciceBibliothequePourNom(nom: string): Exercice | null {
  const normalise = normaliserNom(nom);
  const exact = NOMS_BIBLIOTHEQUE.get(normalise);
  if (exact) return exact;

  const alias = ALIAS_NOMS[normalise];
  return alias ? NOMS_BIBLIOTHEQUE.get(normaliserNom(alias)) ?? null : null;
}

/**
 * Média d'exercice réellement exploitable dans un programme.
 *
 * Une photo seule ne suffit pas pour une séance guidée : la fiche doit
 * pouvoir afficher le visuel COAI et la démonstration vidéo correspondante.
 * Les anciens clips mannequin/animation ne sont volontairement jamais pris
 * en compte ici.
 */
export function exerciceAvecMediasCoai(nom: string): boolean {
  const exercice = exerciceBibliothequePourNom(nom);
  return Boolean(exercice && photoCoaiPourNom(exercice.nom) && videoCoaiPourNom(exercice.nom));
}

export function filtrerExercicesAvecMedias(exercices: unknown[]): Record<string, unknown>[] {
  return exercices.flatMap((exercice): Record<string, unknown>[] => {
    if (typeof exercice !== "object" || exercice === null || Array.isArray(exercice)) return [];

    const donnees = exercice as Record<string, unknown>;
    const nom = donnees.nom;
    if (typeof nom !== "string") return [];

    const canonique = exerciceBibliothequePourNom(nom);
    if (!canonique || !photoCoaiPourNom(canonique.nom) || !videoCoaiPourNom(canonique.nom)) return [];

    // Le nom canonique garantit que les résolutions photo/vidéo et les
    // métadonnées du catalogue décrivent bien le même mouvement.
    return [{ ...donnees, nom: canonique.nom }];
  });
}
