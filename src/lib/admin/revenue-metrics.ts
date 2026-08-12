import { prisma } from "@/lib/db/client";

export type RevenueMetrics = {
  collectedCents30d: number;
  successfulPayments30d: number;
  failedPayments30d: number;
  uniquePayingCustomers30d: number;
};

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [paid, failed, customers] = await Promise.all([
    prisma.billingEvent.aggregate({
      where: { kind: "PAID", occurredAt: { gte: since }, currency: "EUR" },
      _count: { _all: true },
      _sum: { amountCents: true },
    }),
    prisma.billingEvent.count({ where: { kind: "FAILED", occurredAt: { gte: since } } }),
    prisma.billingEvent.findMany({
      where: { kind: "PAID", occurredAt: { gte: since } },
      select: { stripeCustomerId: true },
      distinct: ["stripeCustomerId"],
    }),
  ]);

  return {
    collectedCents30d: paid._sum.amountCents ?? 0,
    successfulPayments30d: paid._count._all,
    failedPayments30d: failed,
    uniquePayingCustomers30d: customers.length,
  };
}
