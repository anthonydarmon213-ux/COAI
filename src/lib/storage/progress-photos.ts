import { createSupabaseAdminClient } from "@/lib/auth/admin";

// Bucket privé Supabase Storage — à créer manuellement dans le dashboard
// (Storage → New bucket → "progress-photos", Public: OFF).
export const PROGRESS_PHOTOS_BUCKET = "progress-photos";

const SIGNED_URL_TTL_SECONDS = 3600;

export async function uploadProgressPhoto(
  userId: string,
  file: File
): Promise<{ path: string } | { error: string }> {
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const admin = createSupabaseAdminClient();
  const { error } = await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type });

  if (error) return { error: error.message };
  return { path };
}

export async function getSignedProgressPhotoUrl(path: string): Promise<string | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

export async function deleteAllProgressPhotos(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: files } = await admin.storage.from(PROGRESS_PHOTOS_BUCKET).list(userId);
  if (!files || files.length === 0) return;

  await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .remove(files.map((f) => `${userId}/${f.name}`));
}
