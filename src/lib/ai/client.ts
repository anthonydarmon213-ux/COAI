import Anthropic from "@anthropic-ai/sdk";

// Client IA pour la génération dynamique des programmes.
// Aucune bibliothèque de programmes pré-construite : chaque appel régénère
// le contenu à partir du profil utilisateur courant (cf. décisions actées).

export type ProfilUtilisateur = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
  tailleCm?: number | null;
  morphologie?: string | null;
  entrainementActuel?: string | null;
  habitudesAlimentaires?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
};

let client: Anthropic | null = null;

function getClient(): Anthropic {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) {
    throw new Error("AI_API_KEY manquant dans l'environnement");
  }
  if (!client) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

const JSON_INSTRUCTION =
  "Réponds uniquement avec un objet JSON valide, sans texte avant ou après, sans balises markdown.";

// Appelle le modèle et renvoie le JSON généré, parsé.
export async function generateWithAI<T = unknown>(prompt: string): Promise<T> {
  const model = process.env.AI_MODEL || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 8192,
    messages: [{ role: "user", content: `${prompt}\n\n${JSON_INSTRUCTION}` }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Réponse IA tronquée (max_tokens atteint), génération à réessayer");
  }

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseJsonResponse<T>(text);
}

function parseJsonResponse<T>(text: string): T {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  const jsonText = jsonMatch ? jsonMatch[0] : trimmed;

  try {
    return JSON.parse(jsonText) as T;
  } catch {
    throw new Error("Réponse IA non-JSON reçue, génération à réessayer");
  }
}
