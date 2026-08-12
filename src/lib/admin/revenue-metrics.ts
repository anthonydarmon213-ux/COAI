import { prisma } from "@/lib/db/client";

export type RevenueMetrics = {
  collectedCents30d: number;
  successfulPayments30d: number;
  failedPayments30d: number;
  recoveredPayments30d: number;
  recoveredCents30d: number;
  uniquePayingCustomers30d: number;
  endedTrials30d: number;
  convertedTrials30d: number;
  trialConversionRate30d: number;
};

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recoveryLookback = new Date(since.getTime() - 14 * 24 * 60 * 60 * 1000);
  const [paid, failed, customers, endedTrials, recentPaidEvents, failedEvents] = await Promise.all([
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
    prisma.subscription.findMany({
      where: { trialEnd: { gte: since, lte: new Date() } },
      select: { stripeCustomerId: true, trialEnd: true },
    }),
    prisma.billingEvent.findMany({
      where: { kind: "PAID", occurredAt: { gte: since } },
      select: { stripeCustomerId: true, occurredAt: true },
    }),
    prisma.billingEvent.findMany({
      where: { kind: "FAILED", occurredAt: { gte: recoveryLookback } },
      select: { stripeCustomerId: true, occurredAt: true },
    }),
  ]);

  const recoveredEvents = recentPaidEvents.filter((payment) =>
    failedEvents.some(
      (failure) =>
        failure.stripeCustomerId === payment.stripeCustomerId &&
        failure.occurredAt < payment.occurredAt &&
        payment.occurredAt.getTime() - failure.occurredAt.getTime() <= 14 * 24 * 60 * 60 * 1000
    )
  );
  const recoveredIds = new Set(recoveredEvents.map((event) => `${event.stripeCustomerId}-${event.occurredAt.toISOString()}`));
  const paidAmounts = await prisma.billingEvent.findMany({
    where: { kind: "PAID", occurredAt: { gte: since }, currency: "EUR" },
    select: { stripeCustomerId: true, occurredAt: true, amountCents: true },
  });

  const convertedTrials30d = endedTrials.filter((trial) =>
    recentPaidEvents.some(
      (payment) =>
        payment.stripeCustomerId === trial.stripeCustomerId &&
        trial.trialEnd &&
        payment.occurredAt >= trial.trialEnd
    )
  ).length;

  return {
    collectedCents30d: paid._sum.amountCents ?? 0,
    successfulPayments30d: paid._count._all,
    failedPayments30d: failed,
    recoveredPayments30d: recoveredIds.size,
    recoveredCents30d: paidAmounts
      .filter((event) => recoveredIds.has(`${event.stripeCustomerId}-${event.occurredAt.toISOString()}`))
      .reduce((total, event) => total + event.amountCents, 0),
    uniquePayingCustomers30d: customers.length,
    endedTrials30d: endedTrials.length,
    convertedTrials30d,
    trialConversionRate30d:
      endedTrials.length > 0 ? (convertedTrials30d / endedTrials.length) * 100 : 0,
  };
}
