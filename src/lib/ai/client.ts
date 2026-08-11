import Anthropic from "@anthropic-ai/sdk";

// Client IA pour la génération dynamique des programmes.
// Aucune bibliothèque de programmes pré-construite : chaque appel régénère
// le contenu à partir du profil utilisateur courant (cf. décisions actées).

export type ProfilUtilisateur = {
  objectifs?: string | null;
  niveau?: string | null;
  equipementDisponible?: string | null;
  contraintesSante?: string | null;
  antecedentsMedicaux?: string | null;
  tailleCm?: number | null;
  age?: number | null;
  sexe?: string | null;
  morphologie?: string | null;
  frequenceEntrainement?: string | null;
  sportsPratiques?: string | null;
  habitudesAlimentaires?: string | null;
  allergiesAlimentaires?: string | null;
  repasParJour?: string | null;
  hydratation?: string | null;
  consommationCafe?: string | null;
  consommationAlcool?: string | null;
  qualiteSommeil?: string | null;
  // Extraites automatiquement d'un screenshot de montre/app santé connectée.
  pasMoyenParJour?: number | null;
  frequenceCardiaqueRepos?: number | null;
  sommeilMoyenHeures?: number | null;
  vo2Max?: number | null;
  caloriesMoyennesParJour?: number | null;
  resumeMontre?: string | null;
  // Extraites automatiquement d'une photo en tenue de sport.
  morphologieDetectee?: string | null;
  observationsPosture?: string | null;
  // Directive du moteur d'adaptation (11/08/2026, cf. src/lib/adaptation) —
  // présente uniquement lors d'une régénération suite à une adaptation
  // (pas à la toute première génération). Injectée dans les prompts de
  // structure pour que le programme régénéré applique la décision prise
  // (ex: "augmente légèrement la charge du développé couché, réduis le
  // volume jambes") plutôt que de repartir de zéro à chaque fois.
  directivesAdaptation?: string | null;
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

type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

// Appelle le modèle avec une image en entrée (en plus du prompt texte) et
// renvoie le JSON généré, parsé — utilisé pour l'extraction de données
// depuis un screenshot (ex: montre connectée). Contrairement à
// generateWithAI, le prompt doit explicitement dire au modèle de ne pas
// halluciner les valeurs illisibles/absentes sur l'image.
export async function generateWithVision<T = unknown>(
  prompt: string,
  imageBase64: string,
  mediaType: ImageMediaType
): Promise<T> {
  const model = process.env.AI_MODEL || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: imageBase64 } },
          { type: "text", text: `${prompt}\n\n${JSON_INSTRUCTION}` },
        ],
      },
    ],
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

// Appelle le modèle et renvoie une réponse en texte libre (pas de JSON) —
// utilisé pour les réponses conversationnelles (ex: question au coach IA),
// à la différence de generateWithAI qui structure toujours un programme.
export async function generateTextWithAI(prompt: string): Promise<string> {
  const model = process.env.AI_MODEL || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim();
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
