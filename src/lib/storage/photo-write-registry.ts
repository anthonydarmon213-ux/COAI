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
    await tx.$executeRaw`INSERT INTO photo_uploads (id, "ownerKey") VALUES (${operation}, ${key})`;
  }, { maxWait: 5000, timeout: 5000 });
  return operation;
}

export async function confirmPhotoWrite(userId: string, operation: string): Promise<void> {
  const key = ownerKey(userId);
  await prisma.$transaction(async tx => {
    await lock(tx, key);
    const count = await tx.$executeRaw`UPDATE photo_uploads SET settled=true WHERE id=${operation} AND "ownerKey"=${key}`;
    if (count !== 1) throw new Error("photo_reservation_missing");
  }, { maxWait: 5000, timeout: 5000 });
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
    return tx.$queryRaw<{ id: string }[]>`SELECT id FROM photo_uploads
      WHERE "ownerKey"=${key} AND NOT settled ORDER BY id LIMIT 1001`;
  }, { maxWait: 5000, timeout: 5000 });
  // Throw outside the transaction: the closed gate must remain committed.
  if (pending.length > 1000) throw new Error("photo_cleanup_requires_assistance");
  if (pending.length) throw new UnresolvedPhotoWritesError(pending.map(row => row.id));
}
