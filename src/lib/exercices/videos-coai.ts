type EntreeVideo = { motifs: string[]; fichier: string };

const TABLE: EntreeVideo[] = [
  // Deadlifts
  { motifs: ["deadlift conventionnel", "soulevé de terre conventionnel", "deadlift"], fichier: "deadlift-conventionnel" },
];

export function videoCoaiPourNom(nom: string): string | null {
  const normalise = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  const entree = TABLE.find((e) =>
    e.motifs.some((m) => normalise.includes(m.normalize("NFD").replace(/[̀-ͯ]/g, "")))
  );
  return entree ? `/videos/exercices/${entree.fichier}.mp4` : null;
}
