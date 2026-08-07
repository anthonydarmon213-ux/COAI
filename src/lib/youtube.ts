const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

// Extrait l'identifiant d'une vidéo à partir des formats d'URL YouTube
// courants (watch?v=, youtu.be/, embed/, shorts/) ou d'un ID déjà brut.
export function extractYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (YOUTUBE_ID_PATTERN.test(trimmed)) return trimmed;

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  if (url.hostname === "youtu.be") {
    const id = url.pathname.slice(1);
    return YOUTUBE_ID_PATTERN.test(id) ? id : null;
  }

  if (url.hostname.endsWith("youtube.com")) {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && YOUTUBE_ID_PATTERN.test(id) ? id : null;
    }
    const match = url.pathname.match(/^\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1] ?? null;
  }

  return null;
}
