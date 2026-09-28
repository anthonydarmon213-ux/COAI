import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { closePhotoWrites, confirmPhotoWrite, reservePhotoWrite } from "./photo-write-registry";

// Nom exact du bucket privé existant dans Supabase.
export const PROGRESS_PHOTOS_BUCKET = "progress photos";

const SIGNED_URL_TTL_SECONDS = 3600;

async function storeRegisteredPhoto(userId: string, file: File, avatar: boolean): Promise<{ path: string } | { error: string }> {
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const admin = createSupabaseAdminClient();
  const body = await file.arrayBuffer();
  const operation = await reservePhotoWrite(userId);
  const path = `${userId}/${avatar ? "avatar" : operation}.${ext}`;
  const bucket = admin.storage.from(PROGRESS_PHOTOS_BUCKET);

  // A lost response is recoverable only with positive evidence for THIS write,
  // not merely an existing avatar, matching bytes, or an elapsed timeout.
  async function storedOperationMatches(): Promise<boolean> {
    try {
      const { data, error } = await bucket.info(path);
      return !error && data.name === path && data.bucketId === PROGRESS_PHOTOS_BUCKET
        && data.metadata?.coaiUploadOperation === operation;
    } catch {
      return false;
    }
  }

  try {
    const { error } = await bucket.upload(path, body, {
      contentType: file.type, upsert: avatar,
      metadata: { coaiUploadOperation: operation },
    });
    if (error && !await storedOperationMatches()) return { error: error.message };
  } catch (error) {
    if (!await storedOperationMatches()) throw error;
  }

  await confirmPhotoWrite(userId, operation);
  return { path };
}

export async function uploadProgressPhoto(userId: string, file: File): Promise<{ path: string } | { error: string }> {
  return storeRegisteredPhoto(userId, file, false);
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
  // Do not delete the current avatar before the replacement is stored and its
  // path saved by the caller. Keep the other format variants (at most three
  // fixed paths) so a failed upload/database write cannot break the old path.
  // Account deletion removes all variants through deleteAllProgressPhotos.
  return storeRegisteredPhoto(userId, file, true);
}

export async function deleteAllProgressPhotos(userId: string): Promise<void> {
  // Never allow an empty/root prefix with the privileged Storage client.
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("invalid_photo_owner");
  await closePhotoWrites(userId);
  const admin = createSupabaseAdminClient();
  const bucket = admin.storage.from(PROGRESS_PHOTOS_BUCKET);
  const paths = new Set<string>();
  // Collect before deleting: increasing an offset while deleting skips objects.
  // Uploads create flat files only; unexpected subfolders require investigation.
  for (let offset = 0; ; offset += 100) {
    const { data: files, error } = await bucket.list(userId, {
      limit: 100, offset, sortBy: { column: "name", order: "asc" },
    });
    if (error || !files) throw new Error("photo_listing_failed");
    for (const file of files) {
      if (!file.id || !file.name || file.name.includes("/") || file.name.includes("\\") || file.name.includes("..")) {
        throw new Error("unexpected_photo_entry");
      }
      const path = `${userId}/${file.name}`;
      if (paths.has(path)) throw new Error("unstable_photo_listing");
      paths.add(path);
    }
    if (files.length < 100) break;
    if (paths.size >= 10000) throw new Error("photo_cleanup_requires_assistance");
  }

  const allPaths = [...paths];
  for (let offset = 0; offset < allPaths.length; offset += 100) {
    const { error } = await bucket.remove(allPaths.slice(offset, offset + 100));
    if (error) throw new Error("photo_removal_failed");
  }
  // Also catches an apparently successful but incomplete removal, or an upload
  // racing the cleanup. Do not delete the profile when objects still remain.
  const { data: remaining, error } = await bucket.list(userId, { limit: 1, offset: 0 });
  if (error || !remaining || remaining.length > 0) throw new Error("photo_cleanup_unconfirmed");
}
