import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cleEntrainement, cleNutrition, cleRecuperation } from "@/lib/programmes-socles/cle";

// Lecture des programmes socles (24/08/2026) — voir cle.ts pour le pourquoi
// du découpage par pilier.
//
// Les socles vivent en JSON dans data/ plutôt qu'en base : ce sont du
// contenu versionné, relu et corrigé comme le reste du code. Un socle
// modifié se déploie comme un correctif, et l'historique dit qui a changé
// quoi — ce qu'une table ne donnerait pas.

type ProfilSocle = {
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
};

const DOSSIER = join(process.cwd(), "src/lib/programmes-socles/data");

async function lire(sousDossier: string, cle: string): Promise<unknown | null> {
  try {
    const brut = await readFile(join(DOSSIER, sousDossier, `${cle}.json`), "utf8");
    return JSON.parse(brut);
  } catch {
    // Fichier absent ou illisible : pas une erreur, la bibliothèque est
    // simplement incomplète. Le log reste côté serveur pour savoir quelles
    // combinaisons manquent réellement en production.
    console.info(`[socles] aucun socle ${sousDossier}/${cle}`);
    return null;
  }
}

/**
 * Socle d'un pilier pour ce profil, ou null si la bibliothèque ne le couvre
 * pas encore. L'appelant retombe alors sur la génération sur mesure —
 * jamais sur un socle approchant : servir un programme "presque bon" est
 * précisément ce qu'on veut éviter.
 *
 * Chaque pilier est lu indépendamment : une nutrition socle peut être servie
 * pendant qu'un entraînement est généré sur mesure, si seul ce dernier
 * manque à la bibliothèque.
 */
export async function socleEntrainement(profil: ProfilSocle) {
  return lire("entrainement", cleEntrainement(profil));
}

export async function socleNutrition(profil: ProfilSocle) {
  return lire("nutrition", cleNutrition(profil));
}

export async function socleRecuperation(profil: ProfilSocle) {
  return lire("recuperation", cleRecuperation(profil));
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
  return (profil.contraintesSante ?? "").trim().length === 0;
}
