import { createSupabaseAdminClient } from "@/lib/auth/admin";

// Bucket privé Supabase Storage — à créer manuellement dans le dashboard
// (Storage → New bucket → "form-checks", Public: OFF). Les vidéos montrent
// des membres en train de s'entraîner : elles ne doivent jamais être
// accessibles par URL publique, seulement via une URL signée expirante.
export const FORM_CHECKS_BUCKET = "form-checks";

const SIGNED_URL_TTL_SECONDS = 3600;

// 60 Mo : une série filmée au téléphone en quelques secondes pèse rarement
// plus, et au-delà l'envoi échoue silencieusement sur un réseau mobile.
export const TAILLE_MAX_OCTETS = 60 * 1024 * 1024;

export const TYPES_ACCEPTES = ["video/mp4", "video/quicktime", "video/webm"] as const;

export function extensionPourType(type: string): string | null {
  if (type === "video/mp4") return "mp4";
  if (type === "video/quicktime") return "mov";
  if (type === "video/webm") return "webm";
  return null;
}

export async function uploadFormCheckVideo(
  userId: string,
  file: File
): Promise<{ path: string } | { error: string }> {
  const ext = extensionPourType(file.type);
  if (!ext) return { error: "Format vidéo non pris en charge." };
  if (file.size > TAILLE_MAX_OCTETS) return { error: "Vidéo trop lourde (60 Mo maximum)." };

  const path = `${userId}/${Date.now()}.${ext}`;
  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage
    .from(FORM_CHECKS_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (error) return { error: error.message };
  return { path };
}

export async function getSignedFormCheckUrl(path: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(FORM_CHECKS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}
