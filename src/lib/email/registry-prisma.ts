import { prisma } from "@/lib/db/client";
import type { RegistryDatabase, RegistryTransaction } from "./delivery-registry";

export const registryDatabase: RegistryDatabase = {
  transaction: work => prisma.$transaction(async tx => {
    const adapter: RegistryTransaction = {
      async query<T>(sql: string, params: unknown[]) {
        // SQL interne fixe, valeurs toujours liées séparément. Aucun fragment
        // de requête ne provient d'un utilisateur.
        if (!/\b(SELECT|RETURNING)\b/i.test(sql)) {
          await tx.$executeRawUnsafe(sql, ...params);
          return { rows: [] as T[] };
        }
        return { rows: await tx.$queryRawUnsafe<T[]>(sql, ...params) };
      },
    };
    return work(adapter);
  }),
};
