import { filtrerExercicesAvecMedias } from "@/lib/exercices/media-coai";

/** Contrôle de complétude technique, pas une validation médicale. */
export function verifierQualiteSeance(value: unknown) {
  const erreurs: string[] = [];
  const seance = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  for (const champ of ["nom", "echauffement", "retourAuCalme"]) {
    if (typeof seance[champ] !== "string" || !(seance[champ] as string).trim()) erreurs.push(`${champ} manquant`);
  }
  const bruts = Array.isArray(seance.exercices) ? seance.exercices : [];
  const exercices = filtrerExercicesAvecMedias(bruts);
  if (!exercices.length) erreurs.push("aucun exercice démontré");
  if (exercices.length !== bruts.length) erreurs.push("exercice hors catalogue avec photo et vidéo");
  exercices.forEach((exercice, index) => {
    for (const champ of ["series", "repetitions", "repos"]) {
      const valeur = exercice[champ];
      if ((typeof valeur !== "string" && typeof valeur !== "number") || !/\d/.test(String(valeur))) {
        erreurs.push(`exercice ${index + 1} : ${champ} chiffré manquant`);
      }
    }
    for (const champ of ["charge", "methode"]) {
      if (typeof exercice[champ] !== "string" || !(exercice[champ] as string).trim()) erreurs.push(`exercice ${index + 1} : ${champ} manquant`);
    }
  });
  return { erreurs, seance: { ...seance, exercices } };
}
