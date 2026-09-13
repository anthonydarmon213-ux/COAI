import { z } from "zod";

const serie = z.object({
  reps: z.number().int().min(0).max(10000),
  charge: z.number().min(0).max(10000),
  dureeSecondes: z.number().int().min(1).max(3600).optional(),
});
const draft = z.object({
  version: z.literal(1), updatedAt: z.number().finite(),
  nom: z.string().max(200), reps: serie.shape.reps, charge: serie.shape.charge,
  maintien: z.boolean(), dureeSecondes: z.number().int().min(1).max(3600),
  sets: z.array(serie).max(200),
  exercicesSeance: z.array(z.object({ nom: z.string().max(200), sets: z.array(serie).max(200) })).max(100),
  notes: z.string().max(2000), dureeRepos: z.number().min(0).max(3600),
  finRepos: z.number().finite().nullable(),
  routine: z.array(z.string().min(1).max(200)).max(100).default([]),
  sauvegarde: z.object({ signature: z.string().max(500000), date: z.string().datetime() }).nullable(),
});
export type RepCountDraft = z.infer<typeof draft>;
export const draftKey = (userId: string) => `coai:repcount:v1:${encodeURIComponent(userId)}`;
export function parseDraft(raw: string | null, now = Date.now()): RepCountDraft | null {
  if (!raw || raw.length > 1000000) return null;
  try {
    const result = draft.safeParse(JSON.parse(raw));
    if (!result.success || result.data.updatedAt > now || now - result.data.updatedAt > 7 * 86400000) return null;
    return result.data;
  } catch { return null; }
}
