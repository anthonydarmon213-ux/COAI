// Owner decision 13/09/2026: review status is not a training access gate.
// Rejected/unknown statuses remain excluded. Never change the stored status.
export function accessibleTraining<T extends { statut: string }>(validated: T | null, latest: T | null): T | null {
  if (validated?.statut === "VALIDE") return validated;
  return latest && ["VALIDE", "GENERE_IA", "EN_ATTENTE"].includes(latest.statut) ? latest : null;
}
