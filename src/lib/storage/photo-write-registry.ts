import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/db/client";
import type { Prisma } from "@prisma/client";

// Server-only coordination. Closed gates survive account deletion so a request
// authenticated before deletion cannot reopen uploads. Never expire unresolved
// writes: a timeout is not proof that Storage did not accept the file.
function ownerKey(userId: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) throw new Error("invalid_photo_owner");
  return createHash("sha256").update("coai-photo-owner-v1:" + userId).digest("hex");
}

async function lock(tx: Prisma.TransactionClient, key: string) {
  await tx.$executeRaw`INSERT INTO photo_owner_gates ("ownerKey") VALUES (${key}) ON CONFLICT DO NOTHING`;
  const rows = await tx.$queryRaw<{ closed: boolean }[]>`SELECT closed FROM photo_owner_gates WHERE "ownerKey"=${key} FOR UPDATE`;
  const gate = rows[0];
  if (rows.length !== 1 || !gate) throw new Error("photo_gate_missing");
  return gate;
}

export async function reservePhotoWrite(userId: string): Promise<string> {
  const key = ownerKey(userId), operation = randomUUID();
  await prisma.$transaction(async tx => {
    if ((await lock(tx, key)).closed) throw new Error("photo_owner_deleting");
    await tx.$executeRaw`INSERT INTO photo_uploads (id, "ownerKey", "dispatchStarted") VALUES (${operation}, ${key}, false)`;
  }, { maxWait: 5000, timeout: 5000 });
  return operation;
}

// One-way dispatch admission, serialized with deletion. A reservation can be
// cancelled safely ONLY while this claim has not committed. After admission,
// including process death before the HTTP call, absence/time is never evidence.
export async function beginPhotoWrite(userId: string, operation: string): Promise<void> {
  const key = ownerKey(userId);
  await prisma.$transaction(async tx => {
    if ((await lock(tx, key)).closed) throw new Error("photo_owner_deleting");
    const count = await tx.$executeRaw`UPDATE photo_uploads SET "dispatchStarted"=true
      WHERE id=${operation} AND "ownerKey"=${key} AND NOT "dispatchStarted" AND NOT settled`;
    if (count !== 1) throw new Error("photo_dispatch_not_available");
  }, { maxWait: 5000, timeout: 5000 });
}

export async function confirmPhotoWrite(userId: string, operation: string): Promise<void> {
  const key = ownerKey(userId);
  await prisma.$transaction(async tx => {
    await lock(tx, key);
    const count = await tx.$executeRaw`UPDATE photo_uploads SET settled=true WHERE id=${operation} AND "ownerKey"=${key} AND "dispatchStarted"`;
    if (count !== 1) throw new Error("photo_reservation_missing");
  }, { maxWait: 5000, timeout: 5000 });
}

const IMMUTABLE_PHOTO_NAME = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/;
const RETIRABLE_AVATAR_NAME = /^(?:avatar|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.(jpg|png|webp)$/;

// Publish the new avatar and record the old one in ONE transaction. A process
// exit after commit cannot lose the cleanup task. The owner gate serializes
// replacements with each other and with account deletion; no Storage I/O here.
export async function commitAvatarPhoto(userId: string, profileId: string, path: string): Promise<void> {
  const key = ownerKey(userId);
  const name = path.startsWith(`${userId}/`) ? path.slice(userId.length + 1) : "";
  const operation = IMMUTABLE_PHOTO_NAME.exec(name)?.[1];
  if (!operation) throw new Error("invalid_avatar_path");
  await prisma.$transaction(async tx => {
    if ((await lock(tx, key)).closed) throw new Error("photo_owner_deleting");
    const claimed = await tx.$executeRaw`UPDATE photo_uploads SET "avatarCommitted"=true
      WHERE id=${operation} AND "ownerKey"=${key} AND settled AND "dispatchStarted" AND NOT "avatarCommitted"`;
    if (claimed !== 1) throw new Error("avatar_write_not_publishable");
    const profile = await tx.user.findFirst({
      where: { id: profileId, supabaseAuthId: userId }, select: { avatarPath: true },
    });
    if (!profile) throw new Error("avatar_profile_missing");
    await tx.user.update({ where: { id: profileId }, data: { avatarPath: path } });
    const old = profile.avatarPath;
    if (old && old !== path) {
      const oldName = old.startsWith(`${userId}/`) ? old.slice(userId.length + 1) : "";
      // Never turn a malformed / foreign DB value into a privileged deletion.
      if (!RETIRABLE_AVATAR_NAME.test(oldName)) throw new Error("invalid_previous_avatar_path");
      await tx.$executeRaw`UPDATE photo_uploads SET "retiredAvatarName"=${oldName}, "retiredAvatarOwner"=${userId}
        WHERE id=${operation} AND "ownerKey"=${key}`;
    }
  }, { maxWait: 5000, timeout: 5000 });
}

export async function pendingAvatarRetirements(userId: string): Promise<{ id: string; name: string }[]> {
  const key = ownerKey(userId);
  const rows = await prisma.$queryRaw<{ id: string; name: string }[]>`SELECT id, "retiredAvatarName" AS name
    FROM photo_uploads WHERE "ownerKey"=${key} AND "retiredAvatarName" IS NOT NULL ORDER BY id LIMIT 100`;
  if (rows.some(row => !RETIRABLE_AVATAR_NAME.test(row.name))) throw new Error("invalid_retired_avatar_path");
  return rows;
}

export async function confirmAvatarRetirement(userId: string, operation: string, name: string): Promise<void> {
  const key = ownerKey(userId);
  await prisma.$executeRaw`UPDATE photo_uploads SET "retiredAvatarName"=NULL, "retiredAvatarOwner"=NULL, "retirementRetryAt"=NULL
    WHERE id=${operation} AND "ownerKey"=${key} AND "retiredAvatarName"=${name}`;
}

export async function clearDeletedAvatarRetirements(userId: string): Promise<void> {
  const key = ownerKey(userId);
  await prisma.$transaction(async tx => {
    if (!(await lock(tx, key)).closed) throw new Error("photo_owner_not_closed");
    await tx.$executeRaw`UPDATE photo_uploads SET "retiredAvatarName"=NULL, "retiredAvatarOwner"=NULL, "retirementRetryAt"=NULL WHERE "ownerKey"=${key}`;
  }, { maxWait: 5000, timeout: 5000 });
}

export type AvatarRetirementTask = { id: string; ownerKey: string; userId: string; name: string };

export function isValidAvatarRetirement(task: AvatarRetirementTask): boolean {
  try {
    return ownerKey(task.userId) === task.ownerKey && RETIRABLE_AVATAR_NAME.test(task.name);
  } catch {
    return false;
  }
}

export async function claimAvatarRetirements(): Promise<AvatarRetirementTask[]> {
  // A short claim on ALREADY retired paths, not an expiry of unresolved writes.
  // If this worker dies, another may retry after five minutes. Retired paths
  // cannot be republished, so duplicate removal after claim expiry is safe.
  // SKIP LOCKED distributes simultaneous workers; never hold DB locks over I/O.
  return prisma.$queryRaw<AvatarRetirementTask[]>`WITH candidates AS (
    SELECT id FROM photo_uploads
    WHERE "retiredAvatarName" IS NOT NULL
      AND ("retirementRetryAt" IS NULL OR "retirementRetryAt" <= NOW())
    ORDER BY "retirementRetryAt" ASC NULLS FIRST, id
    LIMIT 20 FOR UPDATE SKIP LOCKED
  ) UPDATE photo_uploads p SET "retirementRetryAt"=NOW() + INTERVAL '5 minutes'
    FROM candidates c WHERE p.id=c.id
    RETURNING p.id, p."ownerKey", p."retiredAvatarOwner" AS "userId", p."retiredAvatarName" AS name`;
}

export class UnresolvedPhotoWritesError extends Error {
  constructor(public readonly operations: readonly string[]) {
    super("photo_writes_unresolved");
    this.name = "UnresolvedPhotoWritesError";
  }
}

export async function closePhotoWrites(userId: string): Promise<void> {
  const key = ownerKey(userId);
  const pending = await prisma.$transaction(async tx => {
    await lock(tx, key);
    await tx.$executeRaw`UPDATE photo_owner_gates SET closed=true WHERE "ownerKey"=${key}`;
    // Closed gate + unclaimed dispatch is positive proof that this operation
    // cannot write. A stale caller must pass beginPhotoWrite, which now refuses.
    // The migration defaults legacy rows to true: never infer old writes absent.
    await tx.$executeRaw`UPDATE photo_uploads SET settled=true
      WHERE "ownerKey"=${key} AND NOT "dispatchStarted" AND NOT settled`;
    return tx.$queryRaw<{ id: string }[]>`SELECT id FROM photo_uploads
      WHERE "ownerKey"=${key} AND NOT settled ORDER BY id LIMIT 1001`;
  }, { maxWait: 5000, timeout: 5000 });
  // Throw outside the transaction: the closed gate must remain committed.
  if (pending.length > 1000) throw new Error("photo_cleanup_requires_assistance");
  if (pending.length) throw new UnresolvedPhotoWritesError(pending.map(row => row.id));
}
