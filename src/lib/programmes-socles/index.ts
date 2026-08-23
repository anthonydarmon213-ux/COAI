import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cleSocle, type CleSocle } from "@/lib/programmes-socles/cle";

// Lecture d'un programme socle (24/08/2026) — voir cle.ts pour le pourquoi.
//
// Les socles vivent en JSON dans data/ plutôt qu'en base : ce sont du
// contenu versionné, relu et corrigé comme le reste du code. Un socle
// modifié se déploie comme un correctif, et l'historique dit qui a changé
// quoi — ce qu'une table ne donnerait pas.

export type ProgrammeSocle = {
  cle: CleSocle;
  genereLe: string;
  entrainement: unknown;
  nutrition: unknown;
  recuperation: unknown;
};

const DOSSIER = join(process.cwd(), "src/lib/programmes-socles/data");

/**
 * Socle correspondant au profil, ou null si la bibliothèque ne le couvre
 * pas encore. L'appelant retombe alors sur la génération sur mesure —
 * jamais sur un socle approchant : servir un programme "presque bon" est
 * précisément ce qu'on veut éviter.
 */
export async function soclePourProfil(profil: {
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
}): Promise<ProgrammeSocle | null> {
  const cle = cleSocle(profil);
  try {
    const brut = await readFile(join(DOSSIER, `${cle}.json`), "utf8");
    return JSON.parse(brut) as ProgrammeSocle;
  } catch {
    // Fichier absent ou illisible : pas une erreur, la bibliothèque est
    // simplement incomplète. Le log reste côté serveur pour savoir quelles
    // combinaisons manquent réellement en production.
    console.info(`[socles] aucun socle pour ${cle}`);
    return null;
  }
}

/**
 * Un socle est-il acceptable pour ce profil ?
 *
 * Non dès qu'une contrainte de santé, une grossesse ou un post-partum est
 * déclaré : le socle est construit sur un cas général, il ignore ces
 * situations. Ces profils passent toujours par la génération sur mesure,
 * quel que soit leur abonnement — c'est une règle de sécurité, pas une
 * question de prix.
 */
export function socleAcceptable(profil: {
  contraintesSante?: string | null;
  statutMaternite?: string | null;
}): boolean {
  if (profil.statutMaternite) return false;
  const contraintes = (profil.contraintesSante ?? "").trim();
  return contraintes.length === 0;
}
