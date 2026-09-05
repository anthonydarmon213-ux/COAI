import { createSupabaseAdminClient } from "@/lib/auth/admin";

// Nom exact du bucket privé existant dans Supabase.
export const PROGRESS_PHOTOS_BUCKET = "progress photos";

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

export function isOwnedProgressPhotoPath(userId: string, path: string): boolean {
  return path.startsWith(`${userId}/`) && !path.includes("..") && !path.includes("\\");
}

export async function getSignedProgressPhotoUrl(userId: string, path: string): Promise<string | null> {
  if (!isOwnedProgressPhotoPath(userId, path)) return null;
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) return null;
  return data.signedUrl;
}

export async function uploadAvatar(
  userId: string,
  file: File
): Promise<{ path: string } | { error: string }> {
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const path = `${userId}/avatar.${ext}`;
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin.storage.from(PROGRESS_PHOTOS_BUCKET).list(userId, {
    search: "avatar.",
  });
  if (existing?.length) {
    await admin.storage.from(PROGRESS_PHOTOS_BUCKET).remove(
      existing.map((item) => `${userId}/${item.name}`)
    );
  }

  const { error } = await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: true });

  if (error) return { error: error.message };
  return { path };
}

export async function deleteAllProgressPhotos(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { data: files } = await admin.storage.from(PROGRESS_PHOTOS_BUCKET).list(userId);
  if (!files || files.length === 0) return;

  await admin.storage
    .from(PROGRESS_PHOTOS_BUCKET)
    .remove(files.map((f) => `${userId}/${f.name}`));
}
