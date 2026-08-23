// Substitutions d'exercices par matériel (23/08/2026, demande Anthony :
// "Pas de TRX / Changer le matériel" avec 3 alternatives instantanées).
//
// Extrait de seance-runner.tsx, où la table vivait en dur avec une seule
// variante par mouvement, inutilisable ailleurs. Partagé maintenant entre
// le lecteur de séance et la fiche d'exercice.
//
// Table écrite à la main, jamais déduite par mots-clés génériques :
// proposer un mouvement approximatif pour un exercice mal reconnu serait
// pire que ne rien proposer — l'utilisateur ferait un exercice qui ne
// travaille pas ce qui était prévu, en croyant suivre son programme. Un
// exercice absent de la table n'affiche simplement pas l'option.

export type MaterielCible = "halteres" | "elastique" | "poids_du_corps";

export type Variante = {
  materiel: MaterielCible;
  nom: string;
  consigne: string;
};

export const MATERIEL_LABEL: Record<MaterielCible, string> = {
  halteres: "Haltères",
  elastique: "Élastique",
  poids_du_corps: "Poids du corps",
};

type Entree = { motifs: string[]; variantes: Variante[] };

const TABLE: Entree[] = [
  {
    motifs: ["développé couché", "developpe couche", "bench press", "presse pectoraux", "chest press", "pec deck", "écarté", "ecarte", "butterfly", "pectoraux machine"],
    variantes: [
      { materiel: "halteres", nom: "Développé couché haltères", consigne: "Au sol si tu n'as pas de banc : l'amplitude est réduite, garde le même contrôle." },
      { materiel: "elastique", nom: "Développé élastique debout", consigne: "Élastique dans le dos, passé sous les aisselles. Pousse devant toi, coudes à 45°." },
      { materiel: "poids_du_corps", nom: "Pompes (mains larges)", consigne: "Pieds surélevés pour durcir, genoux au sol pour alléger." },
    ],
  },
  {
    motifs: ["développé incliné", "developpe incline", "incline press"],
    variantes: [
      { materiel: "halteres", nom: "Développé incliné haltères", consigne: "Banc à 30°, pas plus : au-delà, ce sont les épaules qui travaillent." },
      { materiel: "elastique", nom: "Développé élastique en diagonale", consigne: "Ancre l'élastique bas, pousse vers le haut en diagonale." },
      { materiel: "poids_du_corps", nom: "Pompes pieds surélevés", consigne: "Pieds sur un banc : l'angle reproduit le travail du haut des pectoraux." },
    ],
  },
  {
    motifs: ["développé militaire", "developpe militaire", "shoulder press", "développé épaules", "developpe epaules", "overhead press"],
    variantes: [
      { materiel: "halteres", nom: "Développé militaire haltères", consigne: "Assis dos calé si tu cambres. Ne verrouille pas brutalement les coudes." },
      { materiel: "elastique", nom: "Développé vertical élastique", consigne: "Élastique sous les pieds, pousse au-dessus de la tête sans cambrer." },
      { materiel: "poids_du_corps", nom: "Pompes piquées (pike push-up)", consigne: "Bassin haut, tête vers le sol : la poussée devient verticale." },
    ],
  },
  {
    motifs: ["tirage vertical", "tirage poulie haute", "poulie haute", "tirage nuque", "lat pulldown", "traction", "pull up", "pull-up"],
    variantes: [
      { materiel: "halteres", nom: "Pull-over haltère", consigne: "Allongé, bras tendus derrière la tête, ramène l'haltère au-dessus du buste." },
      { materiel: "elastique", nom: "Tirage vertical élastique", consigne: "Élastique ancré en hauteur, tire vers le haut de la poitrine, omoplates serrées." },
      { materiel: "poids_du_corps", nom: "Rowing inversé (table ou barre basse)", consigne: "Plus tu es horizontal, plus c'est dur. Corps gainé de la tête aux talons." },
    ],
  },
  {
    motifs: ["tirage horizontal", "tirage poulie basse", "poulie basse", "rowing", "seated row", "row machine"],
    variantes: [
      { materiel: "halteres", nom: "Rowing haltère unilatéral", consigne: "Un genou et une main en appui, dos plat, tire l'haltère vers la hanche." },
      { materiel: "elastique", nom: "Rowing élastique assis", consigne: "Élastique autour des pieds, tire les coudes le long du corps." },
      { materiel: "poids_du_corps", nom: "Rowing inversé", consigne: "Sous une table solide ou une barre basse. Recule les pieds pour durcir." },
    ],
  },
  {
    motifs: ["squat", "presse à cuisses", "presse a cuisses", "leg press", "hack squat", "leg extension", "extension jambes", "quadriceps machine"],
    variantes: [
      { materiel: "halteres", nom: "Squat gobelet", consigne: "Haltère contre la poitrine, buste droit, coudes entre les genoux en bas." },
      { materiel: "elastique", nom: "Squat élastique", consigne: "Élastique sous les pieds et sur les épaules. Garde la tension en montant." },
      { materiel: "poids_du_corps", nom: "Squat bulgare (une jambe)", consigne: "Pied arrière surélevé : une jambe à la fois compense l'absence de charge." },
    ],
  },
  {
    motifs: ["soulevé de terre", "souleve de terre", "deadlift", "romanian", "hip thrust", "fessier"],
    variantes: [
      { materiel: "halteres", nom: "Soulevé de terre roumain haltères", consigne: "Jambes presque tendues, pousse les hanches vers l'arrière, dos plat." },
      { materiel: "elastique", nom: "Hip thrust élastique", consigne: "Élastique sur les hanches, dos calé. Serre les fessiers en haut." },
      { materiel: "poids_du_corps", nom: "Hip thrust une jambe", consigne: "Dos calé, une jambe tendue, pousse par le talon." },
    ],
  },
  {
    motifs: ["fente", "lunge", "split squat"],
    variantes: [
      { materiel: "halteres", nom: "Fentes haltères", consigne: "Un haltère dans chaque main, grand pas, genou arrière vers le sol." },
      { materiel: "elastique", nom: "Fentes élastique", consigne: "Élastique sous le pied avant, tenu aux épaules." },
      { materiel: "poids_du_corps", nom: "Fentes marchées", consigne: "Sans charge : ralentis la descente à 3 secondes pour garder la difficulté." },
    ],
  },
  {
    motifs: ["curl", "biceps"],
    variantes: [
      { materiel: "halteres", nom: "Curl haltères", consigne: "Coudes fixes le long du corps, ne balance pas le buste." },
      { materiel: "elastique", nom: "Curl élastique", consigne: "Élastique sous les pieds, monte en contrôlant la descente." },
      { materiel: "poids_du_corps", nom: "Curl TRX / renversé", consigne: "Sangles ou table basse, paumes vers le haut, corps incliné en arrière." },
    ],
  },
  {
    motifs: ["triceps", "extension", "pushdown", "dips"],
    variantes: [
      { materiel: "halteres", nom: "Extension triceps haltère au-dessus de la tête", consigne: "Coude fixe, seul l'avant-bras bouge." },
      { materiel: "elastique", nom: "Extension triceps élastique", consigne: "Élastique ancré en hauteur, tends les avant-bras vers le bas." },
      { materiel: "poids_du_corps", nom: "Dips sur banc / chaise", consigne: "Mains derrière toi sur un appui stable, coudes vers l'arrière." },
    ],
  },
  {
    motifs: ["leg curl", "ischio"],
    variantes: [
      { materiel: "halteres", nom: "Soulevé de terre jambes tendues", consigne: "Charge légère, l'étirement des ischios prime sur le poids." },
      { materiel: "elastique", nom: "Leg curl élastique", consigne: "Élastique à la cheville, ancré devant. Ramène le talon vers le fessier." },
      { materiel: "poids_du_corps", nom: "Curl ischio glissé", consigne: "Allongé, bassin décollé, talons sur une serviette. Tends puis ramène sans laisser tomber les hanches." },
    ],
  },
  {
    motifs: ["mollet", "calf", "extension chevilles"],
    variantes: [
      { materiel: "halteres", nom: "Mollets debout haltères", consigne: "Sur une marche pour l'amplitude complète, une pause en haut." },
      { materiel: "elastique", nom: "Mollets élastique", consigne: "Élastique sous la plante, pointe le pied contre la résistance." },
      { materiel: "poids_du_corps", nom: "Mollets debout sur une marche", consigne: "Une jambe si c'est trop facile. Descends sous la marche." },
    ],
  },
  {
    motifs: ["élévation latérale", "elevation laterale", "lateral raise", "deltoïde", "deltoide"],
    variantes: [
      { materiel: "halteres", nom: "Élévations latérales haltères", consigne: "Monte à hauteur d'épaule, pas plus haut. Charge légère, contrôle total." },
      { materiel: "elastique", nom: "Élévations latérales élastique", consigne: "Élastique sous les pieds, ouvre les bras sur les côtés." },
      { materiel: "poids_du_corps", nom: "Pompes piquées", consigne: "Faute de charge, le travail d'épaule passe par la poussée verticale." },
    ],
  },
];

/**
 * Alternatives pour un exercice donné, hors matériel déjà utilisé.
 * Renvoie un tableau vide si le mouvement n'est pas reconnu de façon
 * fiable — mieux vaut ne rien proposer qu'un mouvement approximatif.
 */
export function variantesPourExercice(nom: string): Variante[] {
  const normalise = nom.toLowerCase();
  const entree = TABLE.find((e) => e.motifs.some((m) => normalise.includes(m)));
  if (!entree) return [];
  // Ne propose pas une variante identique à l'exercice déjà prévu.
  return entree.variantes.filter((v) => v.nom.toLowerCase() !== normalise);
}
