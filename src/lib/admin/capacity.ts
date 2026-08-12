import { prisma } from "@/lib/db/client";

const MEBIBYTE = 1024 * 1024;
const FREE_DATABASE_BYTES = 500 * MEBIBYTE;
const FREE_STORAGE_BYTES = 1024 * MEBIBYTE;

export type CapacityItem = {
  usedBytes: number;
  limitBytes: number;
  percent: number;
};

export type CapacitySnapshot = {
  database: CapacityItem;
  storage: CapacityItem;
};

export async function getCapacitySnapshot(): Promise<CapacitySnapshot | null> {
  try {
    const [databaseRows, storageRows] = await Promise.all([
      prisma.$queryRaw<Array<{ bytes: bigint }>>`
        SELECT pg_database_size(current_database())::bigint AS bytes
      `,
      prisma.$queryRaw<Array<{ bytes: bigint }>>`
        SELECT COALESCE(SUM((metadata->>'size')::bigint), 0)::bigint AS bytes
        FROM storage.objects
      `,
    ]);

    return {
      database: makeItem(Number(databaseRows[0]?.bytes ?? 0), FREE_DATABASE_BYTES),
      storage: makeItem(Number(storageRows[0]?.bytes ?? 0), FREE_STORAGE_BYTES),
    };
  } catch (error) {
    console.warn("[capacity] Indicateur Supabase indisponible", error);
    return null;
  }
}

function makeItem(usedBytes: number, limitBytes: number): CapacityItem {
  return {
    usedBytes,
    limitBytes,
    percent: Math.min(100, (usedBytes / limitBytes) * 100),
  };
}

export function formatCapacity(bytes: number): string {
  if (bytes < MEBIBYTE) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / MEBIBYTE).toFixed(bytes < 10 * MEBIBYTE ? 1 : 0)} Mo`;
}
