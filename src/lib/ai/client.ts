// Client IA pour la génération dynamique des programmes.
// Aucune bibliothèque de programmes pré-construite : chaque appel régénère
// le contenu à partir du profil utilisateur courant (cf. décisions actées).

export type ProfilUtilisateur = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
};

export async function generateWithAI(prompt: string): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;

  if (!apiKey || !model) {
    throw new Error("AI_API_KEY / AI_MODEL manquants dans l'environnement");
  }

  // TODO: brancher le SDK du fournisseur IA retenu (ex: Anthropic, OpenAI).
  throw new Error("generateWithAI: intégration à implémenter");
}
