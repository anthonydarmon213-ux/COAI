// Seul le serveur décide s'il s'agit du premier usage. L'identifiant sert
// uniquement au marqueur local de déduplication, jamais aux paramètres GA4.
export async function firstSavedConversionId(
  response: Response,
  source: "PROGRAMME" | "REPCOUNT",
): Promise<string | null> {
  if (!response.ok || response.headers.get("X-COAI-First-Source") !== "1") return null;
  try {
    const saved: unknown = await response.clone().json();
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return null;
    const { id, source: savedSource } = saved as Record<string, unknown>;
    return savedSource === source && typeof id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
      ? id : null;
  } catch {
    // Un corps illisible ne transforme pas une sauvegarde HTTP réussie en
    // échec utilisateur. Seule la mesure facultative est abandonnée.
    return null;
  }
}
