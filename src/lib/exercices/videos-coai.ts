type EntreeVideo = {
  motifs: string[];
  nomsExacts?: string[];
  fichier: string;
  validee: boolean;
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
    // Mise en attente tant que le mouvement n'a pas été revu image par
    // image par un coach. Une vidéo IA ne doit jamais devenir une preuve
    // technique par sa seule présence dans /public.
    validee: false,
  },
];

export function videoCoaiPourNom(nom: string): string | null {
  const normalise = normaliser(nom);
  const entree = TABLE.find((e) =>
    e.motifs.some((motif) => normalise.includes(normaliser(motif))) ||
    e.nomsExacts?.some((nomExact) => normalise === normaliser(nomExact))
  );
  return entree?.validee ? `/videos/exercices/${entree.fichier}.mp4` : null;
}
