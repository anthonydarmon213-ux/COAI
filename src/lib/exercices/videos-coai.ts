type EntreeVideo = {
  motifs: string[];
  nomsExacts?: string[];
  fichier: string;
};

function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

const TABLE: EntreeVideo[] = [
  // Deadlifts
  {
    motifs: ["deadlift conventionnel", "soulevé de terre conventionnel"],
    nomsExacts: ["deadlift", "soulevé de terre"],
    fichier: "deadlift-conventionnel",
  },
];

export function videoCoaiPourNom(nom: string): string | null {
  const normalise = normaliser(nom);
  const entree = TABLE.find((e) =>
    e.motifs.some((motif) => normalise.includes(normaliser(motif))) ||
    e.nomsExacts?.some((nomExact) => normalise === normaliser(nomExact))
  );
  return entree ? `/videos/exercices/${entree.fichier}.mp4` : null;
}
