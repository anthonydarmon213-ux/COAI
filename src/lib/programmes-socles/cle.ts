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

// UNE CLÉ PAR PILIER, pas une clé unique (24/08/2026, remarque d'Anthony :
// "60 c'est beaucoup"). Les trois piliers ne dépendent pas des mêmes axes,
// et les générer tous les trois pour chaque combinaison revenait à produire
// quinze fois la même nutrition sous des étiquettes différentes.
//
//   Entraînement  objectif × niveau × fréquence   (45 — voir ci-dessous)
//   Nutrition     objectif seul                   (4)
//   Récupération  fréquence seule                 (5)
//
// Soit 54 fichiers et ~370 appels IA au lieu de 180 fichiers et ~1 260.
// Surtout : 9 fichiers à relire côté nutrition et récupération au lieu
// de 120.

/**
 * Clé entraînement.
 *
 * Chez un DÉBUTANT, l'objectif ne change quasiment pas la séance : c'est du
 * full body sur les mouvements de base dans tous les cas, la différence se
 * joue dans l'assiette (arbitrage validé par Anthony, coach). Les quatre
 * objectifs partagent donc un même socle "BASE" à ce niveau — 5 programmes
 * au lieu de 20, et 45 fichiers au total.
 */
export type CleEntrainement =
  | `BASE_DEBUTANT_${FrequenceSocle}`
  | `${ObjectifSocle}_INTERMEDIAIRE_${FrequenceSocle}`
  | `${ObjectifSocle}_AVANCE_${FrequenceSocle}`;

/** La nutrition ne dépend pas de la fréquence d'entraînement : déficit,
 *  surplus ou maintien découlent de l'objectif. Les cibles chiffrées, elles,
 *  restent calculées sur le profil réel de la personne. */
export type CleNutrition = ObjectifSocle;

/** La récupération suit le volume d'entraînement, pas l'objectif : cinq
 *  séances par semaine demandent autre chose qu'une seule. */
export type CleRecuperation = `FREQ_${FrequenceSocle}`;

export function cleEntrainement(profil: {
  objectifs?: string | null;
  niveau?: string | null;
  frequenceEntrainement?: string | null;
}): CleEntrainement {
  const niveau = niveauSocle(profil.niveau);
  const frequence = frequenceSocle(profil.frequenceEntrainement);
  if (niveau === "DEBUTANT") return `BASE_DEBUTANT_${frequence}`;
  return `${objectifSocle(profil.objectifs)}_${niveau}_${frequence}` as CleEntrainement;
}

export function cleNutrition(profil: { objectifs?: string | null }): CleNutrition {
  return objectifSocle(profil.objectifs);
}

export function cleRecuperation(profil: { frequenceEntrainement?: string | null }): CleRecuperation {
  return `FREQ_${frequenceSocle(profil.frequenceEntrainement)}`;
}

const OBJECTIFS: ObjectifSocle[] = ["PERTE", "MUSCLE", "FORME", "PERFORMANCE"];
const FREQUENCES: FrequenceSocle[] = [1, 2, 3, 4, 5];

/** Les 45 clés d'entraînement à générer. */
export function toutesLesClesEntrainement(): CleEntrainement[] {
  return [
    ...FREQUENCES.map((f) => `BASE_DEBUTANT_${f}` as CleEntrainement),
    ...OBJECTIFS.flatMap((o) =>
      FREQUENCES.flatMap((f) => [
        `${o}_INTERMEDIAIRE_${f}` as CleEntrainement,
        `${o}_AVANCE_${f}` as CleEntrainement,
      ])
    ),
  ];
}

export function toutesLesClesNutrition(): CleNutrition[] {
  return [...OBJECTIFS];
}

export function toutesLesClesRecuperation(): CleRecuperation[] {
  return FREQUENCES.map((f) => `FREQ_${f}` as CleRecuperation);
}
