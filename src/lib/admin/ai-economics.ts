import { prisma } from "@/lib/db/client";

const WINDOW_DAYS = 30;
const USD_TO_EUR_ESTIMATE = 0.92;

export type AIEconomics = {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  activeUsers: number;
  costUsd: number;
  costEurEstimate: number;
  costPerCallUsd: number;
  costPerActiveUserUsd: number;
  byFeature: Array<{ feature: string; calls: number; costUsd: number }>;
};

export async function getAIEconomics(): Promise<AIEconomics> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const [totals, grouped, users] = await Promise.all([
    prisma.aiUsageEvent.aggregate({
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { inputTokens: true, outputTokens: true, estimatedCostUsdMicros: true },
    }),
    prisma.aiUsageEvent.groupBy({
      by: ["feature"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      _sum: { estimatedCostUsdMicros: true },
      orderBy: { _sum: { estimatedCostUsdMicros: "desc" } },
    }),
    prisma.aiUsageEvent.findMany({
      where: { createdAt: { gte: since }, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const calls = totals._count._all;
  const activeUsers = users.length;
  const costUsd = (totals._sum.estimatedCostUsdMicros ?? 0) / 1_000_000;
  const costEurEstimate = costUsd * USD_TO_EUR_ESTIMATE;

  return {
    calls,
    inputTokens: totals._sum.inputTokens ?? 0,
    outputTokens: totals._sum.outputTokens ?? 0,
    activeUsers,
    costUsd,
    costEurEstimate,
    costPerCallUsd: calls > 0 ? costUsd / calls : 0,
    costPerActiveUserUsd: activeUsers > 0 ? costUsd / activeUsers : 0,
    byFeature: grouped.slice(0, 6).map((item) => ({
      feature: item.feature,
      calls: item._count._all,
      costUsd: (item._sum.estimatedCostUsdMicros ?? 0) / 1_000_000,
    })),
  };
}
