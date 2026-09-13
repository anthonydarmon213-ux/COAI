// Pas de clé partagée : le compte et la prescription identifient le brouillon.
// JSON évite les collisions de séparateurs et de hash. Aucun secret dans la clé.
export function sessionDraftKey(userId: string | undefined, nom: string, exercices: unknown[], echauffement?: string, retourAuCalme?: string): string | null {
  if (!userId) return null; // aperçu admin : ne pas reprendre les charges d'un client
  return `coai:seance:v2:${JSON.stringify([userId, nom, exercices, echauffement ?? null, retourAuCalme ?? null])}`;
}
