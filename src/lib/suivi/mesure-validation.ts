import { z } from "zod";

function boundedNumber(message: string) {
  return z.number({ invalid_type_error: message }).finite(message);
}

const weightMessage = "Indique un poids supérieur à 0 et inférieur ou égal à 500 kg.";
const waistMessage = "Indique un tour de taille supérieur à 0 et inférieur ou égal à 300 cm.";
const fatMessage = "Indique un pourcentage entre 0 et 100.";
const muscleMessage = "Indique une masse musculaire supérieure à 0 et inférieure ou égale à 200 kg.";
const pulseMessage = "Indique un nombre entier entre 20 et 220 battements par minute.";

export const mesureBodySchema = z.object({
  date: z.string({ invalid_type_error: "Choisis une date valide.", required_error: "Choisis une date." })
    .min(1, "Choisis une date.")
    .pipe(z.coerce.date({ errorMap: () => ({ message: "Choisis une date valide." }) })),
  poidsKg: boundedNumber(weightMessage).positive(weightMessage).max(500, weightMessage).optional(),
  tourTailleCm: boundedNumber(waistMessage).positive(waistMessage).max(300, waistMessage).optional(),
  masseGrassePourcent: boundedNumber(fatMessage).min(0, fatMessage).max(100, fatMessage).optional(),
  masseMusculaireKg: boundedNumber(muscleMessage).positive(muscleMessage).max(200, muscleMessage).optional(),
  frequenceCardiaqueReposBpm: boundedNumber(pulseMessage).int(pulseMessage).min(20, pulseMessage).max(220, pulseMessage).optional(),
  notes: z.string().trim().max(2000, "Limite la note à 2 000 caractères.").optional(),
  photoPath: z.string().trim().max(500, "La référence de la photo est invalide.").optional(),
}).refine((data) =>
  [data.poidsKg, data.tourTailleCm, data.masseGrassePourcent, data.masseMusculaireKg,
    data.frequenceCardiaqueReposBpm].some((value) => value !== undefined)
  || Boolean(data.notes || data.photoPath),
{ message: "Ajoute au moins une mesure ou une photo avant d’enregistrer." });

export type MesureFieldErrors = Partial<Record<keyof z.input<typeof mesureBodySchema>, string>>;

export function mesureValidationErrors(error: z.ZodError) {
  const fields: MesureFieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path[0] as keyof MesureFieldErrors | undefined;
    if (field && !fields[field]) fields[field] = issue.message;
  }
  return {
    fields,
    message: error.issues.find((issue) => issue.path.length === 0)?.message
      ?? "Vérifie les champs signalés avant d’enregistrer.",
  };
}
