import { createSupabaseAdminClient } from "@/lib/auth/admin";
import { claimAvatarRetirements, clearDeletedAvatarRetirements, closePhotoWrites, confirmAvatarRetirement, confirmPhotoWrite, isValidAvatarRetirement, pendingAvatarRetirements, reservePhotoWrite, UnresolvedPhotoWritesError } from "./photo-write-registry";

// Nom exact du bucket privé existant dans Supabase.
export const PROGRESS_PHOTOS_BUCKET = "progress photos";

const SIGNED_URL_TTL_SECONDS = 3600;

async function storeRegisteredPhoto(userId: string, file: File): Promise<{ path: string } | { error: string }> {
  const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
  const admin = createSupabaseAdminClient();
  const body = await file.arrayBuffer();
  const operation = await reservePhotoWrite(userId);
  const path = `${userId}/${operation}.${ext}`;
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
      contentType: file.type, upsert: false,
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
  return storeRegisteredPhoto(userId, file);
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
  // path saved by the caller. Each operation has an immutable path: concurrent
  // replacements cannot erase each other's recovery proof or the old avatar.
  // The caller commits the new path and its predecessor's retirement together.
  return storeRegisteredPhoto(userId, file);
}

export async function purgeRetiredAvatars(userId: string): Promise<void> {
  const pending = await pendingAvatarRetirements(userId);
  if (!pending.length) return;
  const bucket = createSupabaseAdminClient().storage.from(PROGRESS_PHOTOS_BUCKET);
  for (const { id, name } of pending) {
    await removeRetiredAvatar(bucket, userId, id, name);
  }
}

type PhotoBucket = ReturnType<ReturnType<typeof createSupabaseAdminClient>["storage"]["from"]>;

async function removeRetiredAvatar(bucket: PhotoBucket, userId: string, id: string, name: string): Promise<void> {
  // Only previously published, durably retired paths; never sweep by age or
  // "not currently referenced", since an upload can be awaiting publication.
  const { error } = await bucket.remove([`${userId}/${name}`]);
  if (error) throw new Error("avatar_retirement_failed");
  const listed = await bucket.list(userId, { limit: 100, search: name });
  if (listed.error || !listed.data || listed.data.length >= 100 || listed.data.some(file => file.name === name)) {
    throw new Error("avatar_retirement_unconfirmed");
  }
  await confirmAvatarRetirement(userId, id, name);
}

export async function purgeRetiredAvatarBatch(): Promise<{ attempted: number; removed: number; deferred: number }> {
  const tasks = await claimAvatarRetirements();
  const result = { attempted: tasks.length, removed: 0, deferred: 0 };
  if (!tasks.length) return result;
  const bucket = createSupabaseAdminClient().storage.from(PROGRESS_PHOTOS_BUCKET);
  for (const task of tasks) {
    try {
      // The routing ID is temporary server-only data. Check it against the
      // hashed owner before using the privileged Storage client.
      if (!isValidAvatarRetirement(task)) throw new Error("invalid_retirement_owner");
      await removeRetiredAvatar(bucket, task.userId, task.id, task.name);
      result.removed++;
    } catch {
      // Keep the persistent task; continue other users without leaking paths.
      result.deferred++;
    }
  }
  return result;
}

async function listPhotoPaths(userId: string, bucket: PhotoBucket): Promise<string[]> {
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

  return [...paths];
}

export async function deleteAllProgressPhotos(userId: string): Promise<void> {
  // Never allow an empty/root prefix with the privileged Storage client.
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("invalid_photo_owner");
  const bucket = createSupabaseAdminClient().storage.from(PROGRESS_PHOTOS_BUCKET);
  try {
    await closePhotoWrites(userId);
  } catch (error) {
    if (!(error instanceof UnresolvedPhotoWritesError)) throw error;
    // Admissions are durably closed. Recover only positively identified writes
    // left by an interrupted process. No timestamp/absence-based expiry.
    const pending = new Set(error.operations);
    for (const path of await listPhotoPaths(userId, bucket)) {
      const name = path.slice(userId.length + 1);
      const match = /^(avatar|[0-9a-f-]{36})\.(jpg|png|webp)$/.exec(name);
      const stem = match?.[1];
      if (!stem || (stem !== "avatar" && !pending.has(stem))) continue;
      const { data, error: infoError } = await bucket.info(path);
      if (infoError || !data || data.name !== path || data.bucketId !== PROGRESS_PHOTOS_BUCKET) continue;
      const operation = data.metadata?.coaiUploadOperation;
      if (typeof operation !== "string" || !pending.has(operation)) continue;
      // A progress file must also be named after this exact operation.
      if (stem !== "avatar" && stem !== operation) continue;
      await confirmPhotoWrite(userId, operation);
      pending.delete(operation);
    }
    // Recheck before any removal; missing/overwritten proof remains unresolved.
    await closePhotoWrites(userId);
  }
  // Relist after all writers are confirmed: the recovery listing may have run
  // while an admitted upload was still finishing.
  const allPaths = await listPhotoPaths(userId, bucket);
  for (let offset = 0; offset < allPaths.length; offset += 100) {
    const { error } = await bucket.remove(allPaths.slice(offset, offset + 100));
    if (error) throw new Error("photo_removal_failed");
  }
  // Also catches an apparently successful but incomplete removal, or an upload
  // racing the cleanup. Do not delete the profile when objects still remain.
  const { data: remaining, error } = await bucket.list(userId, { limit: 1, offset: 0 });
  if (error || !remaining || remaining.length > 0) throw new Error("photo_cleanup_unconfirmed");
  await clearDeletedAvatarRetirements(userId);
}
