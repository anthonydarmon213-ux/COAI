import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cleEntrainement, cleNutrition, cleRecuperation } from "@/lib/programmes-socles/cle";
import {
  construireSocleEntrainement,
  construireSocleNutrition,
  construireSocleRecuperation,
} from "@/lib/programmes-socles/catalogue";

// Lecture des programmes socles (24/08/2026) — voir cle.ts pour le pourquoi
// du découpage par pilier.
//
// Un JSON éditorial peut surcharger une combinaison précise dans data/.
// Toutes les autres combinaisons sont construites par le catalogue local
// déterministe : zéro appel IA, contenu versionné et résultat reproductible.

type ProfilSocle = {
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
  allergiesAlimentaires?: string | null;
  habitudesAlimentaires?: string | null;
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
 * Socle d'un pilier pour ce profil. Un JSON relu peut remplacer la version
 * déterministe ; sinon le catalogue produit exactement la combinaison
 * attendue à partir des axes autorisés.
 *
 * Chaque pilier est lu indépendamment : une nutrition socle peut être servie
 * pendant qu'un entraînement est généré sur mesure, si seul ce dernier
 * manque à la bibliothèque.
 */
export async function socleEntrainement(profil: ProfilSocle) {
  const cle = cleEntrainement(profil);
  return (await lire("entrainement", cle)) ?? construireSocleEntrainement(cle);
}

export async function socleNutrition(profil: ProfilSocle) {
  const cle = cleNutrition(profil);
  return (await lire("nutrition", cle)) ?? construireSocleNutrition(cle);
}

export async function socleRecuperation(profil: ProfilSocle) {
  const cle = cleRecuperation(profil);
  return (await lire("recuperation", cle)) ?? construireSocleRecuperation(cle);
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
  allergiesAlimentaires?: string | null;
}): boolean {
  if (profil.statutMaternite) return false;
  const estVide = (valeur: string | null | undefined) => {
    const normalisee = (valeur ?? "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "");
    return !normalisee || /^(aucun|aucune|neant|non|ras|r\.a\.s\.?|rien)$/.test(normalisee);
  };
  if (!estVide(profil.contraintesSante)) return false;
  const alimentation = (profil.allergiesAlimentaires ?? "").trim().toLowerCase();
  if (estVide(alimentation)) return true;
  // Les régimes éditoriaux couverts ont leur propre menu. Une allergie ou
  // intolérance médicale spécifique reste hors socle : la simple exclusion
  // d'un mot ne suffit pas à garantir l'absence de traces ou de dérivés.
  if (/allerg|intol[ée]ran/.test(alimentation)) return false;
  return /sans gluten|gluten free|v[ée]g[ée]tar|vegan|v[ée]g[ée]talien|pal[ée]o/.test(alimentation);
}
