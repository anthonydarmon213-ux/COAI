// Bibliothèque de programmes socles (24/08/2026, décision Anthony : "il faut
// faire des génériques pour le full IA, et plus personnalisé pour l'ultimus").
//
// POURQUOI
// Une génération sur mesure déclenche ~21 appels IA. Servie à chaque abonné
// Pass IA (49 €/an, ~4 €/mois), elle coûte plus que l'abonnement — alors que
// deux personnes de même objectif, même niveau et même fréquence reçoivent
// des programmes très proches. Le socle est généré UNE fois, relu par
// Anthony, puis servi instantanément et gratuitement à tous ceux dont le
// profil correspond.
//
// Coaching Hybride et VIP gardent la génération sur mesure : c'est ce qui
// justifie l'écart de prix, et la différence devient enfin explicable.
//
// PAS D'AXE "LIEU" NI "MATÉRIEL"
// Le socle est construit pour une salle équipée, et variantes.ts substitue
// les exercices à l'affichage selon le matériel réellement disponible
// (haltères / élastique / poids du corps). Ajouter ces axes aurait multiplié
// la bibliothèque par trois pour un résultat que le système de substitution
// produit déjà.

export type ObjectifSocle = "PERTE" | "MUSCLE" | "FORME" | "PERFORMANCE";
export type NiveauSocle = "DEBUTANT" | "INTERMEDIAIRE" | "AVANCE";
/** Séances par semaine — 5 couvre aussi "6 fois ou plus". */
export type FrequenceSocle = 1 | 2 | 3 | 4 | 5;

export type CleSocle = `${ObjectifSocle}_${NiveauSocle}_${FrequenceSocle}`;

/**
 * Objectif du profil ramené à l'un des quatre socles.
 *
 * Les objectifs du diagnostic sont un texte libre concaténé ("Perdre du gras
 * — activité quotidienne : ...") : on cherche donc des marqueurs, pas une
 * égalité stricte. L'ordre compte — "progresser en force" contient "force",
 * qui relève de la performance, mais reste avant tout une prise de muscle.
 */
export function objectifSocle(objectifs: string | null | undefined): ObjectifSocle {
  const t = (objectifs ?? "").toLowerCase();

  if (/perdre du gras|perte de poids|s[ée]cher|maigrir|affiner/.test(t)) return "PERTE";
  if (/prendre du muscle|prise de masse|hypertrophie|me muscler/.test(t)) return "MUSCLE";
  if (/force|performance|comp[ée]tition|course|marathon|hyrox/.test(t)) return "PERFORMANCE";
  // "Me sentir mieux", "Reprendre le sport", "Gagner en mobilité" et tout
  // objectif libre non reconnu tombent ici : un programme équilibré et
  // prudent est le choix le plus sûr quand l'intention n'est pas explicite.
  return "FORME";
}

export function niveauSocle(niveau: string | null | undefined): NiveauSocle {
  const t = (niveau ?? "").toLowerCase();
  if (t.includes("avanc")) return "AVANCE";
  if (t.includes("interm")) return "INTERMEDIAIRE";
  // Débutant par défaut : sur un doute, le programme le plus prudent.
  return "DEBUTANT";
}

export function frequenceSocle(frequence: string | null | undefined): FrequenceSocle {
  const n = Number((frequence ?? "").match(/\d+/)?.[0]);
  if (!Number.isFinite(n)) return 3; // valeur la plus courante
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as FrequenceSocle;
}

export function cleSocle(profil: {
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
}): CleSocle {
  return `${objectifSocle(profil.objectifs)}_${niveauSocle(profil.niveau)}_${frequenceSocle(
    profil.frequenceEntrainement
  )}` as CleSocle;
}

/** Les 60 combinaisons : 4 objectifs × 3 niveaux × 5 fréquences. */
export function toutesLesCles(): CleSocle[] {
  const objectifs: ObjectifSocle[] = ["PERTE", "MUSCLE", "FORME", "PERFORMANCE"];
  const niveaux: NiveauSocle[] = ["DEBUTANT", "INTERMEDIAIRE", "AVANCE"];
  const frequences: FrequenceSocle[] = [1, 2, 3, 4, 5];
  return objectifs.flatMap((o) =>
    niveaux.flatMap((n) => frequences.map((f) => `${o}_${n}_${f}` as CleSocle))
  );
}
