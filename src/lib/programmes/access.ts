// Owner decision 13/09/2026: review status is not a training access gate.
// Rejected/unknown statuses remain excluded. Never change the stored status.
export function accessibleTraining<T extends { statut: string }>(validated: T | null, latest: T | null): T | null {
  if (validated?.statut === "VALIDE") return validated;
  return latest && ["VALIDE", "GENERE_IA", "EN_ATTENTE"].includes(latest.statut) ? latest : null;
}

// Match the programme screen, without widening nutrition/recovery access.
export function accessibleProgrammePdf<T extends { statut: string }>(pilier: string, validated: T | null, latest: T | null): T | null {
  if (pilier === "ENTRAINEMENT") return accessibleTraining(validated, latest);
  if (validated?.statut === "VALIDE") return validated;
  return latest?.statut === "GENERE_IA" ? latest : null;
}
